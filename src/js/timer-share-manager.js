/**
 * 计时器分享管理模块
 * 提供计时器信息分享功能
 */

class TimerShareManager {
    constructor() {
        this.initializeShareUI();
    }

    /**
     * 初始化分享UI
     */
    initializeShareUI() {
        // 移除可能存在的旧通知元素
        const existingToast = document.getElementById('timerShareSuccessToast');
        if (existingToast) {
            existingToast.remove();
        }
    }

    /**
     * 分享计时器信息
     * @param {Object} timer - 计时器对象
     */
    async shareTimer(timer) {
        try {
            // 获取分享按钮
            const shareButton = document.querySelector(`[data-timer-id="${timer.id}"] .timer-share-button`);
            if (shareButton) {
                shareButton.classList.add('loading');
                shareButton.disabled = true;
            }

            // 生成分享文本
            const shareText = this.generateShareText(timer);
            
            // 复制到剪贴板
            await this.copyToClipboard(shareText);
            
            // 显示成功提示
            this.showShareSuccess();
            
            // 添加动画效果
            if (shareButton) {
                shareButton.classList.remove('loading');
                shareButton.classList.add('animating');
                setTimeout(() => {
                    shareButton.classList.remove('animating');
                    shareButton.disabled = false;
                }, 600);
            }

        } catch (error) {
            console.error('计时器分享失败:', error);
            this.showShareError();
            
            // 恢复按钮状态
            const shareButton = document.querySelector(`[data-timer-id="${timer.id}"] .timer-share-button`);
            if (shareButton) {
                shareButton.classList.remove('loading');
                shareButton.disabled = false;
            }
        }
    }

    /**
     * 生成分享文本
     * @param {Object} timer - 计时器对象
     * @returns {string} 分享文本
     */
    generateShareText(timer) {
        const status = timer.isRunning ? '🟢 运行中' : 
                      timer.remainingTime === 0 ? '✅ 已完成' : '⏸️ 已暂停';
        
        const progress = ((timer.totalTime - timer.remainingTime) / timer.totalTime) * 100;
        const progressBar = this.generateProgressBar(progress);
        
        const soundName = (typeof alarmSounds !== 'undefined' && alarmSounds[timer.sound]) ? alarmSounds[timer.sound].name : '默认铃声';
        
        // 计算剩余时间
        let remainingTimeText = '';
        if (timer.remainingTime > 0) {
            const hours = Math.floor(timer.remainingTime / 3600000);
            const minutes = Math.floor((timer.remainingTime % 3600000) / 60000);
            const seconds = Math.floor((timer.remainingTime % 60000) / 1000);
            
            remainingTimeText = `\n⏱️ 剩余时间：${hours > 0 ? hours + '小时' : ''}${minutes > 0 ? minutes + '分钟' : ''}${seconds}秒`;
        }

        // 完成次数信息
        const completionText = timer.completedCount > 0 ? `\n🎯 已完成次数：${timer.completedCount}次` : '';

        // 累计完成时间
        const totalCompletedText = timer.totalCompletedTime > 0 ? 
            `\n📊 累计完成时长：${this.formatMilliseconds(timer.totalCompletedTime)}` : '';

        const shareText = `⏰ 我的计时器信息 📱

🔔 计时器名称：${timer.name}
⏲️ 总时长：${this.formatMilliseconds(timer.totalTime)}
${status}
${remainingTimeText}
${completionText}
${totalCompletedText}

📈 进度：${progress.toFixed(1)}%
${progressBar}

🔊 铃声：${soundName}

💡 来自好用时钟应用 ⭐`;

        return shareText;
    }

    /**
     * 生成进度条
     * @param {number} progress - 进度百分比
     * @returns {string} 进度条文本
     */
    generateProgressBar(progress) {
        const filledBlocks = Math.floor(progress / 10);
        const emptyBlocks = 10 - filledBlocks;
        
        const filled = '█'.repeat(filledBlocks);
        const empty = '░'.repeat(emptyBlocks);
        
        return `${filled}${empty}`;
    }

