/**
 * 专注模式与轻松一刻交互管理器
 * 负责处理专注模式激活时轻松一刻按钮的状态和交互
 */
class FocusRelaxInteractionManager {
    constructor() {
        this.isInitialized = false;
        this.relaxButtons = [];
        this.relaxViews = [];
        this.focusStatusIndicator = null;
        this.isFocusActive = false;
        this.recoveryTimeout = null;
        
        this.init();
    }
    
    /**
     * 初始化管理器
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('初始化专注模式与轻松一刻交互管理器');
        
        // 缓存DOM元素
        this.cacheElements();
        
        // 绑定事件
        this.bindEvents();
        
        // 设置状态监听
        this.setupStateListener();
        
        // 初始化状态
        this.updateRelaxButtonState();
        
        this.isInitialized = true;
    }
    
    /**
     * 缓存DOM元素
     */
    cacheElements() {
        // 缓存轻松一刻按钮
        this.relaxButtons = [
            document.getElementById('nav-relax'),
            document.getElementById('nav-relax-new')
        ].filter(Boolean);
        
        // 缓存轻松一刻视图
        this.relaxViews = [
            document.getElementById('relax'),
            document.getElementById('relax-mode')
        ].filter(Boolean);
        
        console.log('缓存了', this.relaxButtons.length, '个轻松一刻按钮');
        console.log('缓存了', this.relaxViews.length, '个轻松一刻视图');
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 为每个轻松一刻按钮绑定点击事件
        this.relaxButtons.forEach(button => {
            button.addEventListener('click', this.handleRelaxClick.bind(this));
        });
        
        // 监听专注模式状态变化
        document.addEventListener('focusStatusChanged', this.handleFocusStatusChange.bind(this));
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateRelaxButtonState();
            }
        });
    }
    
    /**
     * 设置状态监听
     */
    setupStateListener() {
        // 监听localStorage变化
        window.addEventListener('storage', (e) => {
            if (e.key === 'focusStats' || e.key === 'focusStatus') {
                this.updateRelaxButtonState();
            }
        });
        
        // 定期检查专注模式状态
        setInterval(() => {
            this.updateRelaxButtonState();
        }, 2000);
    }
    
    /**
     * 处理轻松一刻按钮点击
     */
    handleRelaxClick(event) {
        const isFocusActive = this.checkFocusStatus();
        
        if (isFocusActive) {
            event.preventDefault();
            event.stopPropagation();
            
            // 显示提示信息
            this.showFocusActiveNotification();
            
            // 添加点击反馈动画
            this.addClickFeedback(event.target);
            
            return false;
        }
        
        // 专注模式未激活时，正常处理点击
        return true;
    }
    
    /**
     * 处理专注模式状态变化
     */
    handleFocusStatusChange(event) {
        const isActive = event.detail.isActive;
        this.isFocusActive = isActive;
        this.updateRelaxButtonState();
    }
    
    /**
     * 检查专注模式状态
     */
    checkFocusStatus() {
        // 检查多种专注模式状态来源
        const focusStats = localStorage.getItem('focusStats');
        const focusStatus = localStorage.getItem('focusStatus');
        
        if (focusStats) {
            try {
                const stats = JSON.parse(focusStats);
                if (stats.isRunning) {
                    return true;
                }
            } catch (e) {
                console.error('解析focusStats失败:', e);
            }
        }
        
        if (focusStatus) {
            try {
                const status = JSON.parse(focusStatus);
                if (status.status === 'active') {
                    return true;
                }
            } catch (e) {
                console.error('解析focusStatus失败:', e);
            }
        }
        
        // 检查全局FocusManager
        if (window.FocusManager && FocusManager.status === 'active') {
            return true;
        }
        
        // 检查DOM属性
        if (document.documentElement.dataset.focusTimerActive === 'true') {
            return true;
        }
        
        return false;
    }
    
    /**
     * 更新轻松一刻按钮状态
     */
    updateRelaxButtonState() {
        const isFocusActive = this.checkFocusStatus();
        
        if (isFocusActive !== this.isFocusActive) {
            this.isFocusActive = isFocusActive;
            
            if (isFocusActive) {
                this.disableRelaxButtons();
                this.disableRelaxViews();
            } else {
                this.enableRelaxButtons();
                this.enableRelaxViews();
            }
        }
    }
    
    /**
     * 禁用轻松一刻按钮
     */
    disableRelaxButtons() {
        this.relaxButtons.forEach(button => {
            if (button) {
                button.classList.add('relax-disabled');
                button.style.pointerEvents = 'none';
                button.title = '专注进行中，请先完成专注';
                
                // 添加状态指示器
                this.addFocusStatusIndicator(button);
            }
        });
    }
    
    /**
     * 启用轻松一刻按钮
     */
    enableRelaxButtons() {
        this.relaxButtons.forEach(button => {
            if (button) {
                // 添加恢复动画
                button.classList.add('relax-recovering');
                
                // 延迟移除禁用状态，让恢复动画播放
                setTimeout(() => {
                    button.classList.remove('relax-disabled', 'relax-recovering');
                    button.style.pointerEvents = 'auto';
                    button.title = '';
                    
                    // 移除状态指示器
                    this.removeFocusStatusIndicator(button);
                }, 500);
            }
        });
    }
    
    /**
     * 禁用轻松一刻视图
     */
    disableRelaxViews() {
        this.relaxViews.forEach(view => {
            if (view) {
                view.classList.add('relax-view-disabled');
                view.style.pointerEvents = 'none';
            }
        });
    }
    
    /**
     * 启用轻松一刻视图
     */
    enableRelaxViews() {
        this.relaxViews.forEach(view => {
            if (view) {
                view.classList.remove('relax-view-disabled');
                view.style.pointerEvents = 'auto';
            }
        });
    }
    
    /**
     * 添加专注状态指示器
     */
    addFocusStatusIndicator(button) {
        // 移除已存在的指示器
        this.removeFocusStatusIndicator(button);
        
        // 创建新的指示器
        const indicator = document.createElement('div');
        indicator.className = 'focus-status-indicator';
        indicator.setAttribute('aria-label', '专注模式激活中');
        
        button.style.position = 'relative';
        button.appendChild(indicator);
    }
    
    /**
     * 移除专注状态指示器
     */
    removeFocusStatusIndicator(button) {
        const indicator = button.querySelector('.focus-status-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * 显示专注模式激活提示
     */
    showFocusActiveNotification() {
        // 创建提示元素
        const notification = document.createElement('div');
        notification.className = 'focus-active-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-hourglass-half"></i>
                <span>专注进行中，请先完成专注</span>
            </div>
        `;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * 添加点击反馈动画
     */
    addClickFeedback(button) {
        // 创建涟漪效果
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: rippleEffect 0.6s ease-out;
            pointer-events: none;
        `;
        
        // 添加涟漪动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rippleEffect {
                to {
                    width: 100px;
                    height: 100px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        button.appendChild(ripple);
        
        // 移除涟漪元素
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    /**
     * 销毁管理器
     */
    destroy() {
        // 清理事件监听器
        this.relaxButtons.forEach(button => {
            if (button) {
                button.removeEventListener('click', this.handleRelaxClick);
            }
        });
        
        // 清理定时器
        if (this.recoveryTimeout) {
            clearTimeout(this.recoveryTimeout);
        }
        
        this.isInitialized = false;
    }
}

// 创建全局实例
window.FocusRelaxInteractionManager = new FocusRelaxInteractionManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (window.FocusRelaxInteractionManager) {
        window.FocusRelaxInteractionManager.init();
    }
});

// 导出管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusRelaxInteractionManager;
} 