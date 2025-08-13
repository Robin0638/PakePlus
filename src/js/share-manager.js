/**
 * 分享管理模块
 * 提供闹钟信息分享功能
 */

class ShareManager {
    constructor() {
        this.initializeShareUI();
    }

    /**
     * 初始化分享UI
     */
    initializeShareUI() {
        // 移除可能存在的旧通知元素
        const existingToast = document.getElementById('shareSuccessToast');
        if (existingToast) {
            existingToast.remove();
        }
    }

    /**
     * 分享闹钟信息
     * @param {Object} alarm - 闹钟对象
     */
    async shareAlarm(alarm) {
        try {
            // 获取分享按钮
            const shareButton = document.querySelector(`[data-alarm-id="${alarm.id}"] .share-button`);
            if (shareButton) {
                shareButton.classList.add('loading');
                shareButton.disabled = true;
            }

            // 生成分享文本
            const shareText = this.generateShareText(alarm);
            
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
            console.error('分享失败:', error);
            this.showShareError();
            
            // 恢复按钮状态
            const shareButton = document.querySelector(`[data-alarm-id="${alarm.id}"] .share-button`);
            if (shareButton) {
                shareButton.classList.remove('loading');
                shareButton.disabled = false;
            }
        }
    }

    /**
     * 生成分享文本
     * @param {Object} alarm - 闹钟对象
     * @returns {string} 分享文本
     */
    generateShareText(alarm) {
        const daysText = this.getAlarmDaysText(alarm);
        const soundName = (typeof alarmSounds !== 'undefined' && alarmSounds[alarm.sound]) ? alarmSounds[alarm.sound].name : '默认铃声';
        const status = alarm.isEnabled ? '🟢 已启用' : '🔴 已禁用';
        const repeatType = alarm.isRepeating ? '🔄 重复闹钟' : '⏰ 一次性闹钟';
        
        // 计算下次提醒时间
        let nextTimeText = '';
        if (alarm.isEnabled) {
            const nextTime = this.calculateNextAlarmTime(alarm);
            if (nextTime) {
                const now = new Date();
                const diff = Math.max(0, nextTime - now);
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                
                if (hours > 0 || minutes > 0) {
                    const prefix = (alarm.isRepeating && alarm.days && alarm.days.length > 0) ? '距离下次提醒' : '距离第一次提醒';
                    nextTimeText = `\n⏱️ ${prefix}：${hours ? hours + '小时' : ''}${minutes ? minutes + '分钟' : ''}`;
                }
            }
        }

        const shareText = `⏰ 我的闹钟信息 📱

🔔 闹钟名称：${alarm.name}
🕐 提醒时间：${alarm.time}
${status}
${repeatType}
📅 重复日期：${daysText}
🎵 铃声：${soundName}${nextTimeText}

💡 来自「好用时钟」应用
✨ 让时间管理更轻松！

#好用时钟 #闹钟 #时间管理`;

        return shareText;
    }

    /**
     * 获取闹钟重复日期文本
     * @param {Object} alarm - 闹钟对象
     * @returns {string} 日期文本
     */
    getAlarmDaysText(alarm) {
        if (!alarm.isRepeating) {
            return '仅一次';
        }
        
        if (!alarm.days || alarm.days.length === 0) {
            return '每天';
        }
        
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const selectedDays = alarm.days.map(day => dayNames[day]).join('、');
        
        if (alarm.days.length === 7) {
            return '每天';
        } else if (alarm.days.length === 5 && 
                   alarm.days.includes(1) && alarm.days.includes(2) && 
                   alarm.days.includes(3) && alarm.days.includes(4) && 
                   alarm.days.includes(5)) {
            return '工作日';
        } else if (alarm.days.length === 2 && 
                   alarm.days.includes(0) && alarm.days.includes(6)) {
            return '周末';
        } else {
            return selectedDays;
        }
    }

    /**
     * 计算下次闹钟时间
     * @param {Object} alarm - 闹钟对象
     * @returns {Date|null} 下次闹钟时间
     */
    calculateNextAlarmTime(alarm) {
        if (!alarm.isEnabled) return null;

        const now = new Date();
        let alarmHour = parseInt(alarm.time.split(':')[0], 10);
        let alarmMinute = parseInt(alarm.time.split(':')[1], 10);
        let next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), alarmHour, alarmMinute, 0, 0);
        
        if (alarm.isRepeating) {
            if (next <= now) {
                // 今天已过，找下一个有效天
                let addDays = 1;
                if (Array.isArray(alarm.days) && alarm.days.length > 0) {
                    let cur = now.getDay();
                    let minDelta = 8;
                    for (let d of alarm.days) {
                        let delta = (d - cur + 7) % 7;
                        if (delta === 0 && next > now) delta = 7; // 今天但还没到点
                        if (delta > 0 && delta < minDelta) minDelta = delta;
                    }
                    addDays = minDelta;
                }
                next.setDate(next.getDate() + addDays);
            }
        } else {
            // 不重复闹钟逻辑
            if (next <= now) {
                // 如果今天的时间已经过了，设置为明天
                next.setDate(next.getDate() + 1);
            }
        }
        
        return next;
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
            
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('复制失败:', err);
                throw err;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    /**
     * 显示分享成功提示
     */
    showShareSuccess() {
        // 移除可能存在的旧通知
        const existingToast = document.getElementById('shareSuccessToast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建新的通知元素
        const toast = document.createElement('div');
        toast.id = 'shareSuccessToast';
        toast.className = 'share-success';
        toast.innerHTML = `
            <i data-lucide="check-circle"></i>
            <span>闹钟信息已复制到剪贴板！</span>
        `;
        document.body.appendChild(toast);
        
        // 强制重排后显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.classList.add('hide');
            // 动画结束后完全移除元素
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500);
        }, 3000);
        
        // 重新创建图标
        lucide.createIcons();
    }

    /**
     * 显示分享错误提示
     */
    showShareError() {
        // 移除可能存在的旧通知
        const existingToast = document.getElementById('shareSuccessToast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建新的通知元素
        const toast = document.createElement('div');
        toast.id = 'shareSuccessToast';
        toast.className = 'share-success';
        toast.innerHTML = `
            <i data-lucide="x-circle"></i>
            <span>分享失败，请重试</span>
        `;
        toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        toast.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.4)';
        document.body.appendChild(toast);
        
        // 强制重排后显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.classList.add('hide');
            // 动画结束后完全移除元素
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500);
        }, 3000);
        
        // 重新创建图标
        lucide.createIcons();
    }
}

// 全局分享管理器实例
let shareManager = null;

/**
 * 初始化分享管理器
 */
function initializeShareManager() {
    if (!shareManager) {
        shareManager = new ShareManager();
    }
}

/**
 * 分享闹钟信息（全局函数）
 * @param {number} alarmId - 闹钟ID
 */
function shareAlarm(alarmId) {
    // 确保分享管理器已初始化
    if (!shareManager) {
        initializeShareManager();
    }
    
    // 确保alarms变量存在
    if (typeof alarms === 'undefined') {
        console.error('alarms变量未定义');
        return;
    }
    
    const alarm = alarms.find(a => a.id === alarmId);
    if (alarm) {
        shareManager.shareAlarm(alarm);
    }
} 