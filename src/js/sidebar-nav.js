/**
 * 侧边菜单栏管理器
 * 用于在桌面端显示侧边导航，替代底部导航栏
 */
class SidebarNavManager {
    constructor() {
        this.currentView = 'recent';
        this.navItems = [];
        this.viewSections = [];
        this.isInitialized = false;
        this.isVisible = false;
        this.focusManager = null;
        this.relaxManager = null;
        this.taskManager = null;
        this.isDesktop = window.innerWidth > 1024;
    }

    /**
     * 初始化侧边菜单栏
     */
    init() {
        // 优化：始终初始化顶部按钮和Things
        if (this.isInitialized) return;
        
        // 检查用户是否已登录
        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname) {
            console.log('用户未登录，不显示侧边菜单栏');
            return;
        }
        // 始终创建顶部汉堡按钮和Things
        this.createSidebarToggle();
        this.bindHeaderToggleButton();
        // 桌面端才创建侧边栏本体
        if (window.innerWidth > 1024) {
            this.createSidebarNav();
            this.cacheElements();
            this.bindEvents();
            this.setActiveView('recent');
            this.isVisible = false;
            this.setupFocusModeListener();
        }
        // 始终监听resize
        this.setupResizeListener();
        this.isInitialized = true;
    }

    /**
     * 创建侧边菜单栏HTML结构
     */
    createSidebarNav() {
        // 移除已存在的侧边菜单栏
        const existingSidebar = document.querySelector('.sidebar-nav');
        if (existingSidebar) {
            existingSidebar.remove();
        }

        // 创建侧边栏切换按钮
        this.createSidebarToggle();

        // 获取User Info
        const userNickname = localStorage.getItem('userNickname') || '未登录';
        const userAvatar = localStorage.getItem('userAvatar') || 'img/1.png';

        // 创建侧边菜单栏
        const sidebarNav = document.createElement('nav');
        sidebarNav.className = 'sidebar-nav';
        sidebarNav.innerHTML = `
            <div class="sidebar-nav-content">
                <div class="sidebar-nav-group">
                    <button id="sidebar-nav-recent" class="sidebar-nav-item" data-view="recent">
                        <i class="fas fa-calendar-day"></i>
                        <span>Soon</span>
                    </button>
                    <button id="sidebar-nav-focus" class="sidebar-nav-item" data-view="focus">
                        <i class="fas fa-hourglass-half"></i>
                        <span>Focus</span>
                    </button>
                    <button id="sidebar-nav-relax" class="sidebar-nav-item" data-view="relax">
                        <i class="fas fa-gamepad"></i>
                        <span>Downtime</span>
                    </button>
                </div>
            </div>
        `;

        // 插入到页面medium
        document.body.appendChild(sidebarNav);
        
        console.log('侧边菜单栏已创建');
    }

    /**
     * 创建侧边栏切换按钮
     */
    createSidebarToggle() {
        // 移除已存在的固定位置切换按钮
        const existingToggle = document.querySelector('.sidebar-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        // 创建固定位置的切换按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.title = '快速导航';
        
        // 绑定点击Things
        toggleBtn.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // 插入到页面medium
        document.body.appendChild(toggleBtn);
        
        // 绑定顶部栏按钮Things
        this.bindHeaderToggleButton();
        
        console.log('侧边栏切换按钮已创建');
    }

    /**
     * 绑定顶部栏切换按钮Things
     */
    bindHeaderToggleButton() {
        const headerToggle = document.getElementById('header-sidebar-toggle');
        if (headerToggle) {
            // 先移除所有旧的点击Things（通过克隆替换）
            const newHeaderToggle = headerToggle.cloneNode(true);
            headerToggle.parentNode.replaceChild(newHeaderToggle, headerToggle);
            newHeaderToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    }

    /**
     * 调整主Content区域以适应侧边栏
     */
    adjustMainContent() {
        const appContainer = document.querySelector('.app-container');
        const main = document.querySelector('main');
        const header = document.querySelector('header');
        
        if (appContainer) {
            appContainer.classList.add('with-sidebar');
        }
        if (main) {
            main.classList.add('with-sidebar');
        }
        if (header) {
            header.classList.add('with-sidebar');
        }
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.navItems = document.querySelectorAll('.sidebar-nav-item');
        this.viewSections = document.querySelectorAll('.view-section');
        
        // 获取管理器实例
        this.focusManager = window.FocusManager;
        this.relaxManager = window.RelaxManager;
        this.taskManager = window.TaskManager;
    }

    /**
     * 绑定Things处理
     */
    bindEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止Things冒泡
                const view = item.getAttribute('data-view');
                this.handleNavClick(view, e);
            });
        });

        // 点击外部区域Close侧边栏
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar-nav');
            const toggle = document.querySelector('.sidebar-toggle');
            const headerToggle = document.getElementById('header-sidebar-toggle');
            
            if (sidebar && sidebar.classList.contains('show') && 
                !sidebar.contains(e.target) && 
                !toggle.contains(e.target) &&
                !headerToggle.contains(e.target)) {
                this.hide();
            }
        });

        // 监听键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * 处理导航点击Things
     */
    handleNavClick(view, event) {
        console.log('侧边栏导航点击:', view);

        // 检查Focus状态
        if (view === 'relax' && this.isFocusTimerActive()) {
            event.preventDefault();
            this.showNotification('计时进行medium，Empty法进入Downtime');
            return;
        }

        // 新增：点击Focus直接跳转到pomodoro_tracker.html
        if (view === 'focus') {
            window.location.href = 'pomodoro_tracker.html';
            return;
        }

        // 切换到对应视图
        this.setActiveView(view);
        
        // 点击后立即隐藏侧边栏
        console.log('立即隐藏侧边栏');
        this.hide();
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
            case '4':
                this.setActiveView('projects');
                break;
            case '5':
                this.setActiveView('todoList');
                break;
            case '6':
                this.setActiveView('countdown');
                break;
            case '7':
                this.setActiveView('create');
                break;
        }
    }

    /**
     * Set活动视图
     */
    setActiveView(view) {
        console.log('Set侧边栏活动视图:', view);

        this.currentView = view;

        // 更新导航项状态
        this.updateNavItems(view);

        // 更新视图显示
        this.updateViewSections(view);

        // 初始化对应的管理器
        this.initializeManager(view);

        // 更新Focus状态
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
     * 处理Focus视图
     */
    handleFocusModeSection(section, isActive, activeView) {
        if (activeView === 'focus') {
            section.classList.add('active');
            this.showSectionVisually(section);
        } else {
            section.classList.remove('active');
            this.hideSectionVisually(section);
        }
    }

    /**
     * 处理Downtime视图
     */
    handleRelaxSection(section, isActive, activeView) {
        if (activeView === 'relax') {
            section.classList.add('active');
            this.showSectionVisually(section);
        } else {
            section.classList.remove('active');
            this.hideSectionVisually(section);
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
        section.style.display = 'none';
        section.style.position = 'absolute';
        section.style.left = '-9999px';
    }

    /**
     * 显示视图（视觉上）
     */
    showSectionVisually(section) {
        section.style.display = '';
        section.style.position = '';
        section.style.left = '';
    }

    /**
     * 初始化对应的管理器
     */
    initializeManager(view) {
        switch (view) {
            case 'focus':
                if (this.focusManager && typeof this.focusManager.init === 'function') {
                    this.focusManager.init();
                }
                break;
            case 'relax':
                if (this.relaxManager && typeof this.relaxManager.init === 'function') {
                    this.relaxManager.init();
                }
                break;
            case 'recent':
                if (this.taskManager && typeof this.taskManager.init === 'function') {
                    this.taskManager.init();
                }
                break;
        }
    }

    /**
     * SetFocus监听器
     */
    setupFocusModeListener() {
        // 监听Focus状态变化
        const observer = new MutationObserver(() => {
            this.updateFocusModeStatus();
        });

        // 监听body的data属性变化
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-focus-timer-active']
        });
    }

    /**
     * Set窗口大小变化监听器
     */
    setupResizeListener() {
        window.addEventListener('resize', () => {
            const newIsDesktop = window.innerWidth > 1024;
            if (newIsDesktop !== this.isDesktop) {
                this.isDesktop = newIsDesktop;
                if (newIsDesktop) {
                    // 桌面端切换时如未初始化侧边栏则初始化
                    if (!document.querySelector('.sidebar-nav')) {
                        this.createSidebarNav();
                        this.cacheElements();
                        this.bindEvents();
                        this.setActiveView('recent');
                        this.isVisible = false;
                    }
                    this.show();
                } else {
                    this.hide();
                }
            }
            // 切换时始终重新绑定header-sidebar-toggleThings
            this.bindHeaderToggleButton();
        });
    }

    /**
     * 更新Focus状态
     */
    updateFocusModeStatus() {
        const isTimerActive = this.isFocusTimerActive();
        
        // 更新导航项状态
        this.updateNavItems(this.currentView);
        
        // 更新浮动指示器
        this.updateFloatingIndicator(isTimerActive);
    }

    /**
     * 检查专注计时器是否激活
     */
    isFocusTimerActive() {
        return document.body.getAttribute('data-focus-timer-active') === 'true';
    }

    /**
     * 更新浮动指示器
     */
    updateFloatingIndicator(isTimerActive) {
        const floatingIndicator = document.getElementById('focus-floating-indicator');
        if (floatingIndicator) {
            if (isTimerActive) {
                floatingIndicator.classList.add('show');
            } else {
                floatingIndicator.classList.remove('show');
            }
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'toast';
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * 切换侧边栏显示/隐藏
     */
    toggleSidebar() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 显示侧边栏
     */
    show() {
        const sidebar = document.querySelector('.sidebar-nav');
        if (sidebar) {
            sidebar.classList.add('show');
            this.isVisible = true;
        }
    }

    /**
     * 隐藏侧边栏
     */
    hide() {
        const sidebar = document.querySelector('.sidebar-nav');
        if (sidebar) {
            this.isVisible = false;
            sidebar.classList.remove('show');
            console.log('侧边栏已隐藏');
        }
    }

    /**
     * 获取当前视图
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * 销毁侧边栏
     */
    destroy() {
        const sidebar = document.querySelector('.sidebar-nav');
        if (sidebar) {
            sidebar.remove();
        }
        
        // 移除主Content区域的侧边栏样式
        const appContainer = document.querySelector('.app-container');
        const main = document.querySelector('main');
        const header = document.querySelector('header');
        
        if (appContainer) {
            appContainer.classList.remove('with-sidebar');
        }
        if (main) {
            main.classList.remove('with-sidebar');
        }
        if (header) {
            header.classList.remove('with-sidebar');
        }
        
        this.isInitialized = false;
    }
}

// 创建全局实例
window.SidebarNavManager = new SidebarNavManager(); 