/**
 * 新的底部导航栏管理器
 * 只包含：最近要做、专注模式、轻松一刻
 */
class BottomNavNewManager {
    constructor() {
        this.currentView = 'recent';
        this.navItems = [];
        this.viewSections = [];
        this.isInitialized = false;
        this.focusManager = null;
        this.relaxManager = null;
        this.taskManager = null;
    }

    /**
     * 初始化底部导航栏
     */
    init() {
        if (this.isInitialized) return;
        
        // 检查用户是否已登录
        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname) {
            console.log('用户未登录，不显示底部导航栏');
            return;
        }
        
        console.log('初始化新的底部导航栏');
        
        // 创建底部导航栏HTML
        this.createBottomNav();
        
        // 缓存DOM元素
        this.cacheElements();
        
        // 绑定事件
        this.bindEvents();
        
        // 设置初始状态
        this.setActiveView('recent');
        
        // 监听专注模式状态变化
        this.setupFocusModeListener();
        
        this.isInitialized = true;
    }

    /**
     * 创建底部导航栏HTML结构
     */
    createBottomNav() {
        // 移除旧的底部导航栏
        const oldNav = document.querySelector('.bottom-nav');
        if (oldNav) {
            oldNav.remove();
        }

        // 检查是否已经存在新的底部导航栏
        const existingNewNav = document.querySelector('.bottom-nav-new');
        if (existingNewNav) {
            existingNewNav.remove();
        }

        // 创建新的底部导航栏
        const bottomNav = document.createElement('nav');
        bottomNav.className = 'bottom-nav-new';
        bottomNav.innerHTML = `
            <button id="nav-recent-new" class="nav-item-new" data-view="recent">
                <i class="fas fa-calendar-day"></i>
                <span>最近要做</span>
            </button>
            <button id="nav-focus-new" class="nav-item-new" data-view="focus">
                <i class="fas fa-hourglass-half"></i>
                <span>专注模式</span>
            </button>
            <button id="nav-relax-new" class="nav-item-new" data-view="relax">
                <i class="fas fa-gamepad"></i>
                <span>轻松一刻</span>
            </button>
        `;

        // 插入到页面中
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.appendChild(bottomNav);
        } else {
            // 如果找不到app-container，直接添加到body
            document.body.appendChild(bottomNav);
        }
        
        console.log('新的底部导航栏已创建');
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.navItems = document.querySelectorAll('.nav-item-new');
        this.viewSections = document.querySelectorAll('.view-section');
        
        // 获取管理器实例
        this.focusManager = window.FocusManager;
        this.relaxManager = window.RelaxManager;
        this.taskManager = window.TaskManager;
    }

    /**
     * 绑定事件处理
     */
    bindEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.getAttribute('data-view');
                this.handleNavClick(view, e);
            });
        });

        // 监听键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * 处理导航点击事件
     */
    handleNavClick(view, event) {
        console.log('导航点击:', view);

        // 检查专注模式状态
        if (view === 'relax' && this.isFocusTimerActive()) {
            event.preventDefault();
            this.showNotification('计时进行中，无法进入轻松一刻');
            return;
        }

        // 切换到对应视图
        this.setActiveView(view);
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(event) {
        // 只在没有输入框聚焦时响应快捷键
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case '1':
                this.setActiveView('recent');
                break;
            case '2':
                this.setActiveView('focus');
                break;
            case '3':
                if (!this.isFocusTimerActive()) {
                    this.setActiveView('relax');
                }
                break;
        }
    }

    /**
     * 设置活动视图
     */
    setActiveView(view) {
        console.log('设置活动视图:', view);

        this.currentView = view;

        // 更新导航项状态
        this.updateNavItems(view);

        // 更新视图显示
        this.updateViewSections(view);

        // 初始化对应的管理器
        this.initializeManager(view);

        // 更新专注模式状态
        this.updateFocusModeStatus();

        // 控制AI浮动球显示/隐藏
        if (window.AIFloatButtonManager) {
            window.AIFloatButtonManager.toggleByView(view);
        }
    }

    /**
     * 更新导航项状态
     */
    updateNavItems(activeView) {
        this.navItems.forEach(item => {
            const view = item.getAttribute('data-view');
            const isActive = view === activeView;
            
            item.classList.toggle('active', isActive);
            
            // 移除特殊状态类
            item.classList.remove('focus-active', 'relax-active');
            
            // 添加特殊状态类
            if (view === 'focus' && this.isFocusTimerActive()) {
                item.classList.add('focus-active');
            } else if (view === 'relax' && isActive) {
                item.classList.add('relax-active');
            }
        });
    }

    /**
     * 更新视图显示
     */
    updateViewSections(activeView) {
        this.viewSections.forEach(section => {
            const sectionId = section.id;
            
            // 判断是否应该激活此视图
            const isActive = this.shouldActivateSection(sectionId, activeView);
            
            if (sectionId === 'focus-mode') {
                this.handleFocusModeSection(section, isActive, activeView);
            } else if (sectionId === 'relax') {
                this.handleRelaxSection(section, isActive, activeView);
            } else if (sectionId === 'recent-tasks') {
                this.handleRecentTasksSection(section, isActive);
            } else {
                // 其他视图正常切换
                section.classList.toggle('active', isActive);
            }
        });
    }

    /**
     * 判断是否应该激活某个视图
     */
    shouldActivateSection(sectionId, activeView) {
        return sectionId === activeView || 
               (activeView === 'focus' && sectionId === 'focus-mode') ||
               (activeView === 'recent' && sectionId === 'recent-tasks');
    }

    /**
     * 处理专注模式视图
     */
    handleFocusModeSection(section, isActive, activeView) {
        const isTimerActive = this.isFocusTimerActive();
        
        if (isTimerActive && activeView !== 'focus') {
            // 专注模式正在计时但用户切换到其他视图 - 保持专注模式在后台运行
            section.classList.remove('active');
            this.hideSectionVisually(section);
        } else if (activeView === 'focus') {
            // 用户切换到专注模式视图 - 恢复完全显示
            section.classList.add('active');
            this.showSectionVisually(section);
        } else if (!isTimerActive) {
            // 专注模式没有计时且不是当前视图 - 正常隐藏
            section.classList.remove('active');
            this.showSectionVisually(section);
        }
    }

    /**
     * 处理轻松一刻视图
     */
    handleRelaxSection(section, isActive, activeView) {
        const isTimerActive = this.isFocusTimerActive();
        
        if (isTimerActive) {
            // 计时进行中，隐藏轻松一刻视图
            section.classList.remove('active');
            section.style.display = 'none';
        } else if (activeView === 'relax') {
            // 非专注模式下，且切换到轻松一刻视图时，显示轻松一刻
            section.style.display = '';
            section.classList.add('active');
        } else {
            // 其他视图下，轻松一刻不激活但保持正常display
            section.classList.remove('active');
            section.style.display = '';
        }
    }

    /**
     * 处理最近任务视图
     */
    handleRecentTasksSection(section, isActive) {
        section.classList.toggle('active', isActive);
    }

    /**
     * 隐藏视图（视觉上）
     */
    hideSectionVisually(section) {
        section.style.position = 'fixed';
        section.style.top = '-9999px';
        section.style.left = '-9999px';
        section.style.opacity = '0';
        section.style.pointerEvents = 'none';
        section.style.zIndex = '-1';
        section.style.height = '1px';
        section.style.width = '1px';
        section.style.overflow = 'hidden';
    }

    /**
     * 显示视图（视觉上）
     */
    showSectionVisually(section) {
        section.style.position = '';
        section.style.top = '';
        section.style.left = '';
        section.style.opacity = '';
        section.style.pointerEvents = '';
        section.style.zIndex = '';
        section.style.height = '';
        section.style.width = '';
        section.style.overflow = '';
    }

    /**
     * 初始化对应的管理器
     */
    initializeManager(view) {
        switch (view) {
            case 'recent':
                if (this.taskManager) {
                    this.taskManager.init(false);
                }
                break;
            case 'focus':
                if (this.focusManager) {
                    this.focusManager.init();
                }
                break;
            case 'relax':
                if (this.relaxManager) {
                    this.relaxManager.init();
                }
                break;
        }
    }

    /**
     * 设置专注模式状态监听
     */
    setupFocusModeListener() {
        // 监听专注模式状态变化
        if (this.focusManager) {
            this.focusManager.onStatusChange = (status) => {
                this.updateFocusModeStatus();
            };
        }

        // 定期检查专注模式状态
        setInterval(() => {
            this.updateFocusModeStatus();
        }, 1000);
    }

    /**
     * 更新专注模式状态
     */
    updateFocusModeStatus() {
        const isTimerActive = this.isFocusTimerActive();
        const focusNavItem = document.getElementById('nav-focus-new');
        const relaxNavItem = document.getElementById('nav-relax-new');

        if (focusNavItem) {
            focusNavItem.classList.toggle('focus-active', isTimerActive);
        }

        if (relaxNavItem) {
            if (isTimerActive) {
                relaxNavItem.classList.add('disabled');
                relaxNavItem.style.pointerEvents = 'none';
                relaxNavItem.style.opacity = '0.5';
                relaxNavItem.style.filter = 'grayscale(100%)';
                relaxNavItem.title = '计时进行中，轻松一刻不可用';
            } else {
                relaxNavItem.classList.remove('disabled');
                relaxNavItem.style.pointerEvents = 'auto';
                relaxNavItem.style.opacity = '1';
                relaxNavItem.style.filter = 'none';
                relaxNavItem.title = '';
            }
        }

        // 更新悬浮指示器
        this.updateFloatingIndicator(isTimerActive);
    }

    /**
     * 检查专注模式计时是否激活
     */
    isFocusTimerActive() {
        return this.focusManager && 
               this.focusManager.status === 'active' && 
               this.focusManager.startTime !== null;
    }

    /**
     * 更新悬浮指示器
     */
    updateFloatingIndicator(isTimerActive) {
        const floatingIndicator = document.getElementById('focus-floating-indicator');
        if (floatingIndicator) {
            if (isTimerActive && this.currentView !== 'focus') {
                floatingIndicator.style.display = 'flex';
                // 更新悬浮指示器时间
                if (this.focusManager) {
                    const minutes = Math.floor(this.focusManager.remainingTime / 60);
                    const seconds = this.focusManager.remainingTime % 60;
                    const floatingTimer = document.getElementById('floating-timer');
                    if (floatingTimer) {
                        floatingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
            } else {
                floatingIndicator.style.display = 'none';
            }
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, duration = 3000) {
        // 使用现有的通知系统
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification(message, duration);
        } else {
            // 简单的通知实现
            const notification = document.createElement('div');
            notification.className = 'toast';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 10000;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
        }
    }

    /**
     * 获取当前视图
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * 销毁实例
     */
    destroy() {
        this.isInitialized = false;
        // 移除事件监听器
        this.navItems.forEach(item => {
            item.removeEventListener('click', this.handleNavClick);
        });
    }
}

// 创建全局实例
window.BottomNavNewManager = new BottomNavNewManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否已登录
    const userNickname = localStorage.getItem('userNickname');
    if (!userNickname) {
        console.log('用户未登录，不初始化底部导航栏');
        return;
    }
    
    // 延迟初始化，确保其他管理器已经加载
    setTimeout(() => {
        if (window.BottomNavNewManager) {
            window.BottomNavNewManager.init();
        }
    }, 500); // 增加延迟时间确保DOM完全加载
});

// 额外的初始化检查，确保在页面完全加载后执行
window.addEventListener('load', function() {
    // 检查用户是否已登录
    const userNickname = localStorage.getItem('userNickname');
    if (!userNickname) {
        console.log('用户未登录，不初始化底部导航栏');
        return;
    }
    
    setTimeout(() => {
        if (window.BottomNavNewManager && !window.BottomNavNewManager.isInitialized) {
            window.BottomNavNewManager.init();
        }
    }, 200);
}); 