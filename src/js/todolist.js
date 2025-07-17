/**
 * 清单管理器
 * 负责创建、编辑、删除和管理待办清单
 */
const TodoListManager = {
    currentListId: null,
    batchMode: false, // 批量选择模式

    /**
     * 初始化清单管理器
     */
    init() {
        console.log('初始化清单管理器');
        
        // 获取DOM元素
        this.listsContainer = document.querySelector('.lists-container');
        this.listsNav = document.getElementById('lists-nav');
        this.listItemsContainer = document.getElementById('list-items-container');
        this.currentListTitle = document.getElementById('current-list-title');
        this.addListBtn = document.getElementById('add-list-btn');
        this.deleteListBtn = document.getElementById('delete-list-btn');
        this.addListItemBtn = document.getElementById('add-list-item-btn');
        this.editListBtn = document.getElementById('edit-list-btn');
        this.listSearch = document.getElementById('list-search');
        this.clearListSearchBtn = document.getElementById('clear-list-search-btn');
        this.importListsInput = document.getElementById('import-lists-input');
        this.importListsTextBtn = document.getElementById('import-lists-text-btn');
        this.editListsTextBtn = document.getElementById('edit-lists-text-btn');
        this.todolistImportModal = document.getElementById('todolist-import-modal');
        this.todolistEditModal = document.getElementById('todolist-edit-modal');
        this.closeImportModal = document.getElementById('close-todolist-import-modal');
        this.closeEditModal = document.getElementById('close-todolist-edit-modal');
        this.todolistImportText = document.getElementById('todolist-import-text');
        this.todolistEditText = document.getElementById('todolist-edit-text');
        this.confirmImport = document.getElementById('confirm-todolist-import');
        this.confirmEdit = document.getElementById('confirm-todolist-edit');
        this.cancelImport = document.getElementById('cancel-todolist-import');
        this.cancelEdit = document.getElementById('cancel-todolist-edit');
        
        // 批量操作相关元素
        this.toggleBatchModeBtn = document.getElementById('toggle-batch-mode-btn');
        this.batchDeleteBtn = document.getElementById('batch-delete-btn');
        
        // 绑定事件
        this.bindEvents();
        
        // 加载清单
        this.loadLists();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 创建新清单
        this.addListBtn.addEventListener('click', () => this.createNewList());
        
        // 删除当前清单
        this.deleteListBtn.addEventListener('click', () => this.deleteCurrentList());
        
        // 添加清单项
        this.addListItemBtn.addEventListener('click', () => this.addListItem());
        
        // 编辑清单
        this.editListBtn.addEventListener('click', () => this.editCurrentList());
        
        // 导入清单文件
        this.importListsInput.addEventListener('change', (e) => this.importLists(e.target.files[0]));
        
        // 导入清单文本
        this.importListsTextBtn.addEventListener('click', () => this.showImportModal());
        
        // 关闭导入模态框
        this.closeImportModal.addEventListener('click', () => this.hideImportModal());
        this.cancelImport.addEventListener('click', () => this.hideImportModal());
        
        // 确认导入
        this.confirmImport.addEventListener('click', () => this.importFromText());
        
        // 搜索清单
        this.listSearch.addEventListener('input', (e) => {
            const query = e.target.value;
            // 显示或隐藏清除按钮
            if (query) {
                this.clearListSearchBtn.style.display = 'flex';
            } else {
                this.clearListSearchBtn.style.display = 'none';
                this.loadLists(); // 清空搜索时显示所有清单
            }
            this.searchLists(query);
        });
        
        // 清除搜索按钮
        if (this.clearListSearchBtn) {
            this.clearListSearchBtn.addEventListener('click', () => {
                this.listSearch.value = '';
                this.clearListSearchBtn.style.display = 'none';
                this.loadLists(); // 重新加载所有清单
            });
        }

        // 批量操作相关
        if (this.toggleBatchModeBtn) {
            this.toggleBatchModeBtn.addEventListener('click', () => this.toggleBatchMode());
        }
        
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.addEventListener('click', () => this.batchDeleteItems());
        }

        // 文本编辑按钮
        this.editListsTextBtn.addEventListener('click', () => this.showEditModal());
        
        // 关闭编辑模态框
        this.closeEditModal.addEventListener('click', () => this.hideEditModal());
        this.cancelEdit.addEventListener('click', () => this.hideEditModal());
        
        // 确认编辑
        this.confirmEdit.addEventListener('click', () => this.saveEditChanges());
    },

    /**
     * 切换批量选择模式
     */
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        
        // 更新按钮状态
        this.toggleBatchModeBtn.classList.toggle('active', this.batchMode);
        this.toggleBatchModeBtn.innerHTML = this.batchMode ? 
            '<i class="fas fa-times"></i> 取消选择' : 
            '<i class="fas fa-check-square"></i> 批量选择';
        
        // 显示/隐藏批量删除按钮
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.style.display = this.batchMode ? 'flex' : 'none';
        }
        
        // 更新任务项目显示
        this.loadListItems(this.getCurrentList());
    },

    /**
     * 获取当前清单
     * @returns {Object|null} 当前清单对象或null
     */
    getCurrentList() {
        if (!this.currentListId) return null;
        
        const data = StorageManager.getData();
        return data.lists.find(l => l.id === this.currentListId);
    },

    /**
     * 批量删除选中的项目
     */
    batchDeleteItems() {
        if (!this.currentListId || !this.batchMode) return;
        
        // 防止重复调用
        if (this._isBatchDeleting) {
            return;
        }
        
        this._isBatchDeleting = true;
        
        const checkboxes = document.querySelectorAll('.batch-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('请至少选择一个项目');
            this._isBatchDeleting = false;
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${checkboxes.length} 个项目吗？此操作不可恢复。`)) {
            this._isBatchDeleting = false;
            return;
        }
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        
        if (!list) {
            this._isBatchDeleting = false;
            return;
        }
        
        // 收集要删除的项目ID
        const itemIds = Array.from(checkboxes).map(cb => cb.dataset.itemId);
        
        // 查找已完成的项目，以便扣除积分
        const completedItems = list.items.filter(item => itemIds.includes(item.id) && item.completed);
        const completedCount = completedItems.length;
        
        // 过滤掉要删除的项目
        list.items = list.items.filter(item => !itemIds.includes(item.id));
        
        StorageManager.saveData(data);
        
        // 如果删除包含已完成项目，扣除积分
        if (completedCount > 0) {
            const pointsDeduction = completedCount * -10;
            StorageManager.addPoints(pointsDeduction, '清单', '删除已完成事项');
            UIManager.showNotification(`删除了${completedCount}个已完成项目 ${pointsDeduction}积分`, 'info');
        }
        
        // 如果删除所有项目后退出批量模式
        if (list.items.length === 0) {
            this.batchMode = false;
            this.toggleBatchModeBtn.classList.remove('active');
            this.toggleBatchModeBtn.innerHTML = '<i class="fas fa-check-square"></i> 批量选择';
            if (this.batchDeleteBtn) {
                this.batchDeleteBtn.style.display = 'none';
            }
        }
        
        // 重新加载
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
        
        // 重置状态
        this._isBatchDeleting = false;
    },

    /**
     * 加载所有清单
     */
    loadLists() {
        const data = StorageManager.getData();
        const lists = data.lists || [];
        
        if (lists.length === 0) {
            this.showEmptyListMessage();
            return;
        }
        
        // 清空现有列表
        this.listsNav.innerHTML = '';
        
        // 排序：收藏的清单在前，未收藏的在后
        const sortedLists = lists.sort((a, b) => {
            const aFavorited = a.favorited || false;
            const bFavorited = b.favorited || false;
            
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            
            // 如果收藏状态相同，按创建时间排序（新的在前）
            return new Date(b.createTime || 0) - new Date(a.createTime || 0);
        });
        
        // 分离收藏和未收藏的清单
        const favoritedLists = sortedLists.filter(list => list.favorited);
        const unfavoritedLists = sortedLists.filter(list => !list.favorited);
        
        // 添加收藏的清单
        if (favoritedLists.length > 0) {
            favoritedLists.forEach(list => {
                const listElement = this.createListNavItem(list);
                this.listsNav.appendChild(listElement);
            });
        }
        
        // 添加分隔线（如果有收藏和未收藏的清单）
        if (favoritedLists.length > 0 && unfavoritedLists.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'favorite-separator';
            separator.textContent = '其他清单';
            this.listsNav.appendChild(separator);
        }
        
        // 添加未收藏的清单
        unfavoritedLists.forEach(list => {
            const listElement = this.createListNavItem(list);
            this.listsNav.appendChild(listElement);
        });
        
        // 如果有当前选中的清单，加载它的内容
        if (this.currentListId) {
            const currentList = lists.find(l => l.id === this.currentListId);
            if (currentList) {
                this.loadListItems(currentList);
            }
        }
        
        // 通知快速导航更新计数
        if (window.QuickNavManager && typeof QuickNavManager.triggerDataUpdate === 'function') {
            QuickNavManager.triggerDataUpdate();
        }
    },

    /**
     * 创建清单导航项
     * @param {Object} list 清单对象
     */
    createListNavItem(list) {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        if (list.id === this.currentListId) {
            listItem.classList.add('active');
        }
        
        // 为收藏的清单添加特殊样式
        if (list.favorited) {
            listItem.classList.add('favorited');
        }
        
        // 计算未完成项目数量
        const incompleteCount = list.items ? list.items.filter(item => !item.completed).length : 0;
        
        // 收藏状态
        const isFavorited = list.favorited || false;
        
        listItem.innerHTML = `
            <div class="list-item-content">
                <div class="list-item-text">${list.name}</div>
                <span class="list-item-count">${incompleteCount}</span>
            </div>
            <button class="list-favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    data-list-id="${list.id}" 
                    title="${isFavorited ? '取消收藏' : '收藏清单'}">
                <i class="fas fa-star"></i>
            </button>
        `;
        
        // 绑定点击事件
        listItem.addEventListener('click', (e) => {
            // 如果点击的是收藏按钮，不触发选择
            if (e.target.closest('.list-favorite-btn')) {
                return;
            }
            this.selectList(list.id);
        });
        
        // 绑定收藏按钮事件
        const favoriteBtn = listItem.querySelector('.list-favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(list.id);
        });
        
        // 添加移动端滑动功能
        this.addSwipeFunctionality(listItem, list.id);
        
        return listItem;
    },

    /**
     * 为清单项目添加滑动功能
     * @param {HTMLElement} listItem 清单项目元素
     * @param {string} listId 清单ID
     */
    addSwipeFunctionality(listItem, listId) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isSwiping = false;
        let swipeThreshold = 50; // 滑动阈值
        let originalTransform = '';
        
        // 触摸开始
        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            isSwiping = false;
            originalTransform = listItem.style.transform;
            
            // 添加滑动状态类
            listItem.classList.add('swipe-ready');
        };
        
        // 触摸移动
        const handleTouchMove = (e) => {
            if (e.touches.length !== 1) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            const deltaY = Math.abs(e.touches[0].clientY - startY);
            
            // 如果垂直滑动距离大于水平滑动距离，不处理
            if (deltaY > Math.abs(deltaX)) {
                return;
            }
            
            // 如果滑动距离超过阈值，标记为滑动状态
            if (Math.abs(deltaX) > 10) {
                isSwiping = true;
                e.preventDefault(); // 阻止默认滚动
            }
            
            if (isSwiping) {
                // 限制滑动距离，最大滑动距离为100px
                const maxSwipe = 100;
                const swipeDistance = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
                
                // 应用滑动效果
                listItem.style.transform = `translateX(${swipeDistance}px)`;
                
                // 根据滑动方向添加视觉反馈
                if (swipeDistance > 0) {
                    listItem.classList.add('swipe-right');
                    listItem.classList.remove('swipe-left');
                } else if (swipeDistance < 0) {
                    listItem.classList.add('swipe-left');
                    listItem.classList.remove('swipe-right');
                } else {
                    listItem.classList.remove('swipe-right', 'swipe-left');
                }
            }
        };
        
        // 触摸结束
        const handleTouchEnd = (e) => {
            if (!isSwiping) {
                listItem.classList.remove('swipe-ready');
                return;
            }
            
            const deltaX = currentX - startX;
            
            // 如果滑动距离超过阈值，执行相应操作
            if (Math.abs(deltaX) > swipeThreshold) {
                if (deltaX > 0) {
                    // 向右滑动 - 收藏/取消收藏
                    this.toggleFavorite(listId);
                } else {
                    // 向左滑动 - 删除清单
                    this.showDeleteConfirmDialog(listId);
                }
            }
            
            // 恢复原始位置
            listItem.style.transform = originalTransform;
            listItem.classList.remove('swipe-ready', 'swipe-right', 'swipe-left');
            
            isSwiping = false;
        };
        
        // 绑定触摸事件
        listItem.addEventListener('touchstart', handleTouchStart, { passive: false });
        listItem.addEventListener('touchmove', handleTouchMove, { passive: false });
        listItem.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // 清理函数
        const cleanup = () => {
            listItem.removeEventListener('touchstart', handleTouchStart);
            listItem.removeEventListener('touchmove', handleTouchMove);
            listItem.removeEventListener('touchend', handleTouchEnd);
        };
        
        // 在元素被移除时清理事件监听器
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === listItem || (node.nodeType === 1 && node.contains(listItem))) {
                        cleanup();
                        observer.disconnect();
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },

    /**
     * 显示删除确认对话框
     * @param {string} listId 清单ID
     */
    showDeleteConfirmDialog(listId) {
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === listId);
        
        if (!list) return;
        
        // 创建确认对话框
        const dialog = document.createElement('div');
        dialog.className = 'swipe-delete-dialog';
        dialog.innerHTML = `
            <div class="swipe-delete-content">
                <div class="swipe-delete-icon">🗑️</div>
                <div class="swipe-delete-text">删除清单"${list.name}"？</div>
                <div class="swipe-delete-actions">
                    <button class="swipe-delete-cancel">取消</button>
                    <button class="swipe-delete-confirm">删除</button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(dialog);
        
        // 绑定事件
        const cancelBtn = dialog.querySelector('.swipe-delete-cancel');
        const confirmBtn = dialog.querySelector('.swipe-delete-confirm');
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        cancelBtn.addEventListener('click', closeDialog);
        confirmBtn.addEventListener('click', () => {
            this.deleteList(listId);
            closeDialog();
        });
        
        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
        
        // 3秒后自动关闭
        setTimeout(closeDialog, 3000);
    },

    /**
     * 删除指定清单
     * @param {string} listId 清单ID
     */
    deleteList(listId) {
        try {
            const data = StorageManager.getData();
            const listIndex = data.lists.findIndex(l => l.id === listId);
            
            if (listIndex === -1) {
                UIManager.showNotification('清单不存在', 'error');
                return;
            }
            
            const list = data.lists[listIndex];
            
            // 如果删除的是当前选中的清单，清除选中状态
            if (this.currentListId === listId) {
                this.currentListId = null;
                this.showEmptyListMessage();
            }
            
            // 从数组中移除清单
            data.lists.splice(listIndex, 1);
            
            // 保存数据
            StorageManager.saveData(data);
            
            // 重新加载清单列表
            this.loadLists();
            
            // 显示成功消息
            UIManager.showNotification(`已删除清单"${list.name}"`, 'success');
            
        } catch (error) {
            console.error('删除清单时出错:', error);
            UIManager.showNotification('删除失败，请重试', 'error');
        }
    },

    /**
     * 选择清单
     * @param {string} listId 清单ID
     */
    selectList(listId) {
        this.currentListId = listId;
        
        // 更新UI状态
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === listId);
        
        if (list) {
            // 更新标题
            this.currentListTitle.textContent = list.name;
            
            // 启用按钮
            this.deleteListBtn.style.display = 'inline-flex';
            this.addListItemBtn.disabled = false;
            this.editListBtn.disabled = false;
            
            // 加载清单项目
            this.loadListItems(list);
            
            // 更新导航项的选中状态
            const listItems = this.listsNav.querySelectorAll('.list-item');
            listItems.forEach(item => {
                item.classList.toggle('active', item.querySelector('.list-item-text').textContent === list.name);
            });
        }
    },

    /**
     * 加载清单项目
     * @param {Object} list 清单对象
     */
    loadListItems(list) {
        this.listItemsContainer.innerHTML = '';
        
        if (!list) {
            this.showEmptyListMessage();
            return;
        }
        
        if (!list.items || list.items.length === 0) {
            this.listItemsContainer.innerHTML = `
                <div class="empty-list-message">
                    <div class="empty-icon">📝</div>
                    <p>这个清单还没有任何项目</p>
                </div>
            `;
            return;
        }
        
        // 如果处于批量模式，显示批量操作工具栏
        if (this.batchMode) {
            const batchToolbar = document.createElement('div');
            batchToolbar.className = 'batch-toolbar';
            batchToolbar.innerHTML = `
                <div class="batch-select-all">
                    <input type="checkbox" id="select-all-checkbox">
                    <label for="select-all-checkbox">全选</label>
                </div>
                <div class="batch-info">已选择 <span id="selected-count">0</span> 项</div>
            `;
            this.listItemsContainer.appendChild(batchToolbar);
            
            // 绑定全选事件
            const selectAllCheckbox = batchToolbar.querySelector('#select-all-checkbox');
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.batch-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
                this.updateSelectedCount();
            });
        }
        
        // 分组：未完成的在前，已完成的在后
        const incompleteItems = list.items.filter(item => !item.completed);
        const completedItems = list.items.filter(item => item.completed);
        
        // 添加未完成项目
        if (incompleteItems.length > 0) {
            const incompleteSection = document.createElement('div');
            incompleteSection.className = 'items-section';
            
            incompleteItems.forEach(item => {
                const itemElement = this.createListItemElement(item);
                incompleteSection.appendChild(itemElement);
            });
            
            this.listItemsContainer.appendChild(incompleteSection);
        }
        
        // 添加已完成项目
        if (completedItems.length > 0) {
            const completedSection = document.createElement('div');
            completedSection.className = 'completed-items-section';
            completedSection.innerHTML = '<h4>已完成</h4>';
            
            completedItems.forEach(item => {
                const itemElement = this.createListItemElement(item);
                completedSection.appendChild(itemElement);
            });
            
            this.listItemsContainer.appendChild(completedSection);
        }
        
        // 如果处于批量模式，添加更新选中计数的函数
        if (this.batchMode) {
            this.updateSelectedCount();
        }
    },

    /**
     * 显示空清单消息
     */
    showEmptyListMessage() {
        this.currentListTitle.textContent = '请选择或创建清单';
        this.deleteListBtn.style.display = 'none';
        this.addListItemBtn.disabled = true;
        this.editListBtn.disabled = true;
        
        this.listItemsContainer.innerHTML = `
            <div class="empty-list-message">
                <div class="empty-icon">📋</div>
                <p>请选择或创建一个清单</p>
            </div>
        `;
    },
    /**
     * 计算截止日期剩余天数
     * @param {string} dueDate 截止日期
     * @returns {number} 剩余天数
     */
    calculateDaysLeft(dueDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * HTML转义
     * @param {string} unsafe 不安全的字符串
     * @returns {string} 转义后的字符串
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * CSV字段转义
     * @param {string} field 字段值
     * @returns {string} 转义后的字段
     */
    escapeCsvField(field) {
        if (field === null || field === undefined) {
            return '';
        }
        
        const str = String(field);
        // 如果字段包含逗号、引号或换行符，需要用引号包围
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            // 将字段中的引号替换为两个引号
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    },

    /**
     * 导入清单数据
     * @param {File} file 导入的JSON文件
     */
    importLists(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // 验证导入数据格式
                if (!importData.lists || !Array.isArray(importData.lists) || importData.type !== 'todolist_export') {
                    alert('无效的清单数据文件');
                    return;
                }
                
                if (confirm(`确定要导入${importData.lists.length}个清单吗？这将会合并到现有数规划（电脑版）据中。`)) {
                    const data = StorageManager.getData();
                    
                    if (!data.lists) {
                        data.lists = [];
                    }
                    
                    // 合并数据，避免重复
                    const existingIds = new Set(data.lists.map(list => list.id));
                    
                    importData.lists.forEach(list => {
                        if (!existingIds.has(list.id)) {
                            data.lists.push(list);
                        }
                    });
                    
                    StorageManager.saveData(data);
                    this.loadLists();
                    
                    alert('清单数据导入成功');
                }
            } catch (error) {
                console.error('导入失败:', error);
                alert('导入失败: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    },

    /**
     * 创建清单项目元素
     * @param {Object} item 清单项目对象
     */
    createListItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'list-task-item';
        if (item.completed) {
            itemElement.classList.add('completed');
        }
        
        // 根据优先级添加不同的样式类
        if (item.priority) {
            itemElement.classList.add(`priority-${item.priority === '高' ? 'high' : item.priority === '低' ? 'low' : 'medium'}`);
        }
        
        // 如果处于批量模式，添加批量选择类
        if (this.batchMode) {
            itemElement.classList.add('batch-mode');
        }
        
        // 准备优先级标签的HTML
        const priorityLabel = item.priority ? 
            `<span class="priority-tag priority-${item.priority === '高' ? 'high' : item.priority === '低' ? 'low' : 'medium'}">
                ${item.priority}
            </span>` : '';
        
        itemElement.innerHTML = `
            ${this.batchMode ? `<input type="checkbox" class="batch-checkbox" data-item-id="${item.id}">` : ''}
            <div class="list-task-checkbox">
                <input type="checkbox" ${item.completed ? 'checked' : ''} ${this.batchMode ? 'disabled' : ''}>
            </div>
            <div class="list-task-content">
                <div class="list-task-title">
                    ${item.title}
                    ${priorityLabel}
                </div>
                ${item.dueDate ? `
                    <div class="list-task-dates">
                        <span class="list-task-date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        ${this.getCountdownHTML(item.dueDate)}
                    </div>
                ` : ''}
            </div>
            <div class="list-task-actions">
                ${!this.batchMode ? `
                <button class="list-task-action edit-task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="list-task-action delete-task">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        `;
        
        // 绑定事件
        if (!this.batchMode) {
            const checkbox = itemElement.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => this.toggleItemCompletion(item.id));
            
            const editBtn = itemElement.querySelector('.edit-task');
            editBtn.addEventListener('click', () => this.editListItem(item.id));
            
            const deleteBtn = itemElement.querySelector('.delete-task');
            deleteBtn.addEventListener('click', () => this.deleteListItem(item.id));
        } else {
            // 在批量模式下，绑定批量复选框事件
            const batchCb = itemElement.querySelector('.batch-checkbox');
            if (batchCb) {
                batchCb.addEventListener('change', () => {
                    this.updateSelectedCount();
                });
            }
        }
        
        return itemElement;
    },

    /**
     * 获取倒计时HTML
     * @param {string} dueDate 截止日期
     */
    getCountdownHTML(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        
        let countdownClass = 'countdown-normal';
        if (diffDays <= 3) {
            countdownClass = 'countdown-warning';
        }
        if (diffDays <= 1) {
            countdownClass = 'countdown-danger';
        }
        
        let countdownText = '';
        if (diffDays < 0) {
            countdownText = `已逾期 ${Math.abs(diffDays)} 天`;
        } else if (diffDays === 0) {
            countdownText = '今天到期';
        } else {
            countdownText = `还剩 ${diffDays} 天`;
        }
        
        return `
            <span class="list-task-countdown ${countdownClass}">
                <i class="fas fa-clock"></i>
                ${countdownText}
            </span>
        `;
    },

    /**
     * 创建新清单
     */
    createNewList() {
        const listName = prompt('请输入清单名称:');
        if (!listName) return;
        
        const data = StorageManager.getData();
        if (!data.lists) {
            data.lists = [];
        }
        
        const newList = {
            id: Date.now().toString(),
            name: listName,
            items: [],
            createTime: new Date().toISOString()
        };
        
        data.lists.push(newList);
        StorageManager.saveData(data);
        
        // 重新加载清单并选择新创建的清单
        this.loadLists();
        this.selectList(newList.id);
    },

    /**
     * 编辑当前清单
     */
    editCurrentList() {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        
        if (!list) return;
        
        const newName = prompt('请输入新的清单名称:', list.name);
        if (!newName || newName === list.name) return;
        
        list.name = newName;
        list.updateTime = new Date().toISOString();
        
        StorageManager.saveData(data);
        this.loadLists();
    },

    /**
     * 删除当前清单
     */
    deleteCurrentList() {
        if (!this.currentListId) return;
        
        if (!confirm('确定要删除这个清单吗？此操作不可恢复。')) return;
        
        const data = StorageManager.getData();
        data.lists = data.lists.filter(l => l.id !== this.currentListId);
        
        StorageManager.saveData(data);
        
        this.currentListId = null;
        this.loadLists();
        this.showEmptyListMessage();
    },

    /**
     * 添加清单项目
     */
    addListItem() {
        if (!this.currentListId) return;
        
        const title = prompt('请输入待办事项:');
        if (!title) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        
        if (!list) return;
        
        const dueDate = prompt('请输入截止日期 (可选，格式：YYYY-MM-DD):');
        
        // 添加优先级选择
        let priority = prompt('请输入优先级 (高/中/低):', '中');
        // 验证优先级输入
        if (!priority || !['高', '中', '低'].includes(priority)) {
            priority = '中'; // 默认为中优先级
        }
        
        const newItem = {
            id: Date.now().toString(),
            title,
            completed: false,
            createTime: new Date().toISOString(),
            priority: priority // 添加优先级属性
        };
        
        if (dueDate) {
            newItem.dueDate = new Date(dueDate).toISOString();
        }
        
        if (!list.items) {
            list.items = [];
        }
        
        list.items.push(newItem);
        StorageManager.saveData(data);
        
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
    },

    /**
     * 编辑清单项目
     * @param {string} itemId 项目ID
     */
    editListItem(itemId) {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        const item = list.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        const newTitle = prompt('请输入新的待办事项:', item.title);
        if (!newTitle || newTitle === item.title) return;
        
        const newDueDate = prompt('请输入新的截止日期 (可选，格式：YYYY-MM-DD):', 
            item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '');
        
        // 添加优先级修改
        let newPriority = prompt('请输入新的优先级 (高/中/低):', item.priority || '中');
        if (!newPriority || !['高', '中', '低'].includes(newPriority)) {
            newPriority = item.priority || '中'; // 保持原优先级或默认为中
        }
        
        item.title = newTitle;
        item.updateTime = new Date().toISOString();
        item.priority = newPriority; // 更新优先级
        
        if (newDueDate) {
            item.dueDate = new Date(newDueDate).toISOString();
        } else {
            delete item.dueDate;
        }
        
        StorageManager.saveData(data);
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
    },

    /**
     * 删除清单项目
     * @param {string} itemId 项目ID
     */
    deleteListItem(itemId) {
        if (!this.currentListId) return;
        
        if (!confirm('确定要删除这个待办事项吗？')) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        
        if (!list) return;
        
        // 查找要删除的项目，检查是否已完成
        const item = list.items.find(i => i.id === itemId);
        const wasCompleted = item && item.completed;
        
        // 删除项目
        list.items = list.items.filter(i => i.id !== itemId);
        StorageManager.saveData(data);
        
        // 如果删除的是已完成项目，扣除积分
        if (wasCompleted) {
            StorageManager.addPoints(-10, '清单', '删除已完成事项');
            UIManager.showNotification('删除已完成项目 -10积分', 'info');
        }
        
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
    },

    /**
     * 切换项目完成状态
     * @param {string} itemId 项目ID
     */
    toggleItemCompletion(itemId) {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === this.currentListId);
        const item = list.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        // 检查之前的完成状态
        const wasCompleted = item.completed;
        
        // 更新完成状态
        item.completed = !item.completed;
        item.completedTime = item.completed ? new Date().toISOString() : null;
        
        StorageManager.saveData(data);
        
        // 积分奖励
        if (!wasCompleted && item.completed) {
            StorageManager.addPoints(10, '清单', `完成事项：${item.title}`);
            UIManager.showNotification('🎉 任务完成 +10积分', 'success');
        } else if (wasCompleted && !item.completed) {
            StorageManager.addPoints(-10, '清单', `撤销完成事项：${item.title}`);
            UIManager.showNotification('任务标记为未完成 -10积分', 'info');
        }
        
        // 重新加载以正确显示已完成/未完成分组
        this.loadListItems(list);
        this.loadLists(); // 更新导航中的未完成数量
    },

    /**
     * 搜索清单
     * @param {string} query 搜索关键词
     */
    searchLists(query) {
        const data = StorageManager.getData();
        if (!data.lists) return;
        
        const normalizedQuery = query.toLowerCase().trim();
        
        // 如果没有搜索词，显示所有清单
        if (!normalizedQuery) {
            this.loadLists();
            return;
        }
        
        // 过滤匹配的清单
        const matchedLists = data.lists.filter(list => {
            // 匹配清单名称
            if (list.name.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // 匹配清单项目
            if (list.items && list.items.some(item => 
                item.title.toLowerCase().includes(normalizedQuery)
            )) {
                return true;
            }
            
            return false;
        });
        
        // 排序：收藏的清单在前，未收藏的在后
        const sortedLists = matchedLists.sort((a, b) => {
            const aFavorited = a.favorited || false;
            const bFavorited = b.favorited || false;
            
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            
            // 如果收藏状态相同，按创建时间排序（新的在前）
            return new Date(b.createTime || 0) - new Date(a.createTime || 0);
        });
        
        // 分离收藏和未收藏的清单
        const favoritedLists = sortedLists.filter(list => list.favorited);
        const unfavoritedLists = sortedLists.filter(list => !list.favorited);
        
        // 清空并重新填充导航
        this.listsNav.innerHTML = '';
        
        if (matchedLists.length === 0) {
            this.listsNav.innerHTML = `
                <div class="empty-search-message">
                    <p>未找到匹配的清单</p>
                </div>
            `;
            return;
        }
        
        // 添加收藏的清单
        if (favoritedLists.length > 0) {
            favoritedLists.forEach(list => {
                const listElement = this.createListNavItem(list);
                this.listsNav.appendChild(listElement);
            });
        }
        
        // 添加分隔线（如果有收藏和未收藏的清单）
        if (favoritedLists.length > 0 && unfavoritedLists.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'favorite-separator';
            separator.textContent = '其他清单';
            this.listsNav.appendChild(separator);
        }
        
        // 添加未收藏的清单
        unfavoritedLists.forEach(list => {
            const listElement = this.createListNavItem(list);
            this.listsNav.appendChild(listElement);
        });
    },

    /**
     * 更新已选中项目的计数
     */
    updateSelectedCount() {
        const countElement = document.getElementById('selected-count');
        if (!countElement) return;
        
        const selectedCount = document.querySelectorAll('.batch-checkbox:checked').length;
        countElement.textContent = selectedCount;
        
        // 如果有选中项目，启用批量删除按钮
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.disabled = selectedCount === 0;
        }
    },

    getTodolistPreviewItems(list) {
        if (!list.items || list.items.length === 0) {
            return '<div class="empty-preview">暂无项目</div>';
        }
        
        // 按是否完成排序，同时考虑优先级
        const sortedItems = [...list.items].sort((a, b) => {
            // 首先按照完成状态排序
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // 如果都是未完成的，按优先级排序
            if (!a.completed && !b.completed && a.priority && b.priority) {
                // 获取优先级值
                const getPriorityValue = (priority) => {
                    if (priority === '高' || priority === 'high') return 3;
                    if (priority === '中' || priority === 'medium') return 2;
                    if (priority === '低' || priority === 'low') return 1;
                    return 0;
                };
                
                return getPriorityValue(b.priority) - getPriorityValue(a.priority);
            }
            
            return 0;
        });
        
        // 只显示前2个项目
        const previewItems = sortedItems.slice(0, 2);
        
        let html = '';
        previewItems.forEach(item => {
            // 处理截止日期信息
            let dueDateHtml = '';
            if (item.dueDate) {
                const diffDays = this.calculateDaysLeft(item.dueDate);
                let countdownClass = '';
                let countdownText = '';
                
                if (diffDays < 0) {
                    countdownClass = 'due-overdue';
                    countdownText = `已逾期 ${Math.abs(diffDays)} 天`;
                } else if (diffDays === 0) {
                    countdownClass = 'due-today';
                    countdownText = '今天到期';
                } else if (diffDays <= 3) {
                    countdownClass = 'due-soon';
                    countdownText = `还剩 ${diffDays} 天`;
                } else {
                    countdownClass = 'due-future';
                    countdownText = `还剩 ${diffDays} 天`;
                }
                
                dueDateHtml = `<span class="preview-due-date ${countdownClass}">${countdownText}</span>`;
            }
            
            // 添加优先级标签
            let priorityHtml = '';
            if (item.priority && !item.completed) {
                let priorityClass = '';
                let priorityIcon = '';
                let priorityText = '';
                
                // 统一处理中文和英文格式的优先级
                if (item.priority === 'high' || item.priority === '高') {
                    priorityClass = 'priority-high';
                    priorityIcon = 'exclamation-circle';
                    priorityText = '高';
                } else if (item.priority === 'medium' || item.priority === '中') {
                    priorityClass = 'priority-medium';
                    priorityIcon = 'exclamation';
                    priorityText = '中';
                } else if (item.priority === 'low' || item.priority === '低') {
                    priorityClass = 'priority-low';
                    priorityIcon = 'arrow-down';
                    priorityText = '低';
                }
                
                priorityHtml = `<span class="preview-priority-tag ${priorityClass}">
                    <i class="fas fa-${priorityIcon}"></i> ${priorityText}
                </span>`;
            }
            
            html += `
                <div class="preview-list-item ${item.completed ? 'completed' : ''} ${item.priority ? 'priority-' + ((item.priority === 'high' || item.priority === '高') ? 'high' : ((item.priority === 'medium' || item.priority === '中') ? 'medium' : 'low')) : ''}">
                    <span class="preview-checkbox ${item.completed ? 'checked' : ''}"></span>
                    <div class="preview-item-content">
                        <span class="preview-item-title">${item.title}</span>
                        <div class="preview-item-tags">
                            ${priorityHtml}
                            ${dueDateHtml}
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    },

    showImportModal() {
        if (this.todolistImportModal) {
            this.todolistImportModal.style.display = 'block';
            this.todolistImportText.value = '';
        } else {
            console.error('导入模态框元素未找到');
        }
    },

    hideImportModal() {
        if (this.todolistImportModal) {
            this.todolistImportModal.style.display = 'none';
            this.todolistImportText.value = '';
        }
    },

    importFromText() {
        const text = this.todolistImportText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要导入的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const lists = new Map(); // 使用Map存储清单
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，至少需要清单名称和事项内容`);
                return;
            }

            try {
                const listName = parts[0];
                const itemContent = parts[1];
                const dueDate = parts[2] ? new Date(parts[2]) : null;
                const priority = parts[3] || '中';
                const tags = parts[4] ? parts[4].split(',').map(tag => tag.trim()) : [];

                // 验证日期格式
                if (parts[2] && isNaN(dueDate.getTime())) {
                    throw new Error('日期格式无效');
                }

                // 验证优先级
                if (!['高', '中', '低'].includes(priority)) {
                    throw new Error('优先级必须是"高"、"中"或"低"');
                }

                // 获取或创建清单
                if (!lists.has(listName)) {
                    lists.set(listName, {
                        id: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: listName,
                        items: [],
                        createTime: new Date().toISOString()
                    });
                }

                const list = lists.get(listName);

                // 添加清单项
                list.items.push({
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: itemContent,
                    completed: false,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    priority: priority,
                    tags: tags
                });
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`导入出错：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有清单
        try {
            // 将Map转换为数组
            const listsArray = Array.from(lists.values());
            
            listsArray.forEach(list => {
                StorageManager.saveList(list);
            });

            // 清空输入框并关闭模态框
            this.hideImportModal();

            // 刷新清单列表
            this.loadLists();

            UIManager.showNotification(`成功导入 ${listsArray.length} 个清单`, 'success');
        } catch (error) {
            UIManager.showNotification(`保存清单时出错：${error.message}`, 'error');
        }
    },

    createTaskItem(task, todolist = null) {
        const taskElement = document.createElement('div');
        taskElement.className = 'todolist-item';
        taskElement.dataset.taskId = task.id;
        
        // 获取搜索词（如果有）
        const searchInput = document.getElementById('todolist-search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        // 高亮匹配文本的函数
        const highlightMatch = (text) => {
            if (!searchTerm || !text) return text;
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            return text.replace(regex, '<span class="highlight-match">$1</span>');
        };
        
        // 创建任务内容
        const taskContent = `
            <div class="todolist-checkbox ${task.completed ? 'checked' : ''}"></div>
            <div class="todolist-content">
                <div class="todolist-title ${task.completed ? 'completed' : ''}">
                    ${highlightMatch(task.name)}
                </div>
                <div class="todolist-meta">
                    ${task.dueDate ? `
                        <div class="todolist-date">
                            <i class="far fa-calendar"></i>
                            ${highlightMatch(this.formatDate(task.dueDate))}
                        </div>
                    ` : ''}
                    ${task.priority ? `
                        <div class="todolist-priority ${task.priority.toLowerCase()}">
                            ${highlightMatch(task.priority)}
                        </div>
                    ` : ''}
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="todolist-tags">
                            ${task.tags.map(tag => `
                                <span class="todolist-tag">${highlightMatch(tag)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ${task.content ? `
                    <div class="todolist-description">
                        ${highlightMatch(task.content)}
                    </div>
                ` : ''}
            </div>
            <div class="todolist-actions">
                <button class="todolist-action-btn edit" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todolist-action-btn delete" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        taskElement.innerHTML = taskContent;
        
        // 添加事件监听器
        const checkbox = taskElement.querySelector('.todolist-checkbox');
        checkbox.addEventListener('click', () => this.toggleTaskCompletion(task.id, todolist));
        
        const editBtn = taskElement.querySelector('.todolist-action-btn.edit');
        editBtn.addEventListener('click', () => this.editTask(task.id, todolist));
        
        const deleteBtn = taskElement.querySelector('.todolist-action-btn.delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id, todolist));
        
        return taskElement;
    },

    /**
     * 显示编辑模态框
     */
    showEditModal() {
        // 获取当前所有清单数据
        const data = StorageManager.getData();
        const lists = data.lists || [];
        
        // 将清单数据转换为文本格式
        const text = lists.map(list => {
            return list.items.map(item => {
                const parts = [
                    list.name,
                    item.title,
                    item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
                    item.priority || '中',
                    item.tags ? item.tags.join(',') : ''
                ];
                return parts.join(' | ');
            }).join('\n');
        }).join('\n');
        
        // 显示模态框并填充文本
        this.todolistEditText.value = text;
        this.todolistEditModal.style.display = 'block';
    },

    /**
     * 隐藏编辑模态框
     */
    hideEditModal() {
        this.todolistEditModal.style.display = 'none';
        this.todolistEditText.value = '';
    },

    /**
     * 保存编辑的更改
     */
    saveEditChanges() {
        const text = this.todolistEditText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要编辑的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const lists = new Map(); // 使用Map存储清单
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，至少需要清单名称和事项内容`);
                return;
            }

            try {
                const listName = parts[0];
                const itemContent = parts[1];
                const dueDate = parts[2] ? new Date(parts[2]) : null;
                const priority = parts[3] || '中';
                const tags = parts[4] ? parts[4].split(',').map(tag => tag.trim()) : [];

                // 验证日期格式
                if (parts[2] && isNaN(dueDate.getTime())) {
                    throw new Error('日期格式无效');
                }

                // 验证优先级
                if (!['高', '中', '低'].includes(priority)) {
                    throw new Error('优先级必须是"高"、"中"或"低"');
                }

                // 获取或创建清单
                if (!lists.has(listName)) {
                    lists.set(listName, {
                        id: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: listName,
                        items: [],
                        createTime: new Date().toISOString()
                    });
                }

                const list = lists.get(listName);

                // 添加清单项
                list.items.push({
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: itemContent,
                    completed: false,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    priority: priority,
                    tags: tags
                });
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`编辑出错：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有清单
        try {
            // 将Map转换为数组
            const listsArray = Array.from(lists.values());
            
            // 保存到存储
            const data = StorageManager.getData();
            data.lists = listsArray;
            StorageManager.saveData(data);

            // 清空输入框并关闭模态框
            this.hideEditModal();

            // 刷新清单列表
            this.loadLists();

            UIManager.showNotification(`成功保存 ${listsArray.length} 个清单`, 'success');
        } catch (error) {
            UIManager.showNotification(`保存清单时出错：${error.message}`, 'error');
        }
    },

    /**
     * 切换清单收藏状态
     * @param {string} listId 清单ID
     */
    toggleFavorite(listId) {
        try {
            const data = StorageManager.getData();
            const list = data.lists.find(l => l.id === listId);
            
            if (list) {
                const wasFavorited = list.favorited || false;
                list.favorited = !wasFavorited;
                
                // 保存数据
                StorageManager.saveData(data);
                
                // 重新加载清单列表
                this.loadLists();
                
                // 显示用户反馈
                const action = list.favorited ? '收藏' : '取消收藏';
                UIManager.showNotification(`已${action}清单"${list.name}"`, 'success');
                
                // 如果当前选中的清单被收藏/取消收藏，更新其显示
                if (this.currentListId === listId) {
                    this.selectList(listId);
                }
            }
        } catch (error) {
            console.error('切换收藏状态时出错:', error);
            UIManager.showNotification('操作失败，请重试', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const shareBtn = document.getElementById('share-list-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            // 获取当前清单
            const data = StorageManager.getData();
            const currentTitle = document.getElementById('current-list-title').textContent.trim();
            const list = data.lists && data.lists.find(l => l.name === currentTitle);
            if (!list) {
                alert('未找到当前清单');
                return;
            }
            let shareText = `🗒️【清单】${list.name}\n`;
            shareText += `-----------------------------\n`;
            if (list.items && list.items.length > 0) {
                list.items.forEach((item, idx) => {
                    const status = item.completed ? '✅ 已完成' : '⏳ 未完成';
                    let line = ` ${item.completed ? '✔️' : ''} ${idx + 1}. ${item.title}`;
                    if (item.dueDate) {
                        const date = new Date(item.dueDate);
                        line += `（截止：${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                        line += ')';
                    }
                    line += `  ${status}`;
                    shareText += line + '\n';
                });
            } else {
                shareText += '（暂无事项）\n';
            }
            shareText += `-----------------------------\n`;
            shareText += `🎉 来自有数规划（电脑版）`;
            // 复制到剪贴板
            const showShareTip = () => {
                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                    UIManager.showNotification('清单内容已复制，可粘贴到微信/QQ等', 3000);
                } else {
                    let notification = document.querySelector('.notification');
                    if (!notification) {
                        notification = document.createElement('div');
                        notification.className = 'notification';
                        document.body.appendChild(notification);
                        notification.style.position = 'fixed';
                        notification.style.bottom = '70px';
                        notification.style.left = '50%';
                        notification.style.transform = 'translateX(-50%)';
                        notification.style.padding = '10px 20px';
                        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        notification.style.color = 'white';
                        notification.style.borderRadius = '4px';
                        notification.style.zIndex = '9999';
                        notification.style.transition = 'opacity 0.3s';
                    }
                    notification.textContent = '清单内容已复制，可粘贴到微信/QQ等';
                    notification.style.opacity = '1';
                    if (window._shareTipTimer) clearTimeout(window._shareTipTimer);
                    window._shareTipTimer = setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            if (notification.parentNode) notification.parentNode.removeChild(notification);
                        }, 300);
                    }, 3000);
                }
            };
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(showShareTip, showShareTip);
            } else {
                // 兼容旧浏览器
                const textarea = document.createElement('textarea');
                textarea.value = shareText;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showShareTip();
                } catch (err) {
                    alert('复制失败，请手动复制');
                }
                document.body.removeChild(textarea);
            }
        });
    }
}); 