/**
 * Countdown Day Manager
 * Responsible for managing anniversaries and Countdown Day features
 */
const CountdownManager = {
    /**
     * Initialize Countdown Day Manager
     */
    init() {
        // Add batch mode flag
        this.batchMode = false;
        this.selectedItems = new Set();
        
        this.cacheElements();
        this.bindEvents();
        this.loadCountdowns();
        this.setupNavButton();
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Main container
        this.countdownList = document.getElementById('countdown-List');
        this.emptyMessage = document.getElementById('empty-countdown-message');
        
        // Buttons
        this.addCountdownBtn = document.getElementById('add-countdown-btn');
        this.exportCountdownsBtn = document.getElementById('export-countdowns-btn');
        this.importCountdownsInput = document.getElementById('import-countdowns-input');
        this.importCountdownsTextBtn = document.getElementById('import-countdowns-text-btn');
        
        // Batch operation buttons
        this.toggleBatchModeBtn = document.getElementById('toggle-countdown-batch-mode-btn');
        this.batchDeleteBtn = document.getElementById('countdown-batch-delete-btn');
        
        // Modal elements
        this.modal = document.getElementById('countdown-modal');
        this.modalTitle = document.getElementById('countdown-modal-title');
        this.closeModalBtn = document.getElementById('close-countdown-modal');
        this.saveBtn = document.getElementById('save-countdown-btn');
        this.cancelBtn = document.getElementById('cancel-countdown-btn');
        
        // Form elements
        this.nameInput = document.getElementById('countdown-name');
        this.dateInput = document.getElementById('countdown-date');
        this.typeSelect = document.getElementById('countdown-type');
        this.iconInput = document.getElementById('countdown-icon');
        this.colorInput = document.getElementById('countdown-color');
        this.notesInput = document.getElementById('countdown-notes');
        this.iconSelector = document.getElementById('countdown-icon-selector');
        this.participantsInput = document.getElementById('countdown-participants');

        // Import modal
        this.importModal = document.getElementById('countdown-import-modal');
        this.importText = document.getElementById('countdown-import-text');
        this.closeImportModal = document.getElementById('close-countdown-import-modal');
        this.confirmImport = document.getElementById('confirm-countdown-import');
        this.cancelImport = document.getElementById('cancel-countdown-import');
    },

    /**
     * Bind events
     */
    bindEvents() {
        // Add Countdown Day button
        this.addCountdownBtn.addEventListener('click', () => this.showModal());
        
        // Modal buttons
        this.closeModalBtn.addEventListener('click', () => this.hideModal());
        this.saveBtn.addEventListener('click', () => this.saveCountdown());
        this.cancelBtn.addEventListener('click', () => this.hideModal());
        
        // Icon selector
        this.iconSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-option')) {
                const icon = e.target.dataset.icon;
                this.iconInput.value = icon;
                
                // Update selected state
                this.iconSelector.querySelectorAll('.icon-option').forEach(btn => {
                    btn.classList.toggle('selected', btn.dataset.icon === icon);
                });
            }
        });

        // Export/Import Countdown Day 
        if (this.importCountdownsInput) {
            this.importCountdownsInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.importCountdowns(e.target.files[0]);
                    // Clear file input to allow re-importing the same file
                    e.target.value = '';
                }
            });
        }
        
        // Import Countdown Day text
        this.importCountdownsTextBtn.addEventListener('click', () => this.showImportModal());
        
        // Close import modal
        this.closeImportModal.addEventListener('click', () => this.hideImportModal());
        this.cancelImport.addEventListener('click', () => this.hideImportModal());
        
        // Confirm import
        this.confirmImport.addEventListener('click', () => this.importFromText());
        
        // Batch operation buttonsThings
        this.toggleBatchModeBtn.addEventListener('click', () => {
            if (this.batchMode) {
                this.exitBatchMode();
            } else {
                this.enterBatchMode();
            }
        });
        
        this.batchDeleteBtn.addEventListener('click', () => this.batchDeleteCountdowns());

        // Search functionality
        document.getElementById('countdown-search-input').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const countdownItems = document.querySelectorAll('.countdown-item');
            let hasVisibleItems = false;
            
            // Get all Countdown Day data
            const data = StorageManager.getData();
            const countdowns = data.countdowns || [];
            
            // Sort by date: upcoming first, past last
            countdowns.sort((a, b) => {
                const daysA = CountdownManager.calculateDays(a);
                const daysB = CountdownManager.calculateDays(b);
                
                // 如果一个是未来日期，一个是过去日期，未来日期优先
                if (daysA >= 0 && daysB < 0) return -1;
                if (daysA < 0 && daysB >= 0) return 1;
                
                // 如果都是未来日期，按天数升序排列（越近的越前）
                if (daysA >= 0 && daysB >= 0) {
                    return daysA - daysB;
                }
                
                // 如果都是过去日期，按天数升序排列（越近的越前）
                if (daysA < 0 && daysB < 0) {
                    return Math.abs(daysA) - Math.abs(daysB);
                }
                
                return 0;
            });
            
            // Clear list
            const countdownList = document.getElementById('countdown-List');
            countdownList.innerHTML = '';
            
            // Filter and display matching items
            countdowns.forEach(countdown => {
                const title = countdown.name.toLowerCase();
                const date = countdown.date.toLowerCase();
                const notes = (countdown.notes || '').toLowerCase();
                
                if (title.includes(searchTerm) || date.includes(searchTerm) || notes.includes(searchTerm)) {
                    const card = CountdownManager.createCountdownCard(countdown);
                    countdownList.appendChild(card);
                    hasVisibleItems = true;
                }
            });
            
            // Update empty state display
            const emptyMessage = document.getElementById('empty-countdown-message');
            if (!hasVisibleItems && searchTerm !== '') {
                emptyMessage.innerHTML = `
                    <div class="empty-icon">🔍</div>
                    <p>No matching anniversary found</p>
                    <p class="sub-text">Try other search keywords</p>
                `;
                emptyMessage.style.display = 'block';
                countdownList.style.display = 'none';
            } else if (!hasVisibleItems) {
                emptyMessage.innerHTML = `
                    <div class="empty-icon">📅</div>
                    <p>No anniversary has been added yet</p>
                    <p class="sub-text">Click the "Add an anniversary" button in the top right corner to start adding</p>
                `;
                emptyMessage.style.display = 'block';
                countdownList.style.display = 'none';
            } else {
                emptyMessage.style.display = 'none';
                countdownList.style.display = 'grid';
            }
        });

        // Text edit button clickThings
        document.getElementById('edit-countdowns-text-btn').addEventListener('click', () => {
            this.showEditModal();
        });

        // Close edit modal
        document.getElementById('close-countdown-edit-modal').addEventListener('click', () => {
            this.hideEditModal();
        });

        // Cancel edit
        document.getElementById('cancel-countdown-edit').addEventListener('click', () => {
            this.hideEditModal();
        });

        // Confirm edit
        document.getElementById('confirm-countdown-edit').addEventListener('click', () => {
            this.saveEditChanges();
        });
        
        // Listen for theme changesThings
        document.addEventListener('themechange', (event) => {
            console.log(' Countdown Day页面检测到主题变化:', event.detail.theme);
            // 主题变化时重新加载 Countdown Day列表以确保样式正确应用
            this.loadCountdowns();
        });
    },

    /**
     * Set up navigation button
     */
    setupNavButton() {
        const navButton = document.getElementById('nav-countdown');
        if (navButton) {
            navButton.addEventListener('click', () => {
                UIManager.switchView('countdown');
            });
        }
    },

    /**
     * Show modal
     * @param {Object} countdown Countdown Day object to edit (optional)
     */
    showModal(countdown = null) {
        this.currentEditId = countdown ? countdown.id : null;
        this.modalTitle.textContent = countdown ? 'Edit纪念日' : 'Add an anniversary';
        
        // Fill form
        if (countdown) {
            this.nameInput.value = countdown.name;
            this.dateInput.value = countdown.date;
            this.typeSelect.value = countdown.type;
            this.iconInput.value = countdown.icon;
            this.colorInput.value = countdown.color;
            this.notesInput.value = countdown.notes || '';
            this.participantsInput.value = (countdown.participants || []).join(', ');
            
            // 更新图标选medium状态
            this.iconSelector.querySelectorAll('.icon-option').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.icon === countdown.icon);
            });
        } else {
            // Reset form
            this.nameInput.value = '';
            // Set默认日期为今天
            const today = new Date();
            const dateString = today.toISOString().split('T')[0];
            this.dateInput.value = dateString;
            
            this.typeSelect.value = 'once';
            this.iconInput.value = '📅';
            this.colorInput.value = '#4285f4';
            this.notesInput.value = '';
            this.participantsInput.value = '';
            
            // 重置图标选medium状态
            this.iconSelector.querySelectorAll('.icon-option').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.icon === '📅');
            });
        }
        
        this.modal.style.display = 'flex';
    },

    /**
     * Hide modal
     */
    hideModal() {
        this.modal.style.display = 'none';
        this.currentEditId = null;
    },

    /**
     * Save Countdown Day
     */
    saveCountdown() {
        const name = this.nameInput.value.trim();
        const date = this.dateInput.value;
        
        if (!name || !date) {
            alert('请填写名称和日期');
            return;
        }
        
        // Process participants
        let participants = this.participantsInput.value.split(',').map(s => s.trim()).filter(Boolean);
        
        const countdown = {
            id: this.currentEditId || Date.now().toString(),
            name,
            date,
            type: this.typeSelect.value,
            icon: this.iconInput.value,
            color: this.colorInput.value,
            notes: this.notesInput.value.trim(),
            participants,
            createTime: this.currentEditId ? undefined : new Date().toISOString(),
            updateTime: new Date().toISOString()
        };
        
        const data = StorageManager.getData();
        if (!data.countdowns) {
            data.countdowns = [];
        }
        
        if (this.currentEditId) {
            // Update existing Countdown Day
            const index = data.countdowns.findIndex(c => c.id === this.currentEditId);
            if (index !== -1) {
                const existingItem = data.countdowns[index];
                // 保留Create time
                if (existingItem.createTime) {
                    countdown.createTime = existingItem.createTime;
                }
                data.countdowns[index] = countdown;
            }
        } else {
            // Check for duplicates before adding new Countdown Day
            const isDuplicate = data.countdowns.some(existing => {
                return existing.name === countdown.name && 
                       existing.date === countdown.date && 
                       existing.type === countdown.type;
            });
            
            if (isDuplicate) {
                alert('已存在相同的 Countdown Day！\n\n名称、日期和类型完全相同的 Countdown Day已存在，请检查后重新输入。');
                return;
            }
            
            // Add new Countdown Day
            data.countdowns.push(countdown);
        }
        
        StorageManager.saveData(data);
        this.loadCountdowns();
        this.hideModal();
        
        // 移除预览刷新调用
        // if (window.TaskManager && typeof TaskManager.reloadPreviews === 'function') {
        //     TaskManager.reloadPreviews();
        // }
    },

    /**
     * Delete Countdown Day
     * @param {string} id Countdown Day ID
     */
    deleteCountdown(id) {
        if (!confirm('确定要删除这个纪念日吗？')) return;
        
        const data = StorageManager.getData();
        data.countdowns = data.countdowns.filter(c => c.id !== id);
        
        StorageManager.saveData(data);
        this.loadCountdowns();
        
        // 移除预览刷新调用
        // if (window.TaskManager && typeof TaskManager.reloadPreviews === 'function') {
        //     TaskManager.reloadPreviews();
        // }
    },

    /**
     * Toggle Countdown Day favorite status
     * @param {string} id Countdown Day ID
     */
    toggleFavorite(id) {
        const data = StorageManager.getData();
        const countdown = data.countdowns.find(c => c.id === id);
        
        if (countdown) {
            countdown.favorite = !countdown.favorite;
            countdown.updateTime = new Date().toISOString();
            
            StorageManager.saveData(data);
            this.loadCountdowns();
            
            // Show notification
            const message = countdown.favorite ? 'Added to collection' : 'Canceled collection';
            if (window.UIManager && typeof UIManager.showNotification === 'function') {
                UIManager.showNotification(message, 'success');
            } else {
                alert(message);
            }
            
            // 移除预览刷新调用
            // if (window.TaskManager && typeof TaskManager.reloadPreviews === 'function') {
            //     TaskManager.reloadPreviews();
            // }
        }
    },

    /**
     * Load all Countdown Days
     */
    loadCountdowns() {
        const data = StorageManager.getData();
        const countdowns = data.countdowns || [];
        
        if (countdowns.length === 0) {
            this.countdownList.style.display = 'none';
            this.emptyMessage.style.display = 'block';
            return;
        }
        
        this.countdownList.style.display = 'grid';
        this.emptyMessage.style.display = 'none';
        
        // Clear list
        this.countdownList.innerHTML = '';
        
        // Sort: favorites first, then by date (upcoming first, past last)
        countdowns.sort((a, b) => {
            // 首先按收藏状态排序（收藏的在前）
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            
            // 然后按日期排序：即将到来的在前，已过去的在后
            const daysA = this.calculateDays(a);
            const daysB = this.calculateDays(b);
            
            // 如果一个是未来日期，一个是过去日期，未来日期优先
            if (daysA >= 0 && daysB < 0) return -1;
            if (daysA < 0 && daysB >= 0) return 1;
            
            // 如果都是未来日期，按天数升序排列（越近的越前）
            if (daysA >= 0 && daysB >= 0) {
                return daysA - daysB;
            }
            
            // 如果都是过去日期，按天数降序排列（越近的越前）
            if (daysA < 0 && daysB < 0) {
                return Math.abs(daysA) - Math.abs(daysB);
            }
            
            return 0;
        });
        
        // Add Countdown Day cards
        countdowns.forEach(countdown => {
            const card = this.createCountdownCard(countdown);
            this.countdownList.appendChild(card);
        });
        
        // If in batch mode, update select all button state
        if (this.batchMode) {
            this.updateSelectAllButton();
        }
    },

    /**
     * Create Countdown Day card
     * @param {Object} countdown Countdown Day object
     */
    createCountdownCard(countdown) {
        const days = this.calculateDays(countdown);
        const card = document.createElement('div');
        card.className = 'countdown-card';
        card.style.setProperty('--accent-color', countdown.color);
        
        if (this.batchMode) {
            card.classList.add('batch-mode');
        }
        
        // Add favorite state class
        if (countdown.favorite) {
            card.classList.add('favorite');
        }
        
        let batchCheckboxHTML = '';
        if (this.batchMode) {
            const isChecked = this.selectedItems.has(countdown.id) ? 'checked' : '';
            batchCheckboxHTML = `
                <div class="countdown-batch-checkbox">
                    <input type="checkbox" ${isChecked} class="batch-checkbox">
                </div>
            `;
        }
        
        // 收藏按钮HTML
        const favoriteIcon = countdown.favorite ? 'fas fa-star' : 'far fa-star';
        const favoriteTitle = countdown.favorite ? 'Cancel collection' : 'Add to collection';
        
        card.innerHTML = `
            ${batchCheckboxHTML}
            <div class="countdown-header">
                <span class="countdown-icon">${countdown.icon}</span>
                <h3 class="countdown-title">${countdown.name}</h3>
                <div class="countdown-actions">
                    ${!this.batchMode ? `
                        <button class="countdown-action favorite-btn" title="${favoriteTitle}">
                            <i class="${favoriteIcon}"></i>
                        </button>
                        <button class="countdown-action edit-btn" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="countdown-action delete-btn" title="Delet">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="countdown-action share-btn" title="Share">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="countdown-days">
                ${this.formatDays(days)}
            </div>
            <div class="countdown-date">
                ${this.formatDate(countdown.date)}
                ${countdown.type !== 'once' ? ` (${this.formatTypeShort(countdown.type)})` : ''}
            </div>
            ${(countdown.participants && countdown.participants.length) ? `<div class='countdown-participants'><i class='fas fa-users'></i> 参与者：${countdown.participants.join('，')}</div>` : ''}
            ${countdown.notes ? `
                <div class="countdown-notes">
                    ${countdown.notes}
                </div>
            ` : ''}
        `;
        
        // Bind button events
        if (!this.batchMode) {
            const favoriteBtn = card.querySelector('.favorite-btn');
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            const shareBtn = card.querySelector('.share-btn');
            
            favoriteBtn.addEventListener('click', () => this.toggleFavorite(countdown.id));
            editBtn.addEventListener('click', () => this.showModal(countdown));
            deleteBtn.addEventListener('click', () => this.deleteCountdown(countdown.id));
            if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                    // Show share options modal
                    const modal = document.createElement('div');
                    modal.className = 'share-daka-image-modal';
                    modal.innerHTML = `
                        <div class='share-daka-image-popup'>
                            <button class='share-daka-image-close' title='Close'>×</button>
                            <div style='font-size:18px;font-weight:600;margin-bottom:18px;text-align:center;'>Choose a sharing method</div>
                            <div class='share-daka-image-actions' style='margin-bottom:8px;'>
                                <button class='share-daka-image-btn' id='countdown-img-share-btn'><i class='fas fa-image'></i> 图片Share</button>
                                <button class='share-daka-image-btn' id='countdown-text-share-btn'><i class='fas fa-font'></i> 文字Share</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    modal.querySelector('.share-daka-image-close').onclick = () => modal.remove();
                    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
                    // Image share
                    modal.querySelector('#countdown-img-share-btn').onclick = () => {
                        modal.remove();
                        const days = CountdownManager.calculateDays(countdown);
                        const data = {
                            icon: countdown.icon,
                            name: countdown.name,
                            date: CountdownManager.formatDate(countdown.date),
                            typeShort: countdown.type !== 'once' ? CountdownManager.formatTypeShort(countdown.type) : '',
                            daysText: CountdownManager.formatDays(days),
                            notes: countdown.notes,
                            participants: countdown.participants
                        };
                        if (window.showShareCountdownImageModal) {
                            window.showShareCountdownImageModal(data);
                        } else {
                            alert('Error');
                        }
                    };
                    // Text share
                    modal.querySelector('#countdown-text-share-btn').onclick = () => {
                        modal.remove();
                        let shareText = `⏳【 Countdown Day】${countdown.icon} ${countdown.name}\n`;
                        shareText += `-----------------------------\n`;
                        shareText += `📅 Date：${CountdownManager.formatDate(countdown.date)}`;
                        if (countdown.type !== 'once') {
                            shareText += `（${CountdownManager.formatTypeShort(countdown.type)}）`;
                        }
                        shareText += `\n`;
                        const days = CountdownManager.calculateDays(countdown);
                        shareText += `🕒 Remaining：${CountdownManager.formatDays(days)}\n`;
                        if (countdown.notes) {
                            shareText += `📝 Remark：${countdown.notes}\n`;
                        }
                        if (countdown.participants) {
                            shareText += `👥 Participants：${countdown.participants}\n`;
                        }
                        shareText += `-----------------------------\n`;
                        shareText += `🎉 From Treanly (Desktop Version)`;
                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(shareText).then(() => {
                                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                                    UIManager.showNotification(' Countdown Day information has been copied and can be pasted to WeChat /QQ, etc.', 3000);
                                }
                            });
                        } else {
                            // 兼容旧浏览器
                            const textarea = document.createElement('textarea');
                            textarea.value = shareText;
                            document.body.appendChild(textarea);
                            textarea.select();
                            try {
                                document.execCommand('copy');
                                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                                    UIManager.showNotification(' Countdown Day information has been copied and can be pasted to WeChat /QQ, etc.', 3000);
                                }
                            } catch (err) {
                                alert('Copy failed, please copy manually');
                            }
                            document.body.removeChild(textarea);
                        }
                    };
                });
            }
        } else {
            // 批量模式下添加复选框Things
            const checkbox = card.querySelector('.batch-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.toggleItemSelection(countdown.id, checkbox);
                });
                
                // 点击卡片任意位置也可以选择/Cancel Select
                card.addEventListener('click', (e) => {
                    // 如果点击的是复选框本身，不处理，让默认的changeThings处理
                    if (e.target === checkbox) return;
                    
                    checkbox.checked = !checkbox.checked;
                    this.toggleItemSelection(countdown.id, checkbox);
                });
            }
        }
        
        return card;
    },

    /**
     * Calculate days until Countdown Day
     * @param {Object} countdown Countdown Day object
     * @returns {number} Days until the event (positive for future, negative for past, 0 for today)
     */
    calculateDays(countdown) {
        // 获取今天的日期并重置时分秒，确保只比较日期部分
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 解析目标日期，确保正确解析格式
        const dateParts = countdown.date.split('-');
        if (dateParts.length !== 3) {
            console.error('Date format error:', countdown.date);
            return 0;
        }
        
        // 创建日期对象 (月份需要减1，因为JSmedium月份是0-11)
        let targetDate = new Date(
            parseInt(dateParts[0]), 
            parseInt(dateParts[1]) - 1, 
            parseInt(dateParts[2])
        );
        
        // 确保日期有效
        if (isNaN(targetDate.getTime())) {
            console.error('Empty effective date:', countdown.date);
            return 0;
        }
        
        if (countdown.type === 'yearly') {
            // 对于Everyyear重复的日期
            const currentYear = today.getFullYear();
            const targetMonth = targetDate.getMonth();
            const targetDay = targetDate.getDate();
            
            // Set为今年的对应日期
            targetDate = new Date(currentYear, targetMonth, targetDay);
            
            // 如果今年的日期已过，计算到明年的天数
            if (targetDate < today) {
                targetDate = new Date(currentYear + 1, targetMonth, targetDay);
            }
        } else if (countdown.type === 'monthly') {
            // 对于Everymonth重复的日期
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const targetDay = targetDate.getDate();
            
            // Set为当前月的对应日期
            targetDate = new Date(currentYear, currentMonth, targetDay);
            
            // 如果当前月的日期已过，计算到下个月的天数
            if (targetDate < today) {
                // 计算下个月的日期
                let nextMonth = currentMonth + 1;
                let nextYear = currentYear;
                
                // 如果下个月超过12月，需要调整到下一年的1月
                if (nextMonth > 11) {
                    nextMonth = 0;
                    nextYear++;
                }
                
                targetDate = new Date(nextYear, nextMonth, targetDay);
            }
        }
        
        // 计算天数差
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    },

    /**
     * Format countdown days display
     * @param {number} days Days
     * @returns {string} Formatted text
     */
    formatDays(days) {
        if (days === 0) {
            return 'Today';
        } else if (days > 0) {
            return `There are still ${days} left`;
        } else {
            return `${Math.abs(days)} days passed`;
        }
    },

    /**
     * Format date display
     * @param {string} dateStr Date string
     * @returns {string} Formatted date
     */
    formatDate(dateStr) {
        try {
            // 解析日期字符串 (格式应该是 YYYY-MM-DD)
            const dateParts = dateStr.split('-');
            if (dateParts.length !== 3) {
                console.warn('Empty effect:', dateStr);
                return dateStr; // 返回原始字符串
            }
            
            // 创建日期对象 (月份需要减1，因为JSmedium月份是0-11)
            const date = new Date(
                parseInt(dateParts[0]), 
                parseInt(dateParts[1]) - 1, 
                parseInt(dateParts[2])
            );
            
            // 检查日期是否有效
            if (isNaN(date.getTime())) {
                console.warn('Empty valid date value:', dateStr);
                return dateStr; // 返回原始字符串
            }
            
            // 使用英语国家常用的日期格式 MM/DD/YYYY
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        } catch (e) {
            console.error('Error parsing date:', e);
            return dateStr; // 发生错误时返回原始字符串
        }
    },

    /**
     * Export all Countdown Day data
     */
    exportCountdowns() {
        const data = StorageManager.getData();
        if (!data.countdowns || data.countdowns.length === 0) {
            alert('No Countdown Day data can be exported');
            return;
        }
        
        // 首先尝试使用TodoListManager的导出模态框
        if (window.TodoListManager && typeof TodoListManager.showExportModal === 'function') {
            TodoListManager.showExportModal('countdown');
            return;
        }
        
        // 检测当前主题
        const isDarkTheme = document.body.classList.contains('dark-theme');
        
        // 根据主题Set颜色
        const bgColor = isDarkTheme ? '#333333' : '#ffffff';
        const textColor = isDarkTheme ? '#e0e0e0' : '#333333';
        const cardBgColor = isDarkTheme ? '#444444' : '#f5f5f5';
        const cardHoverColor = isDarkTheme ? '#555555' : '#e8e8e8';
        const borderColor = isDarkTheme ? '#555555' : '#dddddd';
        const buttonBgColor = isDarkTheme ? '#444444' : '#f0f0f0';
        const buttonHoverColor = isDarkTheme ? '#555555' : '#e0e0e0';
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9999';
        
        // 创建模态框Content
        const content = document.createElement('div');
        content.style.backgroundColor = bgColor;
        content.style.color = textColor;
        content.style.borderRadius = '8px';
        content.style.padding = '20px';
        content.style.width = '400px';
        content.style.maxWidth = '90%';
        content.style.maxHeight = '80%';
        content.style.overflowY = 'auto';
        content.style.boxShadow = isDarkTheme ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.2)';
        
        // 添加Title
        const title = document.createElement('h3');
        title.textContent = 'Export Countdown Day data';
        title.style.margin = '0 0 20px 0';
        title.style.padding = '0 0 10px 0';
        title.style.borderBottom = `1px solid ${borderColor}`;
        title.style.color = textColor;
        content.appendChild(title);
        
        // 添加导出格式选择
        const formatSelector = document.createElement('div');
        formatSelector.style.marginBottom = '20px';
        
        // 添加说明文字
        const formatLabel = document.createElement('p');
        formatLabel.textContent = 'Select the export format：';
        formatLabel.style.marginBottom = '10px';
        formatLabel.style.color = textColor;
        formatSelector.appendChild(formatLabel);
        
        // 添加格式选项
        formats.forEach(format => {
            const option = document.createElement('div');
            option.style.padding = '10px';
            option.style.margin = '5px 0';
            option.style.borderRadius = '4px';
            option.style.cursor = 'pointer';
            option.style.display = 'flex';
            option.style.alignItems = 'center';
            option.style.backgroundColor = cardBgColor;
            option.style.color = textColor;
            option.style.transition = 'background-color 0.2s ease';
            
            option.innerHTML = `
                <span style="margin-right: 10px; font-size: 18px;">${format.icon}</span>
                <span>${format.name}</span>
            `;
            
            option.addEventListener('click', () => {
                // 执行导出
                const filename = ` Countdown Day Data_${new Date().toLocaleDateString().replace(/\//g, '-')}`;
                const theme = isDarkTheme ? 'dark' : 'light';
                this.performCountdownsExport(format.id, filename, theme);
                document.body.removeChild(modal);
            });
            
            option.addEventListener('mouseover', () => {
                option.style.backgroundColor = cardHoverColor;
            });
            
            option.addEventListener('mouseout', () => {
                option.style.backgroundColor = cardBgColor;
            });
            
            formatSelector.appendChild(option);
        });
        
        content.appendChild(formatSelector);
        
        // 添加取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.padding = '8px 16px';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.border = 'none';
        cancelBtn.style.backgroundColor = buttonBgColor;
        cancelBtn.style.color = textColor;
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.marginTop = '10px';
        cancelBtn.style.transition = 'background-color 0.2s ease';
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        cancelBtn.addEventListener('mouseover', () => {
            cancelBtn.style.backgroundColor = buttonHoverColor;
        });
        
        cancelBtn.addEventListener('mouseout', () => {
            cancelBtn.style.backgroundColor = buttonBgColor;
        });
        
        content.appendChild(cancelBtn);
        
        // 添加到页面
        modal.appendChild(content);
        document.body.appendChild(modal);
    },

    /**
     * Perform Countdown Day data export
     * @param {string} format Export format
     * @param {string} filename Filename
     * @param {string} theme Theme
     */
    performCountdownsExport(format, filename, theme) {
        const data = StorageManager.getData();
        if (!data.countdowns || data.countdowns.length === 0) {
            alert('No Countdown Day data can be exported');
            return;
        }
        
        let content = '';
        let mimeType = 'application/json';
        let extension = 'json';
        
        // 准备Export Data
        const exportData = {
            countdowns: data.countdowns,
            exportTime: new Date().toISOString(),
            type: 'countdown_export'
        };
        
        switch (format) {
            case 'json':
                content = JSON.stringify(exportData, null, 2);
                break;
                
            case 'txt':
                content = this.generateTxtExport(data.countdowns, theme);
                mimeType = 'text/plain';
                extension = 'txt';
                break;
                
            case 'markdown':
                content = this.generateMarkdownExport(data.countdowns, theme);
                mimeType = 'text/markdown';
                extension = 'md';
                break;
                
            case 'html':
                content = this.generateHtmlExport(data.countdowns, theme);
                mimeType = 'text/html';
                extension = 'html';
                break;
                
            case 'csv':
                content = this.generateCsvExport(data.countdowns);
                mimeType = 'text/csv';
                extension = 'csv';
                break;
                
            default:
                content = JSON.stringify(exportData, null, 2);
        }
        
        // 确保文件名有正确的扩展名
        if (!filename.toLowerCase().endsWith(`.${extension}`)) {
            filename += `.${extension}`;
        }
        
        // 创建Blob并下载
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    },

    /**
     * Generate text format export
     * @param {Array} countdowns Countdown Day list
     * @param {string} theme Theme
     * @returns {string} Text content
     */
    generateTxtExport(countdowns, theme) {
        // 按天数排序
        countdowns.sort((a, b) => {
            const daysA = this.calculateDays(a);
            const daysB = this.calculateDays(b);
            return daysA - daysB;
        });
        
        // 添加Stats
        const totalCountdowns = countdowns.length;
        const yearlyCountdowns = countdowns.filter(c => c.type === 'yearly').length;
        const onceCountdowns = countdowns.filter(c => c.type === 'once').length;
        const futureCountdowns = countdowns.filter(c => this.calculateDays(c) > 0).length;
        const todayCountdowns = countdowns.filter(c => this.calculateDays(c) === 0).length;
        const pastCountdowns = countdowns.filter(c => this.calculateDays(c) < 0).length;
        
        const separator = '='.repeat(60);
        const subSeparator = '-'.repeat(60);
        
        let content = `${separator}\n`;
        content += `                  Countdown Day/Memorial Day data\n`;
        content += `              Export time: ${new Date().toLocaleString()}\n`;
        content += `${separator}\n\n`;
        
        // 添加Stats
        content += `Stats:\n`;
        content += `${subSeparator}\n`;
        content += `Total anniversary: ${totalCountdowns} \n`;
        content += `Repeat every year: ${yearlyCountdowns} \n`;
        content += `Single Things: ${onceCountdowns} \n`;
        content += `Future Things: ${futureCountdowns} \n`;
        content += `Things today: ${todayCountdowns} \n`;
        content += `It has passed Things: ${pastCountdowns} \n\n`;
        
        // 今天的Things
        if (todayCountdowns > 0) {
            content += `${separator}\n`;
            content += `                     Things Today\n`;
            content += `${separator}\n\n`;
            
            countdowns.filter(c => this.calculateDays(c) === 0).forEach(countdown => {
                content += this._formatCountdownText(countdown);
            });
        }
        
        // 未来的Things
        if (futureCountdowns > 0) {
            content += `${separator}\n`;
            content += `                     Things of the future\n`;
            content += `${separator}\n\n`;
            
            // 即将到来的Things（7天内）
            const comingSoonCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days > 0 && days <= 7;
            });
            
            if (comingSoonCountdowns.length > 0) {
                content += `${subSeparator}\n`;
                content += `Coming soon (within 7 days)\n`;
                content += `${subSeparator}\n\n`;
                
                comingSoonCountdowns.sort((a, b) => this.calculateDays(a) - this.calculateDays(b))
                    .forEach(countdown => {
                        content += this._formatCountdownText(countdown);
                    });
            }
            
            // 本月其他Things
            const thisMonthCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days > 7 && days <= 30;
            });
            
            if (thisMonthCountdowns.length > 0) {
                content += `${subSeparator}\n`;
                content += `Other Things of the Month\n`;
                content += `${subSeparator}\n\n`;
                
                thisMonthCountdowns.sort((a, b) => this.calculateDays(a) - this.calculateDays(b))
                    .forEach(countdown => {
                        content += this._formatCountdownText(countdown);
                    });
            }
            
            // 更远的Things
            const laterCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days > 30;
            });
            
            if (laterCountdowns.length > 0) {
                content += `${subSeparator}\n`;
                content += `Things further afield\n`;
                content += `${subSeparator}\n\n`;
                
                laterCountdowns.sort((a, b) => this.calculateDays(a) - this.calculateDays(b))
                    .forEach(countdown => {
                        content += this._formatCountdownText(countdown);
                    });
            }
        }
        
        // 已过的Things
        if (pastCountdowns > 0) {
            content += `${separator}\n`;
            content += `                     Things that have passed\n`;
            content += `${separator}\n\n`;
            
            // 最近过去的Things（30天内）
            const recentPastCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days < 0 && days >= -30;
            });
            
            if (recentPastCountdowns.length > 0) {
                content += `${subSeparator}\n`;
                content += `Recent Past Things (within 30 days)\n`;
                content += `${subSeparator}\n\n`;
                
                recentPastCountdowns.sort((a, b) => this.calculateDays(b) - this.calculateDays(a))
                    .forEach(countdown => {
                        content += this._formatCountdownText(countdown);
                    });
            }
            
            // Earlier过去的Things
            const earlierPastCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days < -30;
            });
            
            if (earlierPastCountdowns.length > 0) {
                content += `${subSeparator}\n`;
                content += `Things from the Earlier Past\n`;
                content += `${subSeparator}\n\n`;
                
                earlierPastCountdowns.sort((a, b) => this.calculateDays(b) - this.calculateDays(a))
                    .forEach(countdown => {
                        content += this._formatCountdownText(countdown);
                    });
            }
        }
        
        return content;
    },
    
    /**
     * 格式化单个 Countdown Day为文本格式
     * @private
     * @param {Object} countdown  Countdown Day对象
     * @returns {String} 文本Content
     */
    _formatCountdownText(countdown) {
        const days = this.calculateDays(countdown);
        const itemSeparator = '-'.repeat(60);
        
        let content = `${countdown.icon} ${countdown.name}\n\n`;
        
        content += `Date: ${this.formatDate(countdown.date)}\n`;
        content += `Type: ${this.formatType(countdown.type)}\n`;
        
        //  Countdown Day信息
        if (days === 0) {
            content += `Status: Today\n`;
        } else if (days > 0) {
            content += `Countdown:  ${days} day\n`;
        } else {
            content += `Has passed: ${Math.abs(days)} day\n`;
        }
        
        // 添加创建和Update time
        if (countdown.createTime) {
            content += `Created in: ${new Date(countdown.createTime).toLocaleString()}\n`;
        }
        
        if (countdown.updateTime && (!countdown.createTime || countdown.updateTime !== countdown.createTime)) {
            content += `Last updated: ${new Date(countdown.updateTime).toLocaleString()}\n`;
        }
        
        // 添加备注
        if (countdown.notes) {
            content += `Tags: ${countdown.notes}\n`;
        }
        
        content += `\n${itemSeparator}\n\n`;
        return content;
    },

    /**
     * Generate Markdown format export
     * @param {Array} countdowns Countdown Day list
     * @param {string} theme Theme
     * @returns {string} Markdown content
     */
    generateMarkdownExport(countdowns, theme) {
        // 按天数排序
        countdowns.sort((a, b) => {
            const daysA = this.calculateDays(a);
            const daysB = this.calculateDays(b);
            return daysA - daysB;
        });
        
        // 添加Stats
        const totalCountdowns = countdowns.length;
        const yearlyCountdowns = countdowns.filter(c => c.type === 'yearly').length;
        const monthlyCountdowns = countdowns.filter(c => c.type === 'monthly').length;
        const onceCountdowns = countdowns.filter(c => c.type === 'once').length;
        const futureCountdowns = countdowns.filter(c => this.calculateDays(c) > 0).length;
        const todayCountdowns = countdowns.filter(c => this.calculateDays(c) === 0).length;
        const pastCountdowns = countdowns.filter(c => this.calculateDays(c) < 0).length;
        
        let content = `#  Countdown Day/Anniversary Day Data\n\n`;
        content += `> Export time: ${new Date().toLocaleString()}\n\n`;
        
        content += `## 📊 Stats\n\n`;
        content += `- Total anniversary: **${totalCountdowns}** \n`;
        content += `- Repeat annually: **${yearlyCountdowns}** \n`;
        content += `- Repeat annually: **${monthlyCountdowns}** \n`;
        content += `- Single Things: **${onceCountdowns}** \n`;
        content += `- Future Things: **${futureCountdowns}** \n`;
        content += `- Things today: **${todayCountdowns}** \n`;
        content += `- Past Things: **${pastCountdowns}** \n\n`;
        
        content += `---\n\n`;
        
        // 今天的Things
        if (todayCountdowns > 0) {
            content += `## 🎉 Things Today\n\n`;
            countdowns.filter(c => this.calculateDays(c) === 0).forEach(countdown => {
                content += this._formatCountdownMarkdown(countdown);
            });
        }
        
        // 未来的Things，按天数排序
        if (futureCountdowns > 0) {
            content += `## ⏳ Things of the future\n\n`;
            
            // 即将到来的Things（7天内）
            const comingSoonCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days > 0 && days <= 7;
            });
            
            if (comingSoonCountdowns.length > 0) {
                content += `### 📅 Coming soon (within 7 days)\n\n`;
                comingSoonCountdowns.sort((a, b) => this.calculateDays(a) - this.calculateDays(b))
                    .forEach(countdown => {
                        content += this._formatCountdownMarkdown(countdown);
                    });
            }
            
            // 本月其他Things
            const thisMonthCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days > 7 && days <= 30;
            });
            
            if (thisMonthCountdowns.length > 0) {
                content += `### 📅 Other Things of the Month\n\n`;
                thisMonthCountdowns.sort((a, b) => this.calculateDays(a) - this.calculateDays(b))
                    .forEach(countdown => {
                        content += this._formatCountdownMarkdown(countdown);
                    });
            }
            
            // 更远的Things
            const laterCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days > 30;
            });
            
            if (laterCountdowns.length > 0) {
                content += `### 📅 Things Further Away\n\n`;
                laterCountdowns.sort((a, b) => this.calculateDays(a) - this.calculateDays(b))
                    .forEach(countdown => {
                        content += this._formatCountdownMarkdown(countdown);
                    });
            }
        }
        
        // 已过的Things
        if (pastCountdowns > 0) {
            content += `## 📚 Past Things\n\n`;
            
            // 最近过去的Things（30天内）
            const recentPastCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days < 0 && days >= -30;
            });
            
            if (recentPastCountdowns.length > 0) {
                content += `### 📅 Recent Past Things (within 30 days)\n\n`;
                recentPastCountdowns.sort((a, b) => this.calculateDays(b) - this.calculateDays(a))
                    .forEach(countdown => {
                        content += this._formatCountdownMarkdown(countdown);
                    });
            }
            
            // Earlier过去的Things
            const earlierPastCountdowns = countdowns.filter(c => {
                const days = this.calculateDays(c);
                return days < -30;
            });
            
            if (earlierPastCountdowns.length > 0) {
                content += `### 📅 Things from the Earlier Past\n\n`;
                earlierPastCountdowns.sort((a, b) => this.calculateDays(b) - this.calculateDays(a))
                    .forEach(countdown => {
                        content += this._formatCountdownMarkdown(countdown);
                    });
            }
        }
        
        return content;
    },
    
    /**
     * 格式化单个 Countdown Day为Markdown格式
     * @private
     * @param {Object} countdown  Countdown Day对象
     * @returns {String} MarkdownContent
     */
    _formatCountdownMarkdown(countdown) {
        const days = this.calculateDays(countdown);
        let content = `### ${countdown.icon} ${countdown.name}\n\n`;
        
        content += `**日期:** ${this.formatDate(countdown.date)}\n\n`;
        content += `**类型:** ${this.formatType(countdown.type)}\n\n`;
        
        //  Countdown Day信息
        if (days === 0) {
            content += `**状态:** 🎉 **今天** 🎉\n\n`;
        } else if (days > 0) {
            content += `**倒计时:** ⏳ 还有 **${days}** 天\n\n`;
        } else {
            content += `**已过去:** 📆 **${Math.abs(days)}** 天\n\n`;
        }
        
        // 添加创建和Update time
        if (countdown.createTime) {
            content += `**创建于:** ${new Date(countdown.createTime).toLocaleString()}\n\n`;
        }
        
        if (countdown.updateTime && (!countdown.createTime || countdown.updateTime !== countdown.createTime)) {
            content += `**最后更新:** ${new Date(countdown.updateTime).toLocaleString()}\n\n`;
        }
        
        // 添加备注
        if (countdown.notes) {
            content += `**Remark:**\n\n> ${countdown.notes.replace(/\n/g, '\n> ')}\n\n`;
        }
        
        content += `---\n\n`;
        return content;
    },

    /**
     * Generate HTML format export
     * @param {Array} countdowns Countdown Day list
     * @param {string} theme Theme
     * @returns {string} HTML content
     */
    generateHtmlExport(countdowns, theme) {
        // CSS样式根据主题调整
        const isDarkTheme = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const bgColor = isDarkTheme ? '#2c2c2c' : '#ffffff';
        const textColor = isDarkTheme ? '#e0e0e0' : '#333333';
        const cardBgColor = isDarkTheme ? '#3c3c3c' : '#f5f5f5';
        const borderColor = isDarkTheme ? '#555555' : '#dddddd';
        const headingColor = isDarkTheme ? '#ffffff' : '#000000';
        const secondaryTextColor = isDarkTheme ? '#aaaaaa' : '#888888';
        const accentBlue = isDarkTheme ? '#5c9eff' : '#4285f4';
        const accentGreen = isDarkTheme ? '#5cd25c' : '#4CAF50';
        const accentOrange = isDarkTheme ? '#ffb74d' : '#FF9800';
        const accentGrey = isDarkTheme ? '#bbbbbb' : '#9E9E9E';
        const boxShadow = isDarkTheme ? '0 2px 5px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.1)';
        
        // 按天数排序
        countdowns.sort((a, b) => {
            const daysA = this.calculateDays(a);
            const daysB = this.calculateDays(b);
            return daysA - daysB;
        });
        
        let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Countdown Day</title>
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background-color: ${bgColor};
            color: ${textColor};
            line-height: 1.6;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid ${borderColor};
            padding-bottom: 10px;
            color: ${headingColor};
        }
        .export-time {
            text-align: center;
            font-size: 14px;
            color: ${secondaryTextColor};
            margin-bottom: 40px;
        }
        .countdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .countdown-card {
            background-color: ${cardBgColor};
            border-radius: 10px;
            padding: 20px;
            box-shadow: ${boxShadow};
            position: relative;
            overflow: hidden;
            border: 1px solid ${borderColor};
            transition: transform 0.2s ease;
        }
        .countdown-card:hover {
            transform: translateY(-2px);
        }
        .countdown-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: var(--accent-color, ${accentBlue});
        }
        .countdown-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .countdown-icon {
            font-size: 24px;
            margin-right: 10px;
        }
        .countdown-title {
            font-size: 18px;
            font-weight: 600;
            flex: 1;
            color: ${headingColor};
        }
        .countdown-date {
            font-size: 14px;
            color: ${secondaryTextColor};
            margin-bottom: 10px;
        }
        .countdown-type {
            display: inline-block;
            background-color: rgba(66, 133, 244, 0.1);
            color: ${accentBlue};
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
        }
        .countdown-days {
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0;
            padding: 10px;
            text-align: center;
            border-radius: 5px;
            background-color: rgba(66, 133, 244, 0.1);
        }
        .countdown-today {
            background-color: rgba(76, 175, 80, 0.1);
            color: ${accentGreen};
        }
        .countdown-future {
            background-color: rgba(33, 150, 243, 0.1);
            color: ${accentBlue};
        }
        .countdown-past {
            background-color: rgba(158, 158, 158, 0.1);
            color: ${accentGrey};
        }
        .countdown-notes {
            margin-top: 15px;
            font-size: 14px;
            color: ${secondaryTextColor};
            padding-top: 10px;
            border-top: 1px dashed ${borderColor};
        }
        @media (max-width: 768px) {
            .countdown-grid {
                grid-template-columns: 1fr;
            }
            body {
                padding: 10px;
            }
        }
        @media print {
            body {
                background-color: white;
                color: black;
            }
            .countdown-card {
                break-inside: avoid;
                page-break-inside: avoid;
                box-shadow: none;
                border: 1px solid #ddd;
            }
            .countdown-title {
                color: black;
            }
        }
    </style>