    /**
     * 格式化毫秒为可读时间
     * @param {number} ms - 毫秒数
     * @returns {string} 格式化后的时间
     */
    formatMilliseconds(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        if (hours > 0) {
            return `${hours}小时${minutes}分钟${seconds}秒`;
        } else if (minutes > 0) {
            return `${minutes}分钟${seconds}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     */
    async copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            // 使用现代 Clipboard API
            await navigator.clipboard.writeText(text);
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
            
            return new Promise((resolve, reject) => {
                document.execCommand('copy') ? resolve() : reject();
                textArea.remove();
            });
        }
    }

    /**
     * 显示分享成功提示
     */
    showShareSuccess() {
        // 移除可能存在的旧提示
        const existingToast = document.getElementById('timerShareSuccessToast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'timerShareSuccessToast';
        toast.className = 'timer-share-success';
        toast.innerHTML = `
            <i data-lucide="check-circle"></i>
            <span>计时器信息已复制到剪贴板！</span>
        `;
        
        document.body.appendChild(toast);
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 500);
        }, 3000);
    }

    /**
     * 显示分享错误提示
     */
    showShareError() {
        // 移除可能存在的旧提示
        const existingToast = document.getElementById('timerShareErrorToast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'timerShareErrorToast';
        toast.className = 'timer-share-error';
        toast.innerHTML = `
            <i data-lucide="x-circle"></i>
            <span>分享失败，请重试</span>
        `;
        
        document.body.appendChild(toast);
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 500);
        }, 3000);
    }

    /**
     * 为卡片添加分享按钮
     * @param {HTMLElement} card - 计时器卡片元素
     * @param {Object} timer - 计时器对象
     */
    addShareButtonToCard(card, timer) {
        // 查找现有的分享按钮
        let shareButton = card.querySelector('.timer-share-button');
        
        if (!shareButton) {
            // 创建分享按钮
            shareButton = document.createElement('button');
            shareButton.className = 'timer-share-button';
            shareButton.title = '分享计时器信息';
            shareButton.innerHTML = `
                <i data-lucide="share-2"></i>
                <span>分享</span>
            `;
            
            // 添加点击事件
            shareButton.onclick = () => this.shareTimer(timer);
            
            // 插入到卡片中（在收藏按钮旁边）
            const favoriteButton = card.querySelector('.timer-favorite-button');
            if (favoriteButton) {
                favoriteButton.parentNode.insertBefore(shareButton, favoriteButton.nextSibling);
            } else {
                card.appendChild(shareButton);
            }
            
            // 重新创建图标
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }
    }

    /**
     * 初始化所有卡片
     */
    initializeAllCards() {
        const timerCards = document.querySelectorAll('[data-timer-id]');
        console.log(`找到 ${timerCards.length} 个计时器卡片，正在初始化分享按钮`);
        
        timerCards.forEach(card => {
            const timerId = card.getAttribute('data-timer-id');
            if (timerId) {
                // 查找对应的计时器对象
                const timer = window.timers ? window.timers.find(t => t.id == timerId) : null;
                if (timer) {
                    this.addShareButtonToCard(card, timer);
                }
            }
        });
    }
}

// 创建全局计时器分享管理器实例
const timerShareManager = new TimerShareManager();

// 初始化计时器分享功能
function initializeTimerShareFeature() {
    console.log('初始化计时器分享功能...');
    
    // 初始化所有现有卡片
    timerShareManager.initializeAllCards();

    // 监听DOM变化，为新添加的卡片添加分享按钮
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.hasAttribute && node.hasAttribute('data-timer-id')) {
                        const timerId = node.getAttribute('data-timer-id');
                        const timer = window.timers ? window.timers.find(t => t.id == timerId) : null;
                        if (timer) {
                            timerShareManager.addShareButtonToCard(node, timer);
                        }
                    }
                    const timerCards = node.querySelectorAll && node.querySelectorAll('[data-timer-id]');
                    if (timerCards) {
                        timerCards.forEach(card => {
                            const timerId = card.getAttribute('data-timer-id');
                            const timer = window.timers ? window.timers.find(t => t.id == timerId) : null;
                            if (timer) {
                                timerShareManager.addShareButtonToCard(card, timer);
                            }
                        });
                    }
                }
            });
        });
    });

    observer.observe(document.getElementById('timersList'), {
        childList: true,
        subtree: true
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他功能已经加载
    setTimeout(initializeTimerShareFeature, 100);
});

// 导出函数供其他模块使用
window.timerShareManager = timerShareManager;
window.initializeTimerShareFeature = initializeTimerShareFeature; 