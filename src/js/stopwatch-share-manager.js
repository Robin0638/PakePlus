// 秒表分享管理器
class StopwatchShareManager {
    constructor() {
        this.feedback = null;
    }

    // 格式化毫秒为可读时间
    formatTime(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);

        let timeString = '';
        
        if (hours > 0) {
            timeString += `${hours.toString().padStart(2, '0')}:`;
        }
        
        timeString += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (hours === 0) {
            timeString += `.${milliseconds.toString().padStart(2, '0')}`;
        }

        return timeString;
    }

    // 生成分享文本
    generateShareText(stopwatch) {
        const timeString = this.formatTime(stopwatch.time);
        const name = stopwatchRenameManager ? stopwatchRenameManager.getDisplayName(stopwatch.id, stopwatch.name) : stopwatch.name;
        
        // 生成带emoji的分享文本
        let shareText = `⏱️ ${name}\n`;
        
        // 如果有时间记录，显示时间
        if (stopwatch.time > 0) {
            shareText += `⏰ 时间: ${timeString}\n`;
        }
        
        // 如果有计次记录，添加计次信息
        if (stopwatch.laps && stopwatch.laps.length > 0) {
            shareText += `📊 计次记录:\n`;
            stopwatch.laps.forEach((lap, index) => {
                const lapTime = typeof lap === 'object' ? lap.time : lap;
                const interval = typeof lap === 'object' ? lap.interval : 0;
                const lapTimeString = this.formatTime(lapTime);
                
                shareText += `  ${index + 1}. ${lapTimeString}`;
                if (index > 0) {
                    const intervalString = this.formatTime(interval);
                    shareText += ` (+${intervalString})`;
                }
                shareText += '\n';
            });
        }
        
        // 如果既没有时间也没有计次记录，显示提示
        if (stopwatch.time === 0 && (!stopwatch.laps || stopwatch.laps.length === 0)) {
            shareText += `📝 暂无记录\n`;
        }
        
        shareText += `\n📱 来自好用时钟`;
        
        return shareText;
    }

    // 复制文本到剪贴板
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                // 使用现代 Clipboard API
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // 降级到传统方法
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (error) {
            console.error('复制到剪贴板失败:', error);
            return false;
        }
    }

    // 分享秒表
    async shareStopwatch(stopwatchId) {
        const stopwatch = stopwatches.find(sw => sw.id === stopwatchId);
        if (!stopwatch) {
            console.error('秒表不存在:', stopwatchId);
            return;
        }

        // 生成分享文本
        const shareText = this.generateShareText(stopwatch);
        
        // 复制到剪贴板
        const success = await this.copyToClipboard(shareText);
        
        if (success) {
            this.showShareFeedback();
            console.log('秒表分享成功:', stopwatchId);
        } else {
            alert('复制失败，请手动复制以下内容：\n\n' + shareText);
        }
    }

    // 显示分享反馈
    showShareFeedback() {
        this.createFeedback();
        this.feedback.classList.add('show');
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 2秒后自动隐藏
        setTimeout(() => {
            this.hideShareFeedback();
        }, 2000);
    }

    // 创建反馈提示
    createFeedback() {
        // 如果已存在反馈元素，先移除
        if (this.feedback && this.feedback.parentNode) {
            this.feedback.parentNode.removeChild(this.feedback);
        }
        
        this.feedback = document.createElement('div');
        this.feedback.className = 'stopwatch-share-feedback';
        this.feedback.innerHTML = `
            <i data-lucide="check"></i>
            已复制到剪贴板
        `;
        document.body.appendChild(this.feedback);
    }

    // 隐藏分享反馈
    hideShareFeedback() {
        this.feedback.classList.add('hide');
        this.feedback.classList.remove('show');
        
        // 动画完成后移除元素
        setTimeout(() => {
            if (this.feedback && this.feedback.parentNode) {
                this.feedback.parentNode.removeChild(this.feedback);
            }
        }, 300); // 与CSS动画时长一致
    }

    // 为卡片添加分享按钮
    addShareButtonToCard(card, stopwatchId) {
        // 检查是否已存在分享按钮
        let shareButton = card.querySelector('.stopwatch-share-button');
        
        if (!shareButton) {
            shareButton = document.createElement('button');
            shareButton.className = 'stopwatch-share-button';
            shareButton.innerHTML = `
                <i data-lucide="share-2"></i>
                分享
            `;
            shareButton.title = '分享秒表';
            shareButton.onclick = (e) => {
                e.stopPropagation();
                this.shareStopwatch(stopwatchId);
            };
            card.appendChild(shareButton);
        } else {
            // 如果按钮已存在，更新其点击事件
            shareButton.onclick = (e) => {
                e.stopPropagation();
                this.shareStopwatch(stopwatchId);
            };
        }
        
        // 根据秒表状态控制按钮显示
        this.updateShareButtonVisibility(shareButton, stopwatchId);
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    // 更新分享按钮的显示状态
    updateShareButtonVisibility(shareButton, stopwatchId) {
        const stopwatch = stopwatches.find(sw => sw.id === stopwatchId);
        if (!stopwatch) return;

        // 只在暂停且有内容可分享时显示分享按钮
        // 有内容可分享的条件：有时间记录 或 有计次记录
        const hasTimeToShare = stopwatch.time > 0;
        const hasLapsToShare = stopwatch.laps && stopwatch.laps.length > 0;
        
        if (!stopwatch.isRunning && (hasTimeToShare || hasLapsToShare)) {
            shareButton.classList.add('show');
        } else {
            shareButton.classList.remove('show');
        }
    }

    // 初始化所有卡片
    initializeAllCards() {
        const cards = document.querySelectorAll('.card[data-stopwatch-id]');
        cards.forEach(card => {
            const stopwatchId = parseInt(card.getAttribute('data-stopwatch-id'));
            if (stopwatchId) {
                this.addShareButtonToCard(card, stopwatchId);
            }
        });
    }

    // 更新所有分享按钮的显示状态
    updateAllShareButtons() {
        const cards = document.querySelectorAll('.card[data-stopwatch-id]');
        cards.forEach(card => {
            const stopwatchId = parseInt(card.getAttribute('data-stopwatch-id'));
            const shareButton = card.querySelector('.stopwatch-share-button');
            if (shareButton && stopwatchId) {
                this.updateShareButtonVisibility(shareButton, stopwatchId);
            }
        });
    }
}

// 全局实例
let stopwatchShareManager = null;

// 初始化秒表分享功能
function initializeStopwatchShareFeature() {
    if (!stopwatchShareManager) {
        stopwatchShareManager = new StopwatchShareManager();
    }
    
    // 重写renderStopwatches函数以支持分享
    const originalRenderStopwatches = window.renderStopwatches;
    window.renderStopwatches = function() {
        // 调用原始渲染函数
        originalRenderStopwatches();
        
        // 初始化所有卡片的分享按钮
        if (stopwatchShareManager) {
            stopwatchShareManager.initializeAllCards();
        }
    };
    
    // 确保在页面加载完成后立即应用分享状态
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (stopwatchShareManager) {
                    stopwatchShareManager.initializeAllCards();
                }
            }, 100);
        });
    } else {
        setTimeout(() => {
            if (stopwatchShareManager) {
                stopwatchShareManager.initializeAllCards();
            }
        }, 100);
    }
    
    console.log('秒表分享功能已初始化');
} 