</head>
<body>
    <h1> Countdown Day/纪念日数据</h1>
    <div class="export-time">导出time: ${new Date().toLocaleString()}</div>
    
    <div class="countdown-grid">
`;
        
        countdowns.forEach(countdown => {
            const days = this.calculateDays(countdown);
            let statusClass = '';
            let statusText = '';
            
            if (days === 0) {
                statusClass = 'countdown-today';
                statusText = '就是今天';
            } else if (days > 0) {
                statusClass = 'countdown-future';
                statusText = `还有 ${days} 天`;
            } else {
                statusClass = 'countdown-past';
                statusText = `已过 ${Math.abs(days)} 天`;
            }
            
            html += `
        <div class="countdown-card" style="--accent-color: ${countdown.color}">
            <div class="countdown-header">
                <div class="countdown-icon">${countdown.icon}</div>
                <div class="countdown-title">${this.escapeHtml(countdown.name)}</div>
            </div>
            <div class="countdown-date">
                ${this.formatDate(countdown.date)}
                ${countdown.type !== 'once' ? ` (${this.formatTypeShort(countdown.type)})` : ''}
            </div>
            <div class="countdown-days ${statusClass}">
                ${statusText}
            </div>
            ${(countdown.participants && countdown.participants.length) ? `<div class='countdown-participants'><i class='fas fa-users'></i> 参与者：${countdown.participants.join('，')}</div>` : ''}
            ${countdown.notes ? `<div class="countdown-notes">${this.escapeHtml(countdown.notes)}</div>` : ''}
        </div>
`;
        });
        
        html += `
    </div>
</body>
</html>`;
        
        return html;
    },

    /**
     * Generate CSV format export
     * @param {Array} countdowns Countdown Day list
     * @returns {string} CSV content
     */
    generateCsvExport(countdowns) {
        // 按天数排序
        countdowns.sort((a, b) => {
            const daysA = this.calculateDays(a);
            const daysB = this.calculateDays(b);
            return daysA - daysB;
        });
        
        // 定义CSV头部字段
        const headers = [
            '名称',
            '图标',
            '日期',
            '类型',
            '颜色',
            '剩余天数',
            '状态',
            'Create time',
            'Update time',
            'Remark'
        ];
        
        // 生成CSV头部
        let csv = headers.join(',') + '\n';
        
        // 生成每行数据
        countdowns.forEach(countdown => {
            const days = this.calculateDays(countdown);
            
            // 状态文本
            let status = '';
            if (days === 0) {
                status = '就是今天';
            } else if (days > 0) {
                status = `还有${days}天`;
            } else {
                status = `已过${Math.abs(days)}天`;
            }
            
            // 格式化日期
            const formattedDate = countdown.date;
            
            // 格式化类型
            const type = this.formatType(countdown.type);
            
            // 格式化创建和Update time
            const createTime = countdown.createTime ? new Date(countdown.createTime).toLocaleString() : '';
            const updateTime = countdown.updateTime ? new Date(countdown.updateTime).toLocaleString() : '';
            
            // 构建CSV行
            const row = [
                this.escapeCsvField(countdown.name),
                this.escapeCsvField(countdown.icon),
                formattedDate,
                type,
                countdown.color,
                days,
                this.escapeCsvField(status),
                this.escapeCsvField(createTime),
                this.escapeCsvField(updateTime),
                this.escapeCsvField(countdown.notes || '')
            ];
            
            csv += row.join(',') + '\n';
        });
        
        return csv;
    },

    /**
     * HTML escape
     * @param {string} unsafe Unsafe string
     * @returns {string} Escaped string
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
     * CSV field escape
     * @param {string} field Field value
     * @returns {string} Escaped field
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
     * Import Countdown Day data
     * @param {File} file JSON file to import
     */
    importCountdowns(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // 验证Import Data/File格式
                if (!importData.countdowns || !Array.isArray(importData.countdowns) || importData.type !== 'countdown_export') {
                    alert('Empty效的 Countdown Day数据文件');
                    return;
                }
                
                if (confirm(`确定要导入${importData.countdowns.length}个 Countdown Day吗？这将会合并到现有数规划（电脑版）据medium。`)) {
                    const data = StorageManager.getData();
                    
                    if (!data.countdowns) {
                        data.countdowns = [];
                    }
                    
                    // 合并数据，避免重复
                    const existingIds = new Set(data.countdowns.map(item => item.id));
                    
                    importData.countdowns.forEach(item => {
                        if (!existingIds.has(item.id)) {
                            data.countdowns.push(item);
                        }
                    });
                    
                    StorageManager.saveData(data);
                    this.loadCountdowns();
                    
                    alert(' Countdown Day数据导入成功');
                }
            } catch (error) {
                console.error('导入失败:', error);
                alert('导入失败: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    },

    /**
     * Enter batch selection mode
     */
    enterBatchMode() {
        this.batchMode = true;
        this.selectedItems.clear();
        
        // 更新按钮文本和样式
        this.toggleBatchModeBtn.innerHTML = '<i class="fas fa-times"></i>Cancel Select';
        this.toggleBatchModeBtn.classList.add('active');
        
        // 显示Bulk deletion按钮
        this.batchDeleteBtn.style.display = 'inline-flex';
        this.updateBatchDeleteButton();
        
        // 隐藏添加和导出按钮
        if (this.addCountdownBtn) this.addCountdownBtn.style.display = 'none';
        if (this.exportCountdownsBtn) this.exportCountdownsBtn.style.display = 'none';
        
        // 添加Select all按钮
        this.addSelectAllButton();
        
        // 重新加载卡片，显示复选框
        this.loadCountdowns();
    },
    
    /**
     * Exit batch selection mode
     */
    exitBatchMode() {
        this.batchMode = false;
        this.selectedItems.clear();
        
        // 更新按钮文本和样式
        this.toggleBatchModeBtn.innerHTML = '<i class="fas fa-check-square"></i>Bulk selection';
        this.toggleBatchModeBtn.classList.remove('active');
        
        // 隐藏Bulk deletion按钮
        this.batchDeleteBtn.style.display = 'none';
        
        // 移除Select all按钮
        const selectAllBtn = document.getElementById('countdown-select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.remove();
        }
        
        // 恢复添加和导出按钮
        if (this.addCountdownBtn) this.addCountdownBtn.style.display = 'inline-flex';
        if (this.exportCountdownsBtn) this.exportCountdownsBtn.style.display = 'inline-flex';
        
        // 重新加载卡片，隐藏复选框
        this.loadCountdowns();
    },
    
    /**
     * Batch delete selected Countdown Days
     */
    batchDeleteCountdowns() {
        // 防止重复调用
        if (this._isBatchDeleting) {
            return;
        }
        
        this._isBatchDeleting = true;
        
        if (this.selectedItems.size === 0) {
            alert('请-少选择一个 Countdown Day');
            this._isBatchDeleting = false;
            return;
        }
        
        if (!confirm(`确定要删除选medium的 ${this.selectedItems.size} 个 Countdown Day吗？此操作不可恢复。`)) {
            this._isBatchDeleting = false;
            return;
        }
        
        const data = StorageManager.getData();
        data.countdowns = data.countdowns.filter(c => !this.selectedItems.has(c.id));
        
        StorageManager.saveData(data);
        
        // Exit the batch模式并重新加载
        this.exitBatchMode();
        this.loadCountdowns();
        
        // 重置状态
        this._isBatchDeleting = false;
    },
    
    /**
     * Update batch delete button status
     */
    updateBatchDeleteButton() {
        if (this.selectedItems.size > 0) {
            this.batchDeleteBtn.textContent = `删除已选择 (${this.selectedItems.size})`;
            this.batchDeleteBtn.disabled = false;
        } else {
            this.batchDeleteBtn.textContent = 'Bulk deletion';
            this.batchDeleteBtn.disabled = true;
        }
    },
    
    /**
     * Toggle Countdown Day selection status
     * @param {string} id Countdown Day ID
     * @param {HTMLElement} checkbox Checkbox element
     */
    toggleItemSelection(id, checkbox) {
        if (checkbox.checked) {
            this.selectedItems.add(id);
        } else {
            this.selectedItems.delete(id);
        }
        this.updateBatchDeleteButton();
        this.updateSelectAllButton();
    },
    
    /**
     * Update select all button status
     */
    updateSelectAllButton() {
        const selectAllBtn = document.getElementById('countdown-select-all-btn');
        if (!selectAllBtn) return;
        
        const data = StorageManager.getData();
        const countdowns = data.countdowns || [];
        const isAllSelected = this.selectedItems.size === countdowns.length;
        
        if (isAllSelected) {
            selectAllBtn.innerHTML = '<i class="fas fa-times"></i>取消Select all';
        } else {
            selectAllBtn.innerHTML = '<i class="fas fa-check-double"></i>Select all';
        }
    },

    showImportModal() {
        if (this.importModal) {
            this.importModal.style.display = 'block';
            this.importText.value = '';
        } else {
            console.error('导入模态框元素未找到');
        }
    },

    hideImportModal() {
        if (this.importModal) {
            this.importModal.style.display = 'none';
            this.importText.value = '';
        }
    },

    importFromText() {
        const text = this.importText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要导入的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const countdowns = [];
        const errors = [];
        const duplicates = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，-少需要纪念日名称和日期`);
                return;
            }

            try {
                const name = parts[0];
                const date = new Date(parts[1]);
                
                // 验证日期格式
                if (isNaN(date.getTime())) {
                    throw new Error('Date format empty effect');
                }
                
                const formattedDate = date.toISOString().split('T')[0]; // 格式化为YYYY-MM-DD
                const type = parts[2] || 'once';
                const icon = parts[3] || '📅';
                const color = parts[4] || '#4285f4';
                const notes = parts[5] || '';

                // 验证类型
                if (!['once', 'monthly', 'yearly'].includes(type)) {
                    throw new Error('类型必须是"once"、"monthly"或"yearly"');
                }

                countdowns.push({
                    id: 'countdown_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name,
                    date: formattedDate,
                    type,
                    icon,
                    color,
                    notes,
                    createTime: new Date().toISOString()
                });
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`导入出错：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有 Countdown Day
        try {
            const data = StorageManager.getData();
            
            if (!data.countdowns) {
                data.countdowns = [];
            }
            
            // 检查与现有数规划（电脑版）据的重复项
            const existingCountdowns = data.countdowns;
            const newCountdowns = [];
            
            countdowns.forEach((countdown, index) => {
                const isDuplicate = existingCountdowns.some(existing => {
                    return existing.name === countdown.name && 
                           existing.date === countdown.date && 
                           existing.type === countdown.type;
                });
                
                if (isDuplicate) {
                    duplicates.push(`第 ${index + 1} 行: "${countdown.name}" (${countdown.date}) 已存在`);
                } else {
                    newCountdowns.push(countdown);
                }
            });
            
            // 如果有重复项，显示警告但继续导入非重复项
            if (duplicates.length > 0) {
                const duplicateMessage = `发现 ${duplicates.length} 个重复项，已跳过：\n${duplicates.join('\n')}`;
                if (newCountdowns.length > 0) {
                    UIManager.showNotification(`${duplicateMessage}\n\n成功导入 ${newCountdowns.length} 个新 Countdown Day`, 'warning');
                } else {
                    UIManager.showNotification(`${duplicateMessage}\n\n没有新的 Countdown Day被导入`, 'warning');
                    return;
                }
            }
            
            // 合并数据
            data.countdowns = [...existingCountdowns, ...newCountdowns];
            
            // 保存到存储
            StorageManager.saveData(data);
            
            // Close模态框
            this.hideImportModal();
            
            // 刷新列表
            this.loadCountdowns();
            
            // 移除预览刷新调用
            // if (window.TaskManager && typeof TaskManager.reloadPreviews === 'function') {
            //     TaskManager.reloadPreviews();
            // }
            
            if (duplicates.length === 0) {
                UIManager.showNotification(`成功导入 ${countdowns.length} 个 Countdown Day`, 'success');
            }
        } catch (error) {
            UIManager.showNotification(`保存 Countdown Day时出错：${error.message}`, 'error');
        }
    },

    /**
     * Show edit modal
     */
    showEditModal() {
        const data = StorageManager.getData();
        const countdowns = data.countdowns || [];
        
        // 将 Countdown Day数据转换为文本格式
        const textContent = countdowns.map(countdown => {
            return `${countdown.name} | ${countdown.date} | ${countdown.type} | ${countdown.icon} | ${countdown.color} | ${countdown.notes || ''}`;
        }).join('\n');
        
        // 填充文本框
        document.getElementById('countdown-edit-text').value = textContent;
        
        // 显示模态框
        document.getElementById('countdown-edit-modal').style.display = 'flex';
    },

    /**
     * Hide edit modal
     */
    hideEditModal() {
        document.getElementById('countdown-edit-modal').style.display = 'none';
    },

    /**
     * Save edit changes
     */
    saveEditChanges() {
        const text = document.getElementById('countdown-edit-text').value.trim();
        if (!text) {
            UIManager.showNotification('请输入要保存的Content', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const countdowns = [];
        const errors = [];
        const duplicates = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，-少需要纪念日名称和日期`);
                return;
            }

            try {
                const name = parts[0];
                const date = new Date(parts[1]);
                
                // 验证日期格式
                if (isNaN(date.getTime())) {
                    throw new Error('Date format empty effect');
                }
                
                const formattedDate = date.toISOString().split('T')[0]; // 格式化为YYYY-MM-DD
                const type = parts[2] || 'once';
                const icon = parts[3] || '📅';
                const color = parts[4] || '#4285f4';
                const notes = parts[5] || '';

                // 验证类型
                if (!['once', 'monthly', 'yearly'].includes(type)) {
                    throw new Error('类型必须是"once"、"monthly"或"yearly"');
                }

                countdowns.push({
                    id: 'countdown_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name,
                    date: formattedDate,
                    type,
                    icon,
                    color,
                    notes,
                    createTime: new Date().toISOString()
                });
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(errors.join('\n'), 'error');
            return;
        }

        // 检查重复项
        const seen = new Set();
        const uniqueCountdowns = [];
        
        countdowns.forEach((countdown, index) => {
            const key = `${countdown.name}|${countdown.date}|${countdown.type}`;
            if (seen.has(key)) {
                duplicates.push(`第 ${index + 1} 行: "${countdown.name}" (${countdown.date}) 与前面的条目重复`);
            } else {
                seen.add(key);
                uniqueCountdowns.push(countdown);
            }
        });

        if (duplicates.length > 0) {
            const duplicateMessage = `发现 ${duplicates.length} 个重复项：\n${duplicates.join('\n')}`;
            UIManager.showNotification(`${duplicateMessage}\n\n请删除重复项后重新保存`, 'error');
            return;
        }

        // 保存更改
        const data = StorageManager.getData();
        data.countdowns = uniqueCountdowns;
        StorageManager.saveData(data);

        // 刷新显示
        this.loadCountdowns();
        this.hideEditModal();
        UIManager.showNotification(' Countdown Day已更新', 'success');
    },

    /**
     * Add select all button
     */
    addSelectAllButton() {
        // 检查是否已存在Select all按钮
        if (document.getElementById('countdown-select-all-btn')) {
            return;
        }
        
        const selectAllBtn = document.createElement('button');
        selectAllBtn.id = 'countdown-select-all-btn';
        selectAllBtn.className = 'select-btn';
        selectAllBtn.innerHTML = '<i class="fas fa-check-double"></i>Select all';
        selectAllBtn.style.marginRight = '10px';
        
        selectAllBtn.addEventListener('click', () => this.selectAllCountdowns());
        
        // 将Select all按钮插入到Bulk deletion按钮之前
        const viewControls = document.querySelector('#countdown .view-controls');
        if (viewControls) {
            viewControls.insertBefore(selectAllBtn, this.batchDeleteBtn);
        }
    },
    
    /**
     * Select all所有 Countdown Day
     */
    selectAllCountdowns() {
        const data = StorageManager.getData();
        const countdowns = data.countdowns || [];
        const selectAllBtn = document.getElementById('countdown-select-all-btn');
        
        // 检查当前是否已Select all
        const isAllSelected = this.selectedItems.size === countdowns.length;
        
        if (isAllSelected) {
            // 如果已Select all，则取消Select all
            this.deselectAllCountdowns();
        } else {
            // 如果未Select all，则Select all
            // 清空当前选择
            this.selectedItems.clear();
            
            // 选择所有 Countdown Day
            countdowns.forEach(countdown => {
                this.selectedItems.add(countdown.id);
            });
            
            // 更新所有复选框状态
            const checkboxes = document.querySelectorAll('.batch-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
            
            // 更新Bulk deletion按钮
            this.updateBatchDeleteButton();
            
            // 更新Select all按钮文本
            if (selectAllBtn) {
                selectAllBtn.innerHTML = '<i class="fas fa-times"></i>取消Select all';
            }
        }
    },
    
    /**
     * 取消Select all
     */
    deselectAllCountdowns() {
        // 清空选择
        this.selectedItems.clear();
        
        // 取消所有复选框
        const checkboxes = document.querySelectorAll('.batch-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // 更新Bulk deletion按钮
        this.updateBatchDeleteButton();
        
        // 更新Select all按钮文本
        const selectAllBtn = document.getElementById('countdown-select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.innerHTML = '<i class="fas fa-check-double"></i>Select all';
        }
    },

    /**
     * 格式化 Countdown Day类型显示
     * @param {string} type 类型
     * @returns {string} 格式化后的类型文本
     */
    formatType(type) {
        switch (type) {
            case 'once':
                return '单times';
            case 'monthly':
                return 'Everymonth重复';
            case 'yearly':
                return 'Everyyear重复';
            default:
                return '单times';
        }
    },

    /**
     * 格式化 Countdown Day类型显示（简短版本）
     * @param {string} type 类型
     * @returns {string} 格式化后的类型文本
     */
    formatTypeShort(type) {
        switch (type) {
            case 'once':
                return '单times';
            case 'monthly':
                return 'Everymonth';
            case 'yearly':
                return 'Everyyear';
            default:
                return '单times';
        }
    }
};

// 更新UI管理器，添加 Countdown Day视图切换功能
if (UIManager) {
    const originalSwitchView = UIManager.switchView;
    
    if (originalSwitchView && typeof originalSwitchView === 'function') {
        UIManager.switchView = function(viewName) {
            if (viewName === 'countdown') {
                // 切换视图之前先隐藏所有视图
                document.querySelectorAll('.view-section').forEach(view => {
                    view.classList.remove('active');
                });
                
                // 显示 Countdown Day视图
                const countdownView = document.getElementById('countdown');
                if (countdownView) {
                    countdownView.classList.add('active');
                }
                
                // 更新导航按钮状态
                document.querySelectorAll('.nav-item').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                const navButton = document.getElementById('nav-countdown');
                if (navButton) {
                    navButton.classList.add('active');
                }
                
                return;
            }
            
            // 其他视图使用原始方法处理
            originalSwitchView.call(this, viewName);
        };
    }
} 