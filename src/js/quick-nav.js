/**
 * 快速导航管理器
 * 在最近要做页面顶部添加快速切换按钮
 */
const QuickNavManager = {
    // 当前激活的按钮
    activeButton: null,
    
    // 按钮配置
    buttons: [
        {
            id: 'events-btn',
            text: '事件',
            icon: 'fas fa-calendar-check',
            view: 'recent-tasks',
            countType: 'events'
        },
        {
            id: 'projects-btn',
            text: '项目',
            icon: 'fas fa-project-diagram',
            view: 'projects',
            countType: 'projects'
        },
        {
            id: 'todolist-btn',
            text: '清单',
            icon: 'fas fa-tasks',
            view: 'todolist',
            countType: 'todolist'
        },
        {
            id: 'countdown-btn',
            text: '倒数日',
            icon: 'fas fa-calendar-day',
            view: 'countdown',
            countType: 'countdown'
        },
        {
            id: 'notes-btn',
            text: '笔记',
            icon: 'fas fa-sticky-note',
            view: 'notes',
            countType: 'notes'
        }
    ],

    /**
     * 初始化快速导航
     */
    init() {
        console.log('初始化快速导航...');
        
        try {
            this.createQuickNav();
            this.bindEvents();
            this.updateCounts();
            this.setActiveButton();
            
            // 监听数据变化，更新计数
            this.setupDataListeners();
            
            // 初始时移动到当前视图顶部
            this.moveNavToCurrentView();
            
            console.log('快速导航初始化完成');
        } catch (error) {
            console.error('快速导航初始化失败:', error);
        }
    },

    /**
     * 创建快速导航按钮
     */
    createQuickNav() {
        // 查找最近要做视图的标题区域
        const recentTasksSection = document.getElementById('recent-tasks');
        if (!recentTasksSection) {
            console.error('找不到最近要做视图，无法创建快速导航');
            return;
        }

        // 检查是否已经存在快速导航
        if (document.querySelector('.quick-nav-container')) {
            console.log('快速导航已存在，跳过创建');
            return;
        }

        // 创建快速导航容器
        const quickNavContainer = document.createElement('div');
        quickNavContainer.className = 'quick-nav-container';

        // 创建按钮
        this.buttons.forEach(buttonConfig => {
            const button = this.createButton(buttonConfig);
            quickNavContainer.appendChild(button);
        });

        // 将快速导航插入到最近要做视图的开头
        recentTasksSection.insertBefore(quickNavContainer, recentTasksSection.firstChild);
        
        console.log('快速导航按钮创建完成');
    },

    /**
     * 创建单个按钮
     */
    createButton(config) {
        const button = document.createElement('button');
        button.className = 'quick-nav-btn';
        button.id = config.id;
        button.setAttribute('data-view', config.view);
        button.setAttribute('data-count-type', config.countType);

        button.innerHTML = `
            <i class="${config.icon}"></i>
            <span>${config.text}</span>
            <span class="quick-nav-count" style="display: none;">0</span>
        `;

        return button;
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 为每个按钮绑定点击事件
        this.buttons.forEach(buttonConfig => {
            const button = document.getElementById(buttonConfig.id);
            if (button) {
                button.addEventListener('click', () => {
                    this.handleButtonClick(buttonConfig);
                });
            }
        });
    },

    /**
     * 处理按钮点击
     */
    handleButtonClick(buttonConfig) {
        console.log('快速导航按钮点击:', buttonConfig);
        
        // 设置激活状态
        this.setActiveButton(buttonConfig.id);

        // 切换到对应视图
        if (window.UIManager && typeof UIManager.switchView === 'function') {
            // 根据视图ID映射到UIManager的视图名称
            let viewName = buttonConfig.view;
            switch (buttonConfig.view) {
                case 'recent-tasks':
                    viewName = 'recent';
                    break;
                case 'projects':
                    viewName = 'projects';
                    break;
                case 'todolist':
                    viewName = 'todolist';
                    break;
                case 'countdown':
                    viewName = 'countdown';
                    break;
                case 'notes':
                    viewName = 'notes';
                    break;
            }
            console.log('切换到视图:', viewName);
            UIManager.switchView(viewName);
        } else {
            console.log('UIManager不可用，使用备用切换方法');
            // 如果没有UIManager，直接切换视图
            this.switchView(buttonConfig.view);
        }
    },

    /**
     * 将快速导航移动到当前视图顶部
     */
    moveNavToCurrentView() {
        const currentView = this.getCurrentView();
        const section = document.getElementById(currentView);
        const nav = document.querySelector('.quick-nav-container');
        if (section && nav) {
            // 只插入到指定的五个视图顶部
            if (["recent-tasks", "projects", "todolist", "countdown", "notes"].includes(currentView)) {
                // 避免重复插入
                if (section.firstChild !== nav) {
                    section.insertBefore(nav, section.firstChild);
                }
                nav.style.display = 'flex';
            } else {
                nav.style.display = 'none';
            }
        }
    },

    /**
     * 设置激活按钮，并移动按钮栏到当前视图顶部
     */
    setActiveButton(buttonId = null) {
        // 移除所有按钮的激活状态
        document.querySelectorAll('.quick-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 如果没有指定按钮ID，根据当前视图设置
        if (!buttonId) {
            const currentView = this.getCurrentView();
            buttonId = this.getButtonIdByView(currentView);
        }

        // 设置指定按钮为激活状态
        if (buttonId) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.classList.add('active');
                this.activeButton = buttonId;
            }
        }
        // 每次切换视图时移动按钮栏
        this.moveNavToCurrentView();
    },

    /**
     * 获取当前视图
     */
    getCurrentView() {
        const activeSection = document.querySelector('.view-section.active');
        return activeSection ? activeSection.id : 'recent-tasks';
    },

    /**
     * 根据视图获取按钮ID
     */
    getButtonIdByView(view) {
        const button = this.buttons.find(btn => btn.view === view);
        return button ? button.id : 'events-btn';
    },

    /**
     * 切换视图（备用方法）
     */
    switchView(viewId) {
        // 隐藏所有视图
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });

        // 显示目标视图
        const targetSection = document.getElementById(viewId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // 更新底部导航
        this.updateBottomNav(viewId);
    },

    /**
     * 更新底部导航
     */
    updateBottomNav(viewId) {
        const navButtons = document.querySelectorAll('.bottom-nav-btn, .nav-item');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        // 根据视图ID找到对应的底部导航按钮
        let targetNavBtn = null;
        switch (viewId) {
            case 'recent-tasks':
                targetNavBtn = document.querySelector('.nav-item[data-view="recent"], #nav-recent');
                break;
            case 'projects':
                targetNavBtn = document.querySelector('.nav-item[data-view="projects"], #nav-projects');
                break;
            case 'todolist':
                targetNavBtn = document.querySelector('.nav-item[data-view="todolist"], #nav-todolist');
                break;
            case 'countdown':
                targetNavBtn = document.querySelector('.nav-item[data-view="countdown"], #nav-countdown');
                break;
            case 'notes':
                targetNavBtn = document.querySelector('.nav-item[data-view="notes"], #nav-notes');
                break;
        }

        if (targetNavBtn) {
            targetNavBtn.classList.add('active');
        }
    },

    /**
     * 更新所有按钮的计数
     */
    updateCounts() {
        this.buttons.forEach(buttonConfig => {
            this.updateButtonCount(buttonConfig);
        });
    },

    /**
     * 更新单个按钮的计数
     */
    updateButtonCount(buttonConfig) {
        const button = document.getElementById(buttonConfig.id);
        if (!button) return;

        const countElement = button.querySelector('.quick-nav-count');
        if (!countElement) return;

        const count = this.getCount(buttonConfig.countType);
        
        if (count > 0) {
            countElement.textContent = count > 99 ? '99+' : count;
            countElement.style.display = 'block';
        } else {
            countElement.style.display = 'none';
        }
    },

    /**
     * 获取指定类型的计数
     */
    getCount(type) {
        if (!window.StorageManager) return 0;

        try {
            const data = StorageManager.getData();
            
            switch (type) {
                case 'events':
                    return data.events ? data.events.length : 0;
                case 'projects':
                    return data.projects ? data.projects.length : 0;
                case 'todolist':
                    return data.lists ? data.lists.length : 0;
                case 'countdown':
                    return data.countdowns ? data.countdowns.length : 0;
                case 'notes':
                    return data.notes ? data.notes.length : 0;
                default:
                    return 0;
            }
        } catch (error) {
            console.error('获取计数时出错:', error);
            return 0;
        }
    },

    /**
     * 设置数据监听器
     */
    setupDataListeners() {
        // 监听localStorage变化
        window.addEventListener('storage', (e) => {
            if (e.key === 'appData') {
                this.updateCounts();
            }
        });

        // 监听数据变化事件（如果有的话）
        document.addEventListener('dataChanged', () => {
            this.updateCounts();
        });

        // 定期更新计数（作为备用方案）
        setInterval(() => {
            this.updateCounts();
        }, 10000); // 每10秒更新一次
    },

    /**
     * 刷新计数
     */
    refresh() {
        this.updateCounts();
        this.setActiveButton();
    },

    /**
     * 手动触发数据更新
     */
    triggerDataUpdate() {
        this.updateCounts();
    },

    /**
     * 显示/隐藏快速导航
     */
    toggle(show = true) {
        const container = document.querySelector('.quick-nav-container');
        if (container) {
            container.style.display = show ? 'flex' : 'none';
        }
    },

    /**
     * 销毁快速导航
     */
    destroy() {
        const container = document.querySelector('.quick-nav-container');
        if (container) {
            container.remove();
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待其他管理器初始化完成
    setTimeout(() => {
        if (window.UIManager) {
            QuickNavManager.init();
        } else {
            // 如果UIManager还没准备好，再等待一段时间
            setTimeout(() => {
                QuickNavManager.init();
            }, 1000);
        }
    }, 500);
});

// 监听UIManager的视图切换事件，更新快速导航状态
document.addEventListener('DOMContentLoaded', () => {
    // 监听视图切换，更新快速导航状态
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('view-section')) {
                    if (target.classList.contains('active')) {
                        // 视图切换时更新快速导航状态
                        if (window.QuickNavManager) {
                            QuickNavManager.setActiveButton();
                        }
                    }
                }
            }
        });
    });

    // 等待DOM完全加载后再观察
    setTimeout(() => {
        // 观察所有视图section的变化
        document.querySelectorAll('.view-section').forEach(section => {
            observer.observe(section, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }, 1000);
});

// 导出到全局作用域
window.QuickNavManager = QuickNavManager; 