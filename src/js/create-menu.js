/**
 * 新建菜单管理器
 * 在"要做事件"标题旁边添加新建菜单功能
 */
const CreateMenuManager = {
    // 菜单容器
    container: null,
    
    // 下拉菜单
    dropdown: null,
    
    // 当前是否显示
    isVisible: false,
    
    // 导航历史记录
    navigationHistory: [],

    /**
     * 初始化新建菜单
     */
    init() {
        console.log('初始化新建菜单...');
        
        try {
            this.createMenu();
            this.bindEvents();
            this.setupBackButton();
            
            console.log('新建菜单初始化完成');
        } catch (error) {
            console.error('新建菜单初始化失败:', error);
        }
    },

    /**
     * 创建新建菜单
     */
    createMenu() {
        // 查找"要做事件"标题
        const viewHeader = document.querySelector('#recent-tasks .view-header h2');
        if (!viewHeader) {
            console.error('找不到"要做事件"标题');
            return;
        }

        // 创建菜单容器
        this.container = document.createElement('div');
        this.container.className = 'create-menu-container';
        
        // 创建按钮
        const button = document.createElement('button');
        button.className = 'create-menu-btn';
        button.innerHTML = '<i class="fas fa-plus"></i>新建';
        button.title = '新建事件、清单或倒数日';
        
        // 创建下拉菜单
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'create-dropdown';
        this.dropdown.innerHTML = `
            <div class="create-menu-item" data-action="traditional-event">
                <i class="fas fa-calendar-alt"></i>
                <div>
                    <div class="menu-text">传统创建事件</div>
                    <div class="menu-desc">手动创建详细事件</div>
                </div>
            </div>
            <div class="create-menu-item" data-action="note">
                <i class="fas fa-sticky-note"></i>
                <div>
                    <div class="menu-text">新建笔记</div>
                    <div class="menu-desc">创建新的笔记</div>
                </div>
            </div>
            <div class="create-menu-item" data-action="import">
                <i class="fas fa-download"></i>
                <div>
                    <div class="menu-text">外部导入</div>
                    <div class="menu-desc">从文本导入数据</div>
                </div>
            </div>
        `;
        
        // 组装菜单
        this.container.appendChild(button);
        this.container.appendChild(this.dropdown);
        
        // 插入到标题后面
        viewHeader.parentNode.insertBefore(this.container, viewHeader.nextSibling);
        
        console.log('新建菜单创建完成');
    },

    /**
     * 设置返回按钮功能
     */
    setupBackButton() {
        const backBtn = document.getElementById('create-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.goBack();
            });
        }
    },

    /**
     * 记录导航历史
     */
    recordNavigation(fromView) {
        this.navigationHistory.push(fromView);
        console.log('记录导航历史:', fromView);
    },

    /**
     * 返回上一页
     */
    goBack() {
        if (this.navigationHistory.length > 0) {
            const previousView = this.navigationHistory.pop();
            console.log('返回上一页:', previousView);
            
            if (window.UIManager) {
                window.UIManager.switchView(previousView);
            }
        } else {
            // 如果没有历史记录，默认返回最近要做页面
            console.log('没有历史记录，返回最近要做页面');
            if (window.UIManager) {
                window.UIManager.switchView('recent');
            }
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        if (!this.container) return;

        const button = this.container.querySelector('.create-menu-btn');
        const menuItems = this.dropdown.querySelectorAll('.create-menu-item');

        // 按钮点击事件
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // 菜单项点击事件
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.getAttribute('data-action');
                this.handleMenuAction(action);
                this.hideMenu();
            });
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideMenu();
            }
        });

        // ESC键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideMenu();
            }
        });
    },

    /**
     * 切换菜单显示/隐藏
     */
    toggleMenu() {
        if (this.isVisible) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    },

    /**
     * 显示菜单
     */
    showMenu() {
        if (this.dropdown) {
            this.dropdown.classList.add('show');
            this.isVisible = true;
        }
    },

    /**
     * 隐藏菜单
     */
    hideMenu() {
        if (this.dropdown) {
            this.dropdown.classList.remove('show');
            this.isVisible = false;
        }
    },

    /**
     * 处理菜单项点击
     */
    handleMenuAction(action) {
        console.log('执行菜单操作:', action);
        
        // 记录当前视图
        const currentView = this.getCurrentView();
        this.recordNavigation(currentView);
        
        switch (action) {
            case 'event':
                this.openEventCreate();
                break;
            case 'todolist':
                this.openTodolistCreate();
                break;
            case 'countdown':
                this.openCountdownCreate();
                break;
            case 'note':
                this.openNoteCreate();
                break;
            case 'traditional-event':
                this.openTraditionalEvent();
                break;
            case 'import':
                this.openImport();
                break;
            default:
                console.warn('未知的菜单操作:', action);
        }
    },

    /**
     * 获取当前视图
     */
    getCurrentView() {
        const activeSection = document.querySelector('.view-section.active');
        if (activeSection) {
            return activeSection.id;
        }
        return 'recent';
    },

    /**
     * 打开事件创建
     */
    openEventCreate() {
        // 切换到新建视图的传统创建标签
        if (window.UIManager) {
            window.UIManager.switchView('create');
            // 激活传统创建标签
            setTimeout(() => {
                const traditionalTab = document.getElementById('traditional-create-tab');
                if (traditionalTab) {
                    traditionalTab.click();
                }
            }, 100);
        }
    },

    /**
     * 打开清单创建
     */
    openTodolistCreate() {
        // 切换到清单视图
        if (window.UIManager) {
            window.UIManager.switchView('todolist');
            // 触发新建清单
            setTimeout(() => {
                const addBtn = document.querySelector('#add-list-btn');
                if (addBtn) {
                    addBtn.click();
                }
            }, 100);
        }
    },

    /**
     * 打开倒数日创建
     */
    openCountdownCreate() {
        // 切换到倒数日视图
        if (window.UIManager) {
            window.UIManager.switchView('countdown');
            // 触发新建倒数日
            setTimeout(() => {
                const addBtn = document.querySelector('#add-countdown-btn');
                if (addBtn) {
                    addBtn.click();
                }
            }, 100);
        }
    },

    /**
     * 打开笔记创建
     */
    openNoteCreate() {
        // 切换到笔记视图
        if (window.UIManager) {
            window.UIManager.switchView('notes');
            // 触发新建笔记
            setTimeout(() => {
                const addBtn = document.querySelector('#add-note-btn');
                if (addBtn) {
                    addBtn.click();
                }
            }, 100);
        }
    },

    /**
     * 打开传统事件创建
     */
    openTraditionalEvent() {
        // 切换到新建视图的传统创建标签
        if (window.UIManager) {
            window.UIManager.switchView('create');
            // 激活传统创建标签
            setTimeout(() => {
                const traditionalTab = document.getElementById('traditional-create-tab');
                if (traditionalTab) {
                    traditionalTab.click();
                }
            }, 100);
        }
    },

    /**
     * 打开外部导入
     */
    openImport() {
        // 切换到新建视图的外部导入标签
        if (window.UIManager) {
            window.UIManager.switchView('create');
            // 激活外部导入标签
            setTimeout(() => {
                const importTab = document.getElementById('import-tab');
                if (importTab) {
                    importTab.click();
                }
            }, 100);
        }
    },

    /**
     * 销毁组件
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
        this.dropdown = null;
        this.isVisible = false;
        this.navigationHistory = [];
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待其他管理器初始化完成
    setTimeout(() => {
        CreateMenuManager.init();
    }, 1000);
});

// 导出到全局作用域
window.CreateMenuManager = CreateMenuManager; 