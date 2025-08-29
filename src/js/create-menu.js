/**
 * New菜单管理器
 * 在"要做Things"Title旁边添加New菜单功能
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
     * 初始化New菜单
     */
    init() {
        console.log('初始化New菜单...');
        
        try {
            this.createMenu();
            this.bindEvents();
            this.setupBackButton();
            
            console.log('New菜单初始化Completed');
        } catch (error) {
            console.error('New菜单初始化失败:', error);
        }
    },

    /**
     * 创建New菜单
     */
    createMenu() {
        // 查找"要做Things"Title
        const viewHeader = document.querySelector('#recent-tasks .view-header h2');
        if (!viewHeader) {
            console.error('找不到"要做Things"Title');
            return;
        }

        // 创建菜单容器
        this.container = document.createElement('div');
        this.container.className = 'create-menu-container';
        
        // 创建按钮
        const button = document.createElement('button');
        button.className = 'create-menu-btn';
        button.innerHTML = '<i class="fas fa-plus"></i>New';
        button.title = 'NewThings、List或 Countdown Day';
        
        // 创建下拉菜单
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'create-dropdown';
        this.dropdown.innerHTML = `
            <div class="create-menu-item" data-action="traditional-event">
                <i class="fas fa-calendar-alt"></i>
                <div>
                    <div class="menu-text">Traditional Create Things</div>
                    <div class="menu-desc">Manually create detailed Things</div>
                </div>
            </div>
            <div class="create-menu-item" data-action="note">
                <i class="fas fa-sticky-note"></i>
                <div>
                    <div class="menu-text">NewNotes</div>
                    <div class="menu-desc">Create new Notes</div>
                </div>
            </div>
            <div class="create-menu-item" data-action="import">
                <i class="fas fa-download"></i>
                <div>
                    <div class="menu-text">External Import</div>
                    <div class="menu-desc">Import Data/File</div>
                </div>
            </div>
        `;
        
        // 组装菜单
        this.container.appendChild(button);
        this.container.appendChild(this.dropdown);
        
        // 插入到Title后面
        viewHeader.parentNode.insertBefore(this.container, viewHeader.nextSibling);
        
        console.log('New菜单创建Completed');
    },

    /**
     * Set返回按钮功能
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
            // 如果没有历史记录，默认返回Soon页面
            console.log('没有历史记录，返回Soon页面');
            if (window.UIManager) {
                window.UIManager.switchView('recent');
            }
        }
    },

    /**
     * 绑定Things
     */
    bindEvents() {
        if (!this.container) return;

        const button = this.container.querySelector('.create-menu-btn');
        const menuItems = this.dropdown.querySelectorAll('.create-menu-item');

        // 按钮点击Things
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // 菜单项点击Things
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.getAttribute('data-action');
                this.handleMenuAction(action);
                this.hideMenu();
            });
        });

        // 点击外部Close菜单
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideMenu();
            }
        });

        // ESC键Close菜单
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
            case 'todoList':
                this.openTodoListCreate();
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
     * 打开Things创建
     */
    openEventCreate() {
        // 切换到New视图的传统创建Label
        if (window.UIManager) {
            window.UIManager.switchView('create');
            // 激活传统创建Label
            setTimeout(() => {
                const traditionalTab = document.getElementById('traditional-create-tab');
                if (traditionalTab) {
                    traditionalTab.click();
                }
            }, 100);
        }
    },

    /**
     * 打开List创建
     */
    openTodoListCreate() {
        // 切换到List视图
        if (window.UIManager) {
            window.UIManager.switchView('todoList');
            // 触发NewList
            setTimeout(() => {
                const addBtn = document.querySelector('#add-List-btn');
                if (addBtn) {
                    addBtn.click();
                }
            }, 100);
        }
    },

    /**
     * 打开 Countdown Day创建
     */
    openCountdownCreate() {
        // 切换到 Countdown Day视图
        if (window.UIManager) {
            window.UIManager.switchView('countdown');
            // 触发New Countdown Day
            setTimeout(() => {
                const addBtn = document.querySelector('#add-countdown-btn');
                if (addBtn) {
                    addBtn.click();
                }
            }, 100);
        }
    },

    /**
     * 打开Notes创建
     */
    openNoteCreate() {
        // 切换到Notes视图
        if (window.UIManager) {
            window.UIManager.switchView('notes');
            // 触发NewNotes
            setTimeout(() => {
                const addBtn = document.querySelector('#add-note-btn');
                if (addBtn) {
                    addBtn.click();
                }
            }, 100);
        }
    },

    /**
     * 打开传统Things创建
     */
    openTraditionalEvent() {
        // 切换到New视图的传统创建Label
        if (window.UIManager) {
            window.UIManager.switchView('create');
            // 激活传统创建Label
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
        // 切换到New视图的外部导入Label
        if (window.UIManager) {
            window.UIManager.switchView('create');
            // 激活外部导入Label
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

// 页面加载Completed后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待其他管理器初始化Completed
    setTimeout(() => {
        CreateMenuManager.init();
    }, 1000);
});

// 导出到全局作用域
window.CreateMenuManager = CreateMenuManager; 