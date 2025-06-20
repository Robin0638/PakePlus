/**
 * 通知管理模块
 * 负责处理系统通知和应用内通知
 */

const NotificationManager = {
    /**
     * 初始化通知管理器
     */
    init() {
        console.log('初始化通知管理器');
        
        // 检查浏览器通知支持
        this.isSupported = "Notification" in window;
        
        if (!this.isSupported) {
            console.warn('此浏览器不支持系统通知');
            return;
        }
        
        // 检查用户设置
        const settings = StorageManager.getSettings();
        if (settings && settings.notifications !== false) {
            // 检查通知权限
            this.checkPermission();
        }
        
        // 设置通知图标
        this.icon = 'assets/icons/notification-icon.png';
        this.badge = 'assets/icons/notification-badge.png';
    },
    
    /**
     * 检查通知权限
     */
    checkPermission() {
        if (!this.isSupported) return false;
        
        const permission = Notification.permission;
        
        if (permission === 'granted') {
            console.log('已获得通知权限');
            return true;
        } else if (permission === 'denied') {
            console.warn('用户已拒绝通知权限');
            return false;
        } else {
            // 默认状态，未决定
            console.log('通知权限未决定');
            return null;
        }
    },
    
    /**
     * 请求通知权限
     * @returns {Promise} 权限请求的Promise
     */
    requestPermission() {
        if (!this.isSupported) {
            console.warn('此浏览器不支持系统通知');
            return Promise.resolve(false);
        }
        
        // 如果已经获得授权或被拒绝，则不需要再次请求
        if (Notification.permission === 'granted') {
            return Promise.resolve(true);
        }
        
        if (Notification.permission === 'denied') {
            console.warn('用户已拒绝通知权限，请在浏览器设置中重新授权');
            if (window.UIManager) {
                UIManager.showNotification('通知权限已被拒绝，请在浏览器设置中重新授权');
            }
            return Promise.resolve(false);
        }
        
        // 请求权限
        return Notification.requestPermission()
            .then(permission => {
                if (permission === 'granted') {
                    console.log('用户授予了通知权限');
                    
                    // 发送测试通知
                    this.sendNotification('通知已启用', '您将在重要事件发生时收到通知');
                    
                    return true;
                } else {
                    console.warn('用户拒绝了通知权限');
                    return false;
                }
            })
            .catch(error => {
                console.error('请求通知权限时出错', error);
                return false;
            });
    },
    
    /**
     * 发送系统通知
     * @param {String} title 通知标题
     * @param {String} message 通知内容
     * @param {Object} options 通知选项
     */
    sendNotification(title, message, options = {}) {
        // 检查是否启用了通知
        const settings = StorageManager.getSettings();
        if (settings && settings.notifications === false) {
            console.log('通知已禁用，使用应用内通知');
            if (window.UIManager) {
                UIManager.showNotification(`${title}: ${message}`);
            }
            return;
        }
        
        // 检查浏览器支持和权限
        if (!this.isSupported || Notification.permission !== 'granted') {
            console.log('无法发送系统通知，使用应用内通知');
            if (window.UIManager) {
                UIManager.showNotification(`${title}: ${message}`);
            }
            return;
        }
        
        try {
            // 设置通知选项
            const notificationOptions = {
                body: message,
                icon: this.icon || options.icon,
                badge: this.badge || options.badge,
                tag: options.tag || 'default',
                renotify: options.renotify || false,
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                timestamp: options.timestamp || Date.now(),
                vibrate: options.vibrate || [200, 100, 200]
            };
            
            // 播放通知声音
            if (!notificationOptions.silent && window.FocusManager && FocusManager.soundsEnabled) {
                FocusManager.playSound('notification');
            }
            
            // 创建通知
            const notification = new Notification(title, notificationOptions);
            
            // 设置点击事件
            notification.onclick = () => {
                window.focus();
                if (typeof options.onClick === 'function') {
                    options.onClick();
                }
                notification.close();
            };
            
            // 自动关闭
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, options.timeout || 5000);
            }
            
            return notification;
        } catch (error) {
            console.error('发送通知失败', error);
            
            // 退回到应用内通知
            if (window.UIManager) {
                UIManager.showNotification(`${title}: ${message}`);
            }
            
            return null;
        }
    }
};

// 导出模块
window.NotificationManager = NotificationManager; 