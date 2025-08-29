/**
 * List Manager
 * Responsible for creating, editing, deleting and managing todo Lists
 */
const TodoListManager = {
    currentListId: null,
    batchMode: false, // Batch Selection Mode

    /**
     * Initialize List Manager
     */
    init() {
        console.log('Initialize List Manager');
        
        // Get DOM elements
        this.ListsContainer = document.querySelector('.Lists-container');
        this.ListsNav = document.getElementById('Lists-nav');
        this.ListItemsContainer = document.getElementById('List-items-container');
        this.currentListTitle = document.getElementById('current-List-title');
        this.addListBtn = document.getElementById('add-List-btn');
        this.deleteListBtn = document.getElementById('delete-List-btn');
        this.addListItemBtn = document.getElementById('add-List-item-btn');
        this.editListBtn = document.getElementById('edit-List-btn');
        this.ListSearch = document.getElementById('List-search');
        this.clearListSearchBtn = document.getElementById('clear-List-search-btn');
        this.importListsInput = document.getElementById('import-Lists-input');
        this.importListsTextBtn = document.getElementById('import-Lists-text-btn');
        this.editListsTextBtn = document.getElementById('edit-Lists-text-btn');
        this.todoListImportModal = document.getElementById('todoList-import-modal');
        this.todoListEditModal = document.getElementById('todoList-edit-modal');
        this.closeImportModal = document.getElementById('close-todoList-import-modal');
        this.closeEditModal = document.getElementById('close-todoList-edit-modal');
        this.todoListImportText = document.getElementById('todoList-import-text');
        this.todoListEditText = document.getElementById('todoList-edit-text');
        this.confirmImport = document.getElementById('confirm-todoList-import');
        this.confirmEdit = document.getElementById('confirm-todoList-edit');
        this.cancelImport = document.getElementById('cancel-todoList-import');
        this.cancelEdit = document.getElementById('cancel-todoList-edit');
        
        // Batch operation related elements
        this.toggleBatchModeBtn = document.getElementById('toggle-batch-mode-btn');
        this.batchDeleteBtn = document.getElementById('batch-delete-btn');
        
        // Bind Events
        this.bindEvents();
        
        // Load Lists
        this.loadLists();
    },

    /**
     * Bind Events
     */
    bindEvents() {
        // Create New List
        this.addListBtn.addEventListener('click', () => this.createNewList());
        
        // Delete Current List
        this.deleteListBtn.addEventListener('click', () => this.deleteCurrentList());
        
        // Add List Item
        this.addListItemBtn.addEventListener('click', () => this.addListItem());
        
        // Edit List
        this.editListBtn.addEventListener('click', () => this.editCurrentList());
        
        // Import List File
        this.importListsInput.addEventListener('change', (e) => this.importLists(e.target.files[0]));
        
        // Import List Text
        this.importListsTextBtn.addEventListener('click', () => this.showImportModal());
        
        // Close import modal
        this.closeImportModal.addEventListener('click', () => this.hideImportModal());
        this.cancelImport.addEventListener('click', () => this.hideImportModal());
        
        // Confirm import
        this.confirmImport.addEventListener('click', () => this.importFromText());
        
        // Search List
        this.ListSearch.addEventListener('input', (e) => {
            const query = e.target.value;
            // Show or hide clear button
            if (query) {
                this.clearListSearchBtn.style.display = 'flex';
            } else {
                this.clearListSearchBtn.style.display = 'none';
                this.loadLists(); // Show all Lists when search is cleared
            }
            this.searchLists(query);
        });
        
        // Clear search button
        if (this.clearListSearchBtn) {
            this.clearListSearchBtn.addEventListener('click', () => {
                this.ListSearch.value = '';
                this.clearListSearchBtn.style.display = 'none';
                this.loadLists(); // Reload所有List
            });
        }

        // Batch operation related
        if (this.toggleBatchModeBtn) {
            this.toggleBatchModeBtn.addEventListener('click', () => this.toggleBatchMode());
        }
        
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.addEventListener('click', () => this.batchDeleteItems());
        }

        // Text edit button
        this.editListsTextBtn.addEventListener('click', () => this.showEditModal());
        
        // Close edit modal
        this.closeEditModal.addEventListener('click', () => this.hideEditModal());
        this.cancelEdit.addEventListener('click', () => this.hideEditModal());
        
        // Confirm edit
        this.confirmEdit.addEventListener('click', () => this.saveEditChanges());
    },

    /**
     * Toggle Batch Selection Mode
     */
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        
        // Update button state
        this.toggleBatchModeBtn.classList.toggle('active', this.batchMode);
        this.toggleBatchModeBtn.innerHTML = this.batchMode ? 
            '<i class="fas fa-times"></i> Cancel Select' : 
            '<i class="fas fa-check-square"></i> Batch Select';
        
        // Show/hide batch delete button
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.style.display = this.batchMode ? 'flex' : 'none';
        }
        
        // Update task Item display
        this.loadListItems(this.getCurrentList());
    },

    /**
     * Get current List
     * @returns {Object|null} 当前List对象或null
     */
    getCurrentList() {
        if (!this.currentListId) return null;
        
        const data = StorageManager.getData();
        return data.Lists.find(l => l.id === this.currentListId);
    },

    /**
     * Batch delete selected Items
     */
    batchDeleteItems() {
        if (!this.currentListId || !this.batchMode) return;
        
        // Prevent duplicate calls
        if (this._isBatchDeleting) {
            return;
        }
        
        this._isBatchDeleting = true;
        
        const checkboxes = document.querySelectorAll('.batch-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('Please select at least one Item');
            this._isBatchDeleting = false;
            return;
        }
        
        if (!confirm(`Are you sure you want to delete the selected ${checkboxes.length} Items? This action cannot be undone.`)) {
            this._isBatchDeleting = false;
            return;
        }
        
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === this.currentListId);
        
        if (!List) {
            this._isBatchDeleting = false;
            return;
        }
        
        // Collect ItemIDs to delete
        const itemIds = Array.from(checkboxes).map(cb => cb.dataset.itemId);
        
        // Find completed Items to deduct points
        const completedItems = List.items.filter(item => itemIds.includes(item.id) && item.completed);
        const completedCount = completedItems.length;
        
        // Filter out Items to delete
        List.items = List.items.filter(item => !itemIds.includes(item.id));
        
        StorageManager.saveData(data);
        
        // If deletion includes completed Items, deduct points
        if (completedCount > 0) {
            const pointsDeduction = completedCount * -10;
            StorageManager.addPoints(pointsDeduction, 'List', 'Delet已完成事项');
            UIManager.showNotification(`Delet了${completedCount}个已完成Item ${pointsDeduction}积分`, 'info');
        }
        
        // Exit batch mode if all Items are deleted
        if (List.items.length === 0) {
            this.batchMode = false;
            this.toggleBatchModeBtn.classList.remove('active');
            this.toggleBatchModeBtn.innerHTML = '<i class="fas fa-check-square"></i> Batch Select';
            if (this.batchDeleteBtn) {
                this.batchDeleteBtn.style.display = 'none';
            }
        }
        
        // Reload
        this.loadListItems(List);
        this.loadLists(); // 更新导航medium的未完成数量
        
        // Reset state
        this._isBatchDeleting = false;
    },

    /**
     * Load all Lists
     */
    loadLists() {
        const data = StorageManager.getData();
        const Lists = data.Lists || [];
        
        if (Lists.length === 0) {
            this.showEmptyListMessage();
            return;
        }
        
        // Clear existing list
        this.ListsNav.innerHTML = '';
        
        // Sort: Favorited Lists first, unfavorited Lists last
        const sortedLists = Lists.sort((a, b) => {
            const aFavorited = a.favorited || false;
            const bFavorited = b.favorited || false;
            
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            
            // 如果Favorite status相同，按Create time排序（新的在前）
            return new Date(b.createTime || 0) - new Date(a.createTime || 0);
        });
        
        // Separate favorited and unfavorited Lists
        const favoritedLists = sortedLists.filter(List => List.favorited);
        const unfavoritedLists = sortedLists.filter(List => !List.favorited);
        
        // Add favorited Lists
        if (favoritedLists.length > 0) {
            favoritedLists.forEach(List => {
                const ListElement = this.createListNavItem(List);
                this.ListsNav.appendChild(ListElement);
            });
        }
        
        // Add separator (if there are favorited and unfavorited Lists)
        if (favoritedLists.length > 0 && unfavoritedLists.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'favorite-separator';
            separator.textContent = '其他List';
            this.ListsNav.appendChild(separator);
        }
        
        // Add unfavorited Lists
        unfavoritedLists.forEach(List => {
            const ListElement = this.createListNavItem(List);
            this.ListsNav.appendChild(ListElement);
        });
        
        // If there is a currently selected List, load its content
        if (this.currentListId) {
            const currentList = Lists.find(l => l.id === this.currentListId);
            if (currentList) {
                this.loadListItems(currentList);
            }
        }
        
        // Notify QuickNav to update count
        if (window.QuickNavManager && typeof QuickNavManager.triggerDataUpdate === 'function') {
            QuickNavManager.triggerDataUpdate();
        }
    },

    /**
     * Create List navigation item
     * @param {Object} List List对象
     */
    createListNavItem(List) {
        const ListItem = document.createElement('div');
        ListItem.className = 'List-item';
        if (List.id === this.currentListId) {
            ListItem.classList.add('active');
        }
        
        // Add special style for favorited Lists
        if (List.favorited) {
            ListItem.classList.add('favorited');
        }
        
        // Calculate incomplete Item count
        const incompleteCount = List.items ? List.items.filter(item => !item.completed).length : 0;
        
        // Favorite status
        const isFavorited = List.favorited || false;
        
        ListItem.innerHTML = `
            <div class="List-item-content">
                <div class="List-item-text">${List.name}</div>
                <span class="List-item-count">${incompleteCount}</span>
            </div>
            <button class="List-favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    data-List-id="${List.id}" 
                    title="${isFavorited ? '取消收藏' : '收藏List'}">
                <i class="fas fa-star"></i>
            </button>
        `;
        
        // Bind click events
        ListItem.addEventListener('click', (e) => {
            // 如果点击的是收藏按钮，不触发Select
            if (e.target.closest('.List-favorite-btn')) {
                return;
            }
            this.selectList(List.id);
        });
        
        // Bind favorite button events
        const favoriteBtn = ListItem.querySelector('.List-favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(List.id);
        });
        
        // Add swipe functionality for mobile
        this.addSwipeFunctionality(ListItem, List.id);
        
        return ListItem;
    },

    /**
     * 为ListItem添加滑动功能
     * @param {HTMLElement} ListItem ListItem元素
     * @param {string} ListId ListID
     */
    addSwipeFunctionality(ListItem, ListId) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isSwiping = false;
        let swipeThreshold = 50; // 滑动阈值
        let originalTransform = '';
        
        // Touch start
        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            isSwiping = false;
            originalTransform = ListItem.style.transform;
            
            // 添加滑动状态类
            ListItem.classList.add('swipe-ready');
        };
        
        // Touch move
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
                e.preventDefault(); // Prevent default scrolling
            }
            
            if (isSwiping) {
                // 限制滑动距离，最大滑动距离为100px
                const maxSwipe = 100;
                const swipeDistance = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
                
                // Apply swipe effect
                ListItem.style.transform = `translateX(${swipeDistance}px)`;
                
                // Add visual feedback based on swipe direction
                if (swipeDistance > 0) {
                    ListItem.classList.add('swipe-right');
                    ListItem.classList.remove('swipe-left');
                } else if (swipeDistance < 0) {
                    ListItem.classList.add('swipe-left');
                    ListItem.classList.remove('swipe-right');
                } else {
                    ListItem.classList.remove('swipe-right', 'swipe-left');
                }
            }
        };
        
        // Touch end
        const handleTouchEnd = (e) => {
            if (!isSwiping) {
                ListItem.classList.remove('swipe-ready');
                return;
            }
            
            const deltaX = currentX - startX;
            
            // 如果滑动距离超过阈值，执行相应操作
            if (Math.abs(deltaX) > swipeThreshold) {
                if (deltaX > 0) {
                    // 向右滑动 - 收藏/取消收藏
                    this.toggleFavorite(ListId);
                } else {
                    // 向左滑动 - DeletList
                    this.showDeleteConfirmDialog(ListId);
                }
            }
            
            // Restore original position
            ListItem.style.transform = originalTransform;
            ListItem.classList.remove('swipe-ready', 'swipe-right', 'swipe-left');
            
            isSwiping = false;
        };
        
        // 绑定触摸Things
        ListItem.addEventListener('touchstart', handleTouchStart, { passive: false });
        ListItem.addEventListener('touchmove', handleTouchMove, { passive: false });
        ListItem.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Cleanup function
        const cleanup = () => {
            ListItem.removeEventListener('touchstart', handleTouchStart);
            ListItem.removeEventListener('touchmove', handleTouchMove);
            ListItem.removeEventListener('touchend', handleTouchEnd);
        };
        
        // Cleanup event listeners when element is removed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === ListItem || (node.nodeType === 1 && node.contains(ListItem))) {
                        cleanup();
                        observer.disconnect();
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },

    /**
     * Show delete confirmation dialog
     * @param {string} ListId ListID
     */
    showDeleteConfirmDialog(ListId) {
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === ListId);
        
        if (!List) return;
        
        // Create confirmation dialog
        const dialog = document.createElement('div');
        dialog.className = 'swipe-delete-dialog';
        dialog.innerHTML = `
            <div class="swipe-delete-content">
                <div class="swipe-delete-icon">🗑️</div>
                <div class="swipe-delete-text">DeletList"${List.name}"？</div>
                <div class="swipe-delete-actions">
                    <button class="swipe-delete-cancel">取消</button>
                    <button class="swipe-delete-confirm">Delet</button>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(dialog);
        
        // Bind Events
        const cancelBtn = dialog.querySelector('.swipe-delete-cancel');
        const confirmBtn = dialog.querySelector('.swipe-delete-confirm');
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        cancelBtn.addEventListener('click', closeDialog);
        confirmBtn.addEventListener('click', () => {
            this.deleteList(ListId);
            closeDialog();
        });
        
        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
        
        // Auto close after 3 seconds
        setTimeout(closeDialog, 3000);
    },

    /**
     * Delete specified List
     * @param {string} ListId ListID
     */
    deleteList(ListId) {
        try {
            const data = StorageManager.getData();
            const ListIndex = data.Lists.findIndex(l => l.id === ListId);
            
            if (ListIndex === -1) {
                UIManager.showNotification('List does not exist', 'error');
                return;
            }
            
            const List = data.Lists[ListIndex];
            
            // 如果Delet的是当前选medium的List，Purge选medium状态
            if (this.currentListId === ListId) {
                this.currentListId = null;
                this.showEmptyListMessage();
            }
            
            // Remove List from array
            data.Lists.splice(ListIndex, 1);
            
            // Save data
            StorageManager.saveData(data);
            
            // Reload Lists
            this.loadLists();
            
            // Show success message
            UIManager.showNotification(`已DeletList"${List.name}"`, 'success');
            
        } catch (error) {
            console.error('DeletList时出错:', error);
            UIManager.showNotification('Deletion failed, please try again', 'error');
        }
    },

    /**
     * Select List
     * @param {string} ListId ListID
     */
    selectList(ListId) {
        this.currentListId = ListId;
        
        // Update UI state
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === ListId);
        
        if (List) {
            // Update Title
            this.currentListTitle.textContent = List.name;
            
            // Enable buttons
            this.deleteListBtn.style.display = 'inline-flex';
            this.addListItemBtn.disabled = false;
            this.editListBtn.disabled = false;
            
            // Load List Items
            this.loadListItems(List);
            
            // Update selected state of navigation items
            const ListItems = this.ListsNav.querySelectorAll('.List-item');
            ListItems.forEach(item => {
                item.classList.toggle('active', item.querySelector('.List-item-text').textContent === List.name);
            });
        }
    },

    /**
     * Load List Items
     * @param {Object} List List对象
     */
    loadListItems(List) {
        this.ListItemsContainer.innerHTML = '';
        
        if (!List) {
            this.showEmptyListMessage();
            return;
        }
        
        if (!List.items || List.items.length === 0) {
            this.ListItemsContainer.innerHTML = `
                <div class="empty-List-message">
                    <div class="empty-icon">📝</div>
                    <p>There are no items in this list yet</p>
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
                    <label for="select-all-checkbox">Select all</label>
                </div>
                <div class="batch-info">已Select <span id="selected-count">0</span> 项</div>
            `;
            this.ListItemsContainer.appendChild(batchToolbar);
            
            // 绑定Select allThings
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
        const incompleteItems = List.items.filter(item => !item.completed);
        const completedItems = List.items.filter(item => item.completed);
        
        // 添加未完成Item
        if (incompleteItems.length > 0) {
            const incompleteSection = document.createElement('div');
            incompleteSection.className = 'items-section';
            
            incompleteItems.forEach(item => {
                const itemElement = this.createListItemElement(item);
                incompleteSection.appendChild(itemElement);
            });
            
            this.ListItemsContainer.appendChild(incompleteSection);
        }
        
        // 添加已完成Item
        if (completedItems.length > 0) {
            const completedSection = document.createElement('div');
            completedSection.className = 'completed-items-section';
            completedSection.innerHTML = '<h4>Completed</h4>';
            
            completedItems.forEach(item => {
                const itemElement = this.createListItemElement(item);
                completedSection.appendChild(itemElement);
            });
            
            this.ListItemsContainer.appendChild(completedSection);
        }
        
        // 如果处于批量模式，添加更新选medium计数的函数
        if (this.batchMode) {
            this.updateSelectedCount();
        }
    },

    /**
     * 显示空List消息
     */
    showEmptyListMessage() {
        this.currentListTitle.textContent = 'Please select or create a list';
        this.deleteListBtn.style.display = 'none';
        this.addListItemBtn.disabled = true;
        this.editListBtn.disabled = true;
        
        this.ListItemsContainer.innerHTML = `
            <div class="empty-List-message">
                <div class="empty-icon">📋</div>
                <p>Please select or create a list</p>
            </div>
        `;
    },
    /**
     * Calculate remaining days until due date
     * @param {string} dueDate Due date
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
            // 将字段medium的引号替换为两个引号
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    },

    /**
     * 导入List数据
     * @param {File} file 导入的JSON文件
     */
    importLists(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // 验证Import Data/File格式
                if (!importData.Lists || !Array.isArray(importData.Lists) || importData.type !== 'todoList_export') {
                    alert('Empty效的List数据文件');
                    return;
                }
                
                if (confirm(`确定要导入${importData.Lists.length}个List吗？这将会合并到现有数规划（电脑版）据medium。`)) {
                    const data = StorageManager.getData();
                    
                    if (!data.Lists) {
                        data.Lists = [];
                    }
                    
                    // 合并数据，避免Repeat
                    const existingIds = new Set(data.Lists.map(List => List.id));
                    
                    importData.Lists.forEach(List => {
                        if (!existingIds.has(List.id)) {
                            data.Lists.push(List);
                        }
                    });
                    
                    StorageManager.saveData(data);
                    this.loadLists();
                    
                    alert('List数据导入成功');
                }
            } catch (error) {
                console.error('导入失败:', error);
                alert('导入失败: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    },

    /**
     * 创建ListItem元素
     * @param {Object} item ListItem对象
     */
    createListItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'List-task-item';
        if (item.completed) {
            itemElement.classList.add('completed');
        }
        
        // 根据优先级添加不同的样式类
        if (item.priority) {
            itemElement.classList.add(`priority-${item.priority === 'high' ? 'high' : item.priority === '低' ? 'low' : 'medium'}`);
        }
        
        // 如果处于批量模式，添加Batch Select类
        if (this.batchMode) {
            itemElement.classList.add('batch-mode');
        }
        
        // 准备优先级Label的HTML
        const priorityLabel = item.priority ? 
            `<span class="priority-tag priority-${item.priority === 'high' ? 'high' : item.priority === '低' ? 'low' : 'medium'}">
                ${item.priority}
            </span>` : '';
        
        itemElement.innerHTML = `
            ${this.batchMode ? `<input type="checkbox" class="batch-checkbox" data-item-id="${item.id}">` : ''}
            <div class="List-task-checkbox">
                <input type="checkbox" ${item.completed ? 'checked' : ''} ${this.batchMode ? 'disabled' : ''}>
            </div>
            <div class="List-task-content">
                <div class="List-task-title">
                    ${item.title}
                    ${priorityLabel}
                </div>
                ${item.dueDate ? `
                    <div class="List-task-dates">
                        <span class="List-task-date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        ${this.getCountdownHTML(item.dueDate)}
                    </div>
                ` : ''}
            </div>
            <div class="List-task-actions">
                ${!this.batchMode ? `
                <button class="List-task-action edit-task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="List-task-action delete-task">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        `;
        
        // Bind Events
        if (!this.batchMode) {
            const checkbox = itemElement.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => this.toggleItemCompletion(item.id));
            
            const editBtn = itemElement.querySelector('.edit-task');
            editBtn.addEventListener('click', () => this.editListItem(item.id));
            
            const deleteBtn = itemElement.querySelector('.delete-task');
            deleteBtn.addEventListener('click', () => this.deleteListItem(item.id));
        } else {
            // 在批量模式下，绑定批量复选框Things
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
     * @param {string} dueDate Due date
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
            <span class="List-task-countdown ${countdownClass}">
                <i class="fas fa-clock"></i>
                ${countdownText}
            </span>
        `;
    },

    /**
     * Create New List
     */
    createNewList() {
        const ListName = prompt('Please enter the List name:');
        if (!ListName) return;
        
        const data = StorageManager.getData();
        if (!data.Lists) {
            data.Lists = [];
        }
        
        const newList = {
            id: Date.now().toString(),
            name: ListName,
            items: [],
            createTime: new Date().toISOString()
        };
        
        data.Lists.push(newList);
        StorageManager.saveData(data);
        
        // 重新Load Lists并Select新创建的List
        this.loadLists();
        this.selectList(newList.id);
    },

    /**
     * Edit当前List
     */
    editCurrentList() {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === this.currentListId);
        
        if (!List) return;
        
        const newName = prompt('Please enter a new List name:', List.name);
        if (!newName || newName === List.name) return;
        
        List.name = newName;
        List.updateTime = new Date().toISOString();
        
        StorageManager.saveData(data);
        this.loadLists();
    },

    /**
     * Delete Current List
     */
    deleteCurrentList() {
        if (!this.currentListId) return;
        
        if (!confirm('Are you sure you want to Delet this List? This operation is not restored.')) return;
        
        const data = StorageManager.getData();
        data.Lists = data.Lists.filter(l => l.id !== this.currentListId);
        
        StorageManager.saveData(data);
        
        this.currentListId = null;
        this.loadLists();
        this.showEmptyListMessage();
    },

    /**
     * 添加ListItem
     */
    addListItem() {
        if (!this.currentListId) return;
        
        const title = prompt('Please enter your to-dos:');
        if (!title) return;
        
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === this.currentListId);
        
        if (!List) return;
        
        const dueDate = prompt('Please enter the deadline (optional, format: YYYY-MM-DD):');
        
        // 添加优先级Select
        let priority = prompt('Choose the corresponding priority(High/Medium/Low):', 'medium');
        // 验证优先级输入
        if (!priority || !['High', 'Medium', 'Low'].includes(priority)) {
            priority = 'medium'; // 默认为medium优先级
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
        
        if (!List.items) {
            List.items = [];
        }
        
        List.items.push(newItem);
        StorageManager.saveData(data);
        
        this.loadListItems(List);
        this.loadLists(); // 更新导航medium的未完成数量
    },

    /**
     * Edit ListItem
     * @param {string} itemId ItemID
     */
    editListItem(itemId) {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === this.currentListId);
        const item = List.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        const newTitle = prompt('Please enter a new to-do:', item.title);
        if (!newTitle || newTitle === item.title) return;
        
        const newDueDate = prompt('Please enter a new due date (optional, format: YYYY-MM-DD):', 
            item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '');
        
        // 添加优先级修改
        let newPriority = prompt('Please enter a new priority (high/medium/low):', item.priority || 'medium');
        if (!newPriority || !['high', 'medium', '低'].includes(newPriority)) {
            newPriority = item.priority || 'medium'; // 保持原优先级或默认为medium
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
        this.loadListItems(List);
        this.loadLists(); // 更新导航medium的未完成数量
    },

    /**
     * DeletListItem
     * @param {string} itemId ItemID
     */
    deleteListItem(itemId) {
        if (!this.currentListId) return;
        
        if (!confirm('确定要Delet这个待办事项吗？')) return;
        
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === this.currentListId);
        
        if (!List) return;
        
        // 查找要Delet的Item，检查是否已完成
        const item = List.items.find(i => i.id === itemId);
        const wasCompleted = item && item.completed;
        
        // DeletItem
        List.items = List.items.filter(i => i.id !== itemId);
        StorageManager.saveData(data);
        
        // 如果Delet的是已完成Item，扣除积分
        if (wasCompleted) {
            StorageManager.addPoints(-10, 'List', 'Delet已完成事项');
            UIManager.showNotification('Delet已完成Item -10积分', 'info');
        }
        
        this.loadListItems(List);
        this.loadLists(); // 更新导航medium的未完成数量
    },

    /**
     * 切换Item完成状态
     * @param {string} itemId ItemID
     */
    toggleItemCompletion(itemId) {
        if (!this.currentListId) return;
        
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === this.currentListId);
        const item = List.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        // 检查之前的完成状态
        const wasCompleted = item.completed;
        
        // 更新完成状态
        item.completed = !item.completed;
        item.completedTime = item.completed ? new Date().toISOString() : null;
        
        StorageManager.saveData(data);
        
        // 积分奖励
        if (!wasCompleted && item.completed) {
            StorageManager.addPoints(10, 'List', `完成事项：${item.title}`);
            UIManager.showNotification('🎉 任务完成 +10积分', 'success');
        } else if (wasCompleted && !item.completed) {
            StorageManager.addPoints(-10, 'List', `撤销完成事项：${item.title}`);
            UIManager.showNotification('任务标记为未完成 -10积分', 'info');
        }
        
        // Reload以正确显示已完成/未完成分组
        this.loadListItems(List);
        this.loadLists(); // 更新导航medium的未完成数量
    },

    /**
     * Search List
     * @param {string} query Search关键词
     */
    searchLists(query) {
        const data = StorageManager.getData();
        if (!data.Lists) return;
        
        const normalizedQuery = query.toLowerCase().trim();
        
        // 如果没有Search词，显示所有List
        if (!normalizedQuery) {
            this.loadLists();
            return;
        }
        
        // 过滤匹配的List
        const matchedLists = data.Lists.filter(List => {
            // 匹配List名称
            if (List.name.toLowerCase().includes(normalizedQuery)) {
                return true;
            }
            
            // 匹配ListItem
            if (List.items && List.items.some(item => 
                item.title.toLowerCase().includes(normalizedQuery)
            )) {
                return true;
            }
            
            return false;
        });
        
        // Sort: Favorited Lists first, unfavorited Lists last
        const sortedLists = matchedLists.sort((a, b) => {
            const aFavorited = a.favorited || false;
            const bFavorited = b.favorited || false;
            
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            
            // 如果Favorite status相同，按Create time排序（新的在前）
            return new Date(b.createTime || 0) - new Date(a.createTime || 0);
        });
        
        // Separate favorited and unfavorited Lists
        const favoritedLists = sortedLists.filter(List => List.favorited);
        const unfavoritedLists = sortedLists.filter(List => !List.favorited);
        
        // 清空并重新填充导航
        this.ListsNav.innerHTML = '';
        
        if (matchedLists.length === 0) {
            this.ListsNav.innerHTML = `
                <div class="empty-search-message">
                    <p>未找到匹配的List</p>
                </div>
            `;
            return;
        }
        
        // Add favorited Lists
        if (favoritedLists.length > 0) {
            favoritedLists.forEach(List => {
                const ListElement = this.createListNavItem(List);
                this.ListsNav.appendChild(ListElement);
            });
        }
        
        // Add separator (if there are favorited and unfavorited Lists)
        if (favoritedLists.length > 0 && unfavoritedLists.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'favorite-separator';
            separator.textContent = '其他List';
            this.ListsNav.appendChild(separator);
        }
        
        // Add unfavorited Lists
        unfavoritedLists.forEach(List => {
            const ListElement = this.createListNavItem(List);
            this.ListsNav.appendChild(ListElement);
        });
    },

    /**
     * 更新已选mediumItem的计数
     */
    updateSelectedCount() {
        const countElement = document.getElementById('selected-count');
        if (!countElement) return;
        
        const selectedCount = document.querySelectorAll('.batch-checkbox:checked').length;
        countElement.textContent = selectedCount;
        
        // 如果有选mediumItem，启用批量Delet按钮
        if (this.batchDeleteBtn) {
            this.batchDeleteBtn.disabled = selectedCount === 0;
        }
    },

    getTodoListPreviewItems(List) {
        if (!List.items || List.items.length === 0) {
            return '<div class="empty-preview">暂EmptyItem</div>';
        }
        
        // 按是否完成排序，同时考虑优先级
        const sortedItems = [...List.items].sort((a, b) => {
            // 首先按照完成状态排序
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // 如果都是未完成的，按优先级排序
            if (!a.completed && !b.completed && a.priority && b.priority) {
                // 获取优先级值
                const getPriorityValue = (priority) => {
                    if (priority === 'high' || priority === 'high') return 3;
                    if (priority === 'medium' || priority === 'medium') return 2;
                    if (priority === '低' || priority === 'low') return 1;
                    return 0;
                };
                
                return getPriorityValue(b.priority) - getPriorityValue(a.priority);
            }
            
            return 0;
        });
        
        // 只显示前2个Item
        const previewItems = sortedItems.slice(0, 2);
        
        let html = '';
        previewItems.forEach(item => {
            // Process due date information
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
            
            // 添加优先级Label
            let priorityHtml = '';
            if (item.priority && !item.completed) {
                let priorityClass = '';
                let priorityIcon = '';
                let priorityText = '';
                
                // 统一处理medium文和英文格式的优先级
                if (item.priority === 'high' || item.priority === 'high') {
                    priorityClass = 'priority-high';
                    priorityIcon = 'exclamation-circle';
                    priorityText = 'high';
                } else if (item.priority === 'medium' || item.priority === 'medium') {
                    priorityClass = 'priority-medium';
                    priorityIcon = 'exclamation';
                    priorityText = 'medium';
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
                <div class="preview-List-item ${item.completed ? 'completed' : ''} ${item.priority ? 'priority-' + ((item.priority === 'high' || item.priority === 'high') ? 'high' : ((item.priority === 'medium' || item.priority === 'medium') ? 'medium' : 'low')) : ''}">
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
        if (this.todoListImportModal) {
            this.todoListImportModal.style.display = 'block';
            this.todoListImportText.value = '';
        } else {
            console.error('导入模态框元素未找到');
        }
    },

    hideImportModal() {
        if (this.todoListImportModal) {
            this.todoListImportModal.style.display = 'none';
            this.todoListImportText.value = '';
        }
    },

    importFromText() {
        const text = this.todoListImportText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要导入的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const Lists = new Map(); // 使用Map存储List
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，-少需要List名称和事项Content`);
                return;
            }

            try {
                const ListName = parts[0];
                const itemContent = parts[1];
                const dueDate = parts[2] ? new Date(parts[2]) : null;
                const priority = parts[3] || 'medium';
                const tags = parts[4] ? parts[4].split(',').map(tag => tag.trim()) : [];

                // 验证日期格式
                if (parts[2] && isNaN(dueDate.getTime())) {
                    throw new Error('Date format empty effect');
                }

                // 验证优先级
                if (!['high', 'medium', '低'].includes(priority)) {
                    throw new Error('优先级必须是"high"、"medium"或"低"');
                }

                // 获取或创建List
                if (!Lists.has(ListName)) {
                    Lists.set(ListName, {
                        id: 'List_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: ListName,
                        items: [],
                        createTime: new Date().toISOString()
                    });
                }

                const List = Lists.get(ListName);

                // Add List Item
                List.items.push({
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

        // 保存所有List
        try {
            // 将Map转换为数组
            const ListsArray = Array.from(Lists.values());
            
            ListsArray.forEach(List => {
                StorageManager.saveList(List);
            });

            // 清空输入框并Close模态框
            this.hideImportModal();

            // 刷新List列表
            this.loadLists();

            UIManager.showNotification(`成功导入 ${ListsArray.length} 个List`, 'success');
        } catch (error) {
            UIManager.showNotification(`保存List时出错：${error.message}`, 'error');
        }
    },

    createTaskItem(task, todoList = null) {
        const taskElement = document.createElement('div');
        taskElement.className = 'todoList-item';
        taskElement.dataset.taskId = task.id;
        
        // 获取Search词（如果有）
        const searchInput = document.getElementById('todoList-search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        // high亮匹配文本的函数
        const highlightMatch = (text) => {
            if (!searchTerm || !text) return text;
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            return text.replace(regex, '<span class="highlight-match">$1</span>');
        };
        
        // 创建任务Content
        const taskContent = `
            <div class="todoList-checkbox ${task.completed ? 'checked' : ''}"></div>
            <div class="todoList-content">
                <div class="todoList-title ${task.completed ? 'completed' : ''}">
                    ${highlightMatch(task.name)}
                </div>
                <div class="todoList-meta">
                    ${task.dueDate ? `
                        <div class="todoList-date">
                            <i class="far fa-calendar"></i>
                            ${highlightMatch(this.formatDate(task.dueDate))}
                        </div>
                    ` : ''}
                    ${task.priority ? `
                        <div class="todoList-priority ${task.priority.toLowerCase()}">
                            ${highlightMatch(task.priority)}
                        </div>
                    ` : ''}
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="todoList-tags">
                            ${task.tags.map(tag => `
                                <span class="todoList-tag">${highlightMatch(tag)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ${task.content ? `
                    <div class="todoList-description">
                        ${highlightMatch(task.content)}
                    </div>
                ` : ''}
            </div>
            <div class="todoList-actions">
                <button class="todoList-action-btn edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todoList-action-btn delete" title="Delet">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        taskElement.innerHTML = taskContent;
        
        // Add Event监听器
        const checkbox = taskElement.querySelector('.todoList-checkbox');
        checkbox.addEventListener('click', () => this.toggleTaskCompletion(task.id, todoList));
        
        const editBtn = taskElement.querySelector('.todoList-action-btn.edit');
        editBtn.addEventListener('click', () => this.editTask(task.id, todoList));
        
        const deleteBtn = taskElement.querySelector('.todoList-action-btn.delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id, todoList));
        
        return taskElement;
    },

    /**
     * 显示Edit模态框
     */
    showEditModal() {
        // 获取当前所有List数据
        const data = StorageManager.getData();
        const Lists = data.Lists || [];
        
        // 将List数据转换为文本格式
        const text = Lists.map(List => {
            return List.items.map(item => {
                const parts = [
                    List.name,
                    item.title,
                    item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
                    item.priority || 'medium',
                    item.tags ? item.tags.join(',') : ''
                ];
                return parts.join(' | ');
            }).join('\n');
        }).join('\n');
        
        // 显示模态框并填充文本
        this.todoListEditText.value = text;
        this.todoListEditModal.style.display = 'block';
    },

    /**
     * 隐藏Edit模态框
     */
    hideEditModal() {
        this.todoListEditModal.style.display = 'none';
        this.todoListEditText.value = '';
    },

    /**
     * 保存Edit的更改
     */
    saveEditChanges() {
        const text = this.todoListEditText.value.trim();
        if (!text) {
            UIManager.showNotification('Please enter the text you want to edit', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const Lists = new Map(); // 使用Map存储List
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(` ${index + 1} : Wrong format, at least the list name and item content are required`);
                return;
            }

            try {
                const ListName = parts[0];
                const itemContent = parts[1];
                const dueDate = parts[2] ? new Date(parts[2]) : null;
                const priority = parts[3] || 'Medium';
                const tags = parts[4] ? parts[4].split(',').map(tag => tag.trim()) : [];

                // 验证日期格式
                if (parts[2] && isNaN(dueDate.getTime())) {
                    throw new Error('Date format empty effect');
                }

                // 验证优先级
                if (!['High', 'Medium', 'Low'].includes(priority)) {
                    throw new Error('Priority must be "High", "Medium" or "Low"');
                }

                // 获取或创建List
                if (!Lists.has(ListName)) {
                    Lists.set(ListName, {
                        id: 'List_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: ListName,
                        items: [],
                        createTime: new Date().toISOString()
                    });
                }

                const List = Lists.get(ListName);

                // Add List Item
                List.items.push({
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: itemContent,
                    completed: false,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    priority: priority,
                    tags: tags
                });
            } catch (e) {
                errors.push(` ${index + 1} : ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`Edit error：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有List
        try {
            // 将Map转换为数组
            const ListsArray = Array.from(Lists.values());
            
            // 保存到存储
            const data = StorageManager.getData();
            data.Lists = ListsArray;
            StorageManager.saveData(data);

            // 清空输入框并Close模态框
            this.hideEditModal();

            // 刷新List列表
            this.loadLists();

            UIManager.showNotification(`Successfully saved ${ListsArray.length} Lists`, 'success');
        } catch (error) {
            UIManager.showNotification(`Error saving List：${error.message}`, 'error');
        }
    },

    /**
     * 切换ListFavorite status
     * @param {string} ListId ListID
     */
    toggleFavorite(ListId) {
        try {
            const data = StorageManager.getData();
            const List = data.Lists.find(l => l.id === ListId);
            
            if (List) {
                const wasFavorited = List.favorited || false;
                List.favorited = !wasFavorited;
                
                // Save data
                StorageManager.saveData(data);
                
                // Reload Lists
                this.loadLists();
                
                // 显示用户反馈
                const action = List.favorited ? '收藏' : '取消收藏';
                UIManager.showNotification(`已${action}List"${List.name}"`, 'success');
                
                // 如果当前选medium的List被收藏/取消收藏，更新其显示
                if (this.currentListId === ListId) {
                    this.selectList(ListId);
                }
            }
        } catch (error) {
            console.error('切换Favorite status时出错:', error);
            UIManager.showNotification('操作失败，请重试', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const shareBtn = document.getElementById('share-List-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            // Get current List
            const data = StorageManager.getData();
            const currentTitle = document.getElementById('current-List-title').textContent.trim();
            const List = data.Lists && data.Lists.find(l => l.name === currentTitle);
            if (!List) {
                alert('The current List is not found');
                return;
            }
            let shareText = `🗒️【List】${List.name}\n`;
            shareText += `-----------------------------\n`;
            if (List.items && List.items.length > 0) {
                List.items.forEach((item, idx) => {
                    const status = item.completed ? '✅ Was done' : '⏳ Unfinished';
                    let line = ` ${item.completed ? '✔️' : ''} ${idx + 1}. ${item.title}`;
                    if (item.dueDate) {
                        const date = new Date(item.dueDate);
                        line += `（Deadline-${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
                        line += ')';
                    }
                    line += `  ${status}`;
                    shareText += line + '\n';
                });
            } else {
                shareText += '(Temporary Empty Matters)\n';
            }
            shareText += `-----------------------------\n`;
            shareText += `🎉 From Treanly (Desktop Version)`;
            // Copy到剪贴板
            const showShareTip = () => {
                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                    UIManager.showNotification('List content has been copied and can be pasted to WeChat /QQ, etc.', 3000);
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
                    notification.textContent = 'List content has been copied and can be pasted to WeChat /QQ, etc.';
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
                    alert('Copy failed, please copy manually');
                }
                document.body.removeChild(textarea);
            }
        });
    }
}); 