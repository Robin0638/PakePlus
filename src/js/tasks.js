/**
 * 任务管理模块
 * 负责处理任务/事件的创建、编辑、删除等操作
 */

const TaskManager = {
    /**
     * 初始化任务管理器
     * @param {Boolean} reloadContent 是否重新加载内容，默认为true
     */
    init(reloadContent = true) {
        // 只在第一次初始化或明确要求时缓存元素和绑定事件
        if (!this.initialized) {
            this.cacheElements();
            this.bindEvents();
            this.initialized = true;
        }
        
        // 只在需要时重新加载内容
        if (reloadContent) {
            this.loadTasks();
            this.loadProjects();
            this.setTodayDate();
        }
        
        // 始终初始化事件监听器，确保动态添加的元素有正确的事件绑定
        this.initEventListeners();
        this.initTagFilter(); // 初始化标签筛选
        this.initDateFilter(); // 初始化日期筛选
        this.initProjectFilter(); // 初始化项目筛选
    },
    
    /**
     * 缓存DOM元素
     */
    cacheElements() {
        // 任务列表和日期
        this.elements = {
            taskList: document.getElementById('task-list'),
            todayDate: document.getElementById('today-date'),
            projectsContainer: document.getElementById('projects-container'),
            
            // 搜索相关
            listSearchInput: document.getElementById('list-search-input'),
            clearSearchBtn: document.getElementById('clear-search-btn'),
            
            // 事件表单
            taskForm: document.getElementById('task-form'),
            eventName: document.getElementById('event-name'),
            eventProject: document.getElementById('event-project'),
            eventStartTime: document.getElementById('event-start-time'),
            eventEndTime: document.getElementById('event-end-time'),
            eventReminder: document.getElementById('event-reminder'),
            eventLocation: document.getElementById('event-location'),
            mapPickerBtn: document.getElementById('map-picker-btn'),
            eventParticipants: document.getElementById('event-participants'),
            eventColor: document.getElementById('event-color'),
            eventNotes: document.getElementById('event-notes'),
            saveEventBtn: document.getElementById('save-event-btn'),
            cancelEventBtn: document.getElementById('cancel-event-btn'),
            
            // 导入
            importFile: document.getElementById('import-file'),
            importBtn: document.getElementById('import-btn'),
            importText: document.getElementById('import-text'),
            importTextBtn: document.getElementById('import-text-btn'),
            
            // 详情模态框
            eventDetailsModal: document.getElementById('event-details-modal'),
            editEventBtn: document.getElementById('edit-event-btn'),
            deleteEventBtn: document.getElementById('delete-event-btn'),
            
            // 专注任务选择器
            focusTask: document.getElementById('focus-task'),
            
            // 新添加的标签输入框
            eventTags: document.getElementById('event-tags'),
            
            // 重复选项
            eventRepeat: document.getElementById('event-repeat'),
            eventRepeatEnd: document.getElementById('event-repeat-end'),
            repeatEndDate: document.getElementById('repeat-end-date'),
            repeatCount: document.getElementById('repeat-count'),
            enableRepeatCount: document.getElementById('enable-repeat-count'),
            repeatCountInput: document.getElementById('repeat-count-input'),
            eventRepeatCount: document.getElementById('event-repeat-count'),
            
            // 日期筛选
            startDate: document.getElementById('start-date'),
            endDate: document.getElementById('end-date'),
            clearDateFilterBtn: document.getElementById('clear-date-filter-btn'),
            quickDateButtons: document.querySelectorAll('.quick-date-btn'),
            
            // 折叠功能
            tagFilterToggle: document.getElementById('unified-filter-toggle'),
            dateFilterToggle: document.getElementById('unified-filter-toggle'),
            tagFilterContent: document.getElementById('unified-filter-content'),
            dateFilterContent: document.getElementById('unified-filter-content'),
            tagFilterContainer: document.getElementById('unified-filter-container'),
            dateFilterContainer: document.getElementById('unified-filter-container'),
        };
    },
    
    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 保存事件
        if (this.elements.saveEventBtn) {
            this.elements.saveEventBtn.addEventListener('click', () => {
                this.saveEvent();
            });
        }
        
        // 取消事件
        if (this.elements.cancelEventBtn) {
            this.elements.cancelEventBtn.addEventListener('click', () => {
                this.cancelEvent();
            });
        }
        
        // 地图选择器
        if (this.elements.mapPickerBtn) {
            this.elements.mapPickerBtn.addEventListener('click', () => {
                this.openMapPicker();
            });
        }
        
        // 文本导入
        if (this.elements.importTextBtn) {
            this.elements.importTextBtn.addEventListener('click', () => {
                this.importFromText();
            });
        }
        
        // 编辑事件
        if (this.elements.editEventBtn) {
            this.elements.editEventBtn.addEventListener('click', () => {
                const eventId = this.elements.eventDetailsModal.dataset.eventId;
                this.editEvent(eventId);
            });
        }
        
        // 删除事件
        if (this.elements.deleteEventBtn) {
            this.elements.deleteEventBtn.addEventListener('click', () => {
                const eventId = this.elements.eventDetailsModal.dataset.eventId;
                this.deleteEvent(eventId);
            });
        }
        
        // 批量删除按钮
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        if (batchDeleteBtn) {
            batchDeleteBtn.style.display = 'block'; // 始终显示批量删除按钮
            batchDeleteBtn.addEventListener('click', () => {
                if (batchDeleteBtn.classList.contains('active')) {
                    // 如果按钮处于激活状态，执行删除操作
                    this.batchDeleteTasks();
                } else {
                    // 如果按钮未激活，进入批量选择模式
                    this.showBatchSelectMode();
                    batchDeleteBtn.classList.add('active');
                }
            });
        }

        // 取消批量删除按钮
        const cancelSelectBtn = document.getElementById('cancel-select-btn');
        if (cancelSelectBtn) {
            cancelSelectBtn.addEventListener('click', () => {
                this.hideBatchSelectMode();
            });
        }
        
        // 全选按钮
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllTasks();
            });
        }
        
        // 取消全选按钮
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                this.deselectAllTasks();
            });
        }
        
        // 添加重复选项变化监听
        if (this.elements.eventRepeat) {
            this.elements.eventRepeat.addEventListener('change', () => {
                const repeatType = this.elements.eventRepeat.value;
                const showRepeatOptions = repeatType !== 'none';
                this.elements.repeatEndDate.style.display = showRepeatOptions ? 'block' : 'none';
                this.elements.repeatCount.style.display = showRepeatOptions ? 'block' : 'none';
            });
        }
        
        // 添加重复次数开关监听
        if (this.elements.enableRepeatCount) {
            this.elements.enableRepeatCount.addEventListener('change', () => {
                this.elements.repeatCountInput.style.display = 
                    this.elements.enableRepeatCount.checked ? 'flex' : 'none';
            });
        }
        
        // 搜索功能
        if (this.elements.listSearchInput) {
            this.elements.listSearchInput.addEventListener('input', () => {
                // 显示或隐藏清除按钮
                if (this.elements.listSearchInput.value) {
                    this.elements.clearSearchBtn.style.display = 'flex';
                } else {
                    this.elements.clearSearchBtn.style.display = 'none';
                }
                this.applyTagFilter();
            });
            
            // 添加回车键搜索功能
            this.elements.listSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyTagFilter();
                }
            });
        }
        
        // 清除搜索按钮
        if (this.elements.clearSearchBtn) {
            this.elements.clearSearchBtn.addEventListener('click', () => {
                this.elements.listSearchInput.value = '';
                this.elements.clearSearchBtn.style.display = 'none';
                this.applyTagFilter();
            });
        }
        
        // 折叠功能事件绑定
        this.initFilterCollapse();
    },
    
    /**
     * 设置今天的日期显示
     */
    setTodayDate() {
        if (this.elements.todayDate) {
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            this.elements.todayDate.textContent = `今天 (${today.toLocaleDateString('zh-CN', options)})`;
        }
    },
    
    /**
     * 加载任务列表
     * @param {Boolean} refreshPreviews 是否刷新预览区域，默认为true
     */
    loadTasks(refreshPreviews = true) {
        // 检查任务列表容器是否存在
        if (!this.elements.taskList) {
            console.error('找不到任务列表容器，无法加载任务列表');
            return;
        }
        
        // 检查是否有筛选条件
        const selectedTags = Array.from(document.querySelectorAll('.tag-filter-btn.selected')).map(btn => btn.getAttribute('data-tag'));
        const searchQuery = this.elements.listSearchInput ? this.elements.listSearchInput.value.trim().toLowerCase() : '';
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const hasFilters = selectedTags.length > 0 || searchQuery.length > 0 || startDate || endDate;
        
        // 清空任务列表内容
        this.elements.taskList.innerHTML = '';
        
        // 只有在没有筛选条件且需要刷新预览区域时才显示预览
        if (refreshPreviews && !hasFilters) {
            // 清除所有预览区域
            this.clearPreviews();
        }
        
        // 获取所有事件
        let events = StorageManager.getEvents();
        
        // 按时间分组
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const pastEvents = [];
        const yesterdayEvents = [];
        const todayEvents = [];
        const futureEvents = [];
        
        events.forEach(event => {
            // 检查事件ID是否完整，确保每个事件有唯一标识
            if (!event.id) {
                console.warn('发现没有ID的事件:', event);
                event.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                StorageManager.saveEvent(event);
            }
            
            if (!event.startTime) {
                // 没有开始时间的事件默认为今天
                todayEvents.push(event);
                return;
            }
            
            const eventDate = new Date(event.startTime);
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate.getTime() === now.getTime()) {
                todayEvents.push(event);
            } else if (eventDate.getTime() === yesterday.getTime()) {
                yesterdayEvents.push(event);
            } else if (eventDate < now) {
                pastEvents.push(event);
            } else {
                futureEvents.push(event);
            }
        });
        
        // 按完成状态和开始时间排序
        const sortEvents = (events) => {
            return events.sort((a, b) => {
                // 优先按照完成状态排序（未完成在前）
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                
                // 其次按照开始时间排序（早的在前）
                const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
                const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
                return aTime - bTime;
            });
        };
        
        // 对各组事件应用排序
        const sortedPastEvents = sortEvents(pastEvents);
        const sortedYesterdayEvents = sortEvents(yesterdayEvents);
        const sortedTodayEvents = sortEvents(todayEvents);
        const sortedFutureEvents = sortEvents(futureEvents);
        
        // 创建日期分隔函数
        const createDateSeparator = (title) => {
            const separator = document.createElement('div');
            separator.className = 'date-separator';
            separator.textContent = title;
            return separator;
        };
        
        // 添加今天的事件
        if (sortedTodayEvents.length > 0) {
            // const todayHeader = createDateSeparator('今天的事件');
            // this.elements.taskList.appendChild(todayHeader);
            
            sortedTodayEvents.forEach(event => {
                this.elements.taskList.appendChild(this.createTaskItem(event));
            });
        } else {
            const emptyToday = document.createElement('div');
            emptyToday.className = 'empty-task-message';
            emptyToday.textContent = '今天没有安排的事件';
            this.elements.taskList.appendChild(emptyToday);
        }
        
        // 添加未来的事件
        if (sortedFutureEvents.length > 0) {
            this.elements.taskList.appendChild(createDateSeparator('即将到来'));
            sortedFutureEvents.forEach(event => {
                this.elements.taskList.appendChild(this.createTaskItem(event));
            });
        }
        
        // 添加昨天的事件（默认隐藏）
        if (sortedYesterdayEvents.length > 0) {
            const yesterdayContainer = document.createElement('div');
            yesterdayContainer.className = 'past-events-container collapsed';
            
            const yesterdayHeader = createDateSeparator('昨天');
            yesterdayHeader.style.cursor = 'pointer';
            yesterdayHeader.addEventListener('click', () => {
                yesterdayContainer.classList.toggle('collapsed');
            });
            
            this.elements.taskList.appendChild(yesterdayHeader);
            this.elements.taskList.appendChild(yesterdayContainer);
            
            sortedYesterdayEvents.forEach(event => {
                const taskItem = this.createTaskItem(event);
                taskItem.classList.add('past-task');
                yesterdayContainer.appendChild(taskItem);
            });
        }
        
        // 添加更早的事件（默认隐藏）
        if (sortedPastEvents.length > 0) {
            const pastContainer = document.createElement('div');
            pastContainer.className = 'past-events-container collapsed';
            
            const pastHeader = createDateSeparator('更早');
            pastHeader.style.cursor = 'pointer';
            pastHeader.addEventListener('click', () => {
                pastContainer.classList.toggle('collapsed');
            });
            
            this.elements.taskList.appendChild(pastHeader);
            this.elements.taskList.appendChild(pastContainer);
            
            sortedPastEvents.forEach(event => {
                const taskItem = this.createTaskItem(event);
                taskItem.classList.add('past-task');
                pastContainer.appendChild(taskItem);
            });
        }
        
        // 更新专注模式任务选择器
        this.updateFocusTaskSelect();
        
        // 控制批量删除按钮的显示
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        
        // 计算总事件数
        const totalEvents = events.length;
        
        // 如果没有事件，隐藏所有相关按钮
        if (totalEvents === 0) {
            if (batchDeleteBtn) batchDeleteBtn.style.display = 'none';
            if (selectAllBtn) selectAllBtn.style.display = 'none';
            if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        } else {
            // 如果有事件，显示批量删除按钮（但默认隐藏全选/全不选按钮）
            if (batchDeleteBtn) batchDeleteBtn.style.display = 'block';
            if (selectAllBtn) selectAllBtn.style.display = 'none';
            if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        }
        this.initTagFilter(); // 任务渲染后刷新标签筛选区
        
        // 初始化出行贴士显示状态（确保在没有筛选条件时显示）
        this.updateFilterStatus();
        
        // 通知快速导航更新计数
        if (window.QuickNavManager && typeof QuickNavManager.triggerDataUpdate === 'function') {
            QuickNavManager.triggerDataUpdate();
        }
    },
    
    /**
     * 创建任务列表项
     * @param {Object} task 任务对象
     * @returns {HTMLElement} 任务列表项元素
     */
    createTaskItem(task) {
        // 确保任务有唯一ID
        if (!task.id) {
            console.warn('创建任务项时发现没有ID的任务:', task);
            task.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            StorageManager.saveEvent(task);
        }
        
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        
        // 任务颜色标记
        const taskColor = document.createElement('div');
        taskColor.className = 'task-color';
        taskColor.style.backgroundColor = task.color || '#4285f4';
        
        // 任务复选框
        const taskCheckbox = document.createElement('div');
        taskCheckbox.className = `task-checkbox ${task.completed ? 'checked' : ''}`;
        taskCheckbox.dataset.taskId = task.id; // 添加任务ID到复选框元素
        
        // 保存对TaskManager的引用
        const self = this;
        
        // 绑定复选框点击事件
        taskCheckbox.addEventListener('click', function(e) {
            // 阻止事件冒泡，防止触发任务详情
            e.stopPropagation();
            
            // 防止重复处理同一点击
            if (this.dataset.processing === 'true') return;
            this.dataset.processing = 'true';
            
            // 获取当前任务的精确ID（从数据属性中获取，而不是从闭包中）
            const exactTaskId = this.dataset.taskId || this.closest('.task-item').dataset.id;
            
            // 确保ID存在且有效
            if (!exactTaskId) {
                console.error('无法获取任务ID');
                this.dataset.processing = 'false';
                return;
            }
            
            // 执行状态切换，使用精确ID
            self.toggleTaskCompletion(exactTaskId);
            
            // 重置处理标记
            setTimeout(() => {
                this.dataset.processing = 'false';
            }, 500);
        });
        
        // 批量选择复选框（默认隐藏）
        const batchCheckbox = document.createElement('input');
        batchCheckbox.type = 'checkbox';
        batchCheckbox.className = 'batch-checkbox';
        batchCheckbox.style.display = 'none';
        batchCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
            this.updateBatchDeleteButton();
        });
        
        // 任务内容
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskTitle = document.createElement('div');
        taskTitle.className = 'task-title';
        taskTitle.textContent = task.name;
        
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        
        let infoText = '';
        
        // 显示时间
        if (task.startTime) {
            const startTime = new Date(task.startTime);
            infoText += `${this.formatTime(startTime)} `;
            
            if (task.endTime) {
                const endTime = new Date(task.endTime);
                infoText += `- ${this.formatTime(endTime)} `;
            }
        }
        
        // 显示地点
        if (task.location) {
            infoText += `@ ${task.location} `;
        }
        
        // 显示项目
        if (task.projectId) {
            const project = StorageManager.getProjects().find(p => p.id === task.projectId);
            if (project) {
                const projectSpan = document.createElement('span');
                projectSpan.className = 'task-project';
                projectSpan.textContent = project.name;
                taskInfo.appendChild(projectSpan);
            }
        }
        
        // 添加标签
        if (task.tags && task.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'task-tags';
            
            task.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = `task-tag ${tag}`;
                tagElement.innerHTML = `<i class="fas fa-tag"></i>${tag}`;
                tagsContainer.appendChild(tagElement);
            });
            
            taskInfo.appendChild(tagsContainer);
        }
        
        const infoSpan = document.createElement('span');
        infoSpan.textContent = infoText;
        taskInfo.appendChild(infoSpan);
        
        taskContent.appendChild(taskTitle);
        taskContent.appendChild(taskInfo);
        
        // 点击任务内容查看详情
        taskContent.addEventListener('click', () => {
            // 使用新的详细窗口
            if (window.EventDetailWindow) {
                window.EventDetailWindow.show(task);
            } else {
                // 降级到旧的模态框
            UIManager.openEventDetails(task);
            }
        });
        
        // 任务操作按钮
        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>编辑';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // 检查是否在项目详情窗口中
            const isInProjectDetail = document.querySelector('.project-detail-content');
            
            if (isInProjectDetail) {
                // 在项目详情窗口中：显示编辑提示
                editBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 准备编辑...';
                editBtn.disabled = true;
                
                setTimeout(() => {
                    // 切换到编辑模式
                    this.editEvent(task.id);
                    
                    // 关闭项目详情窗口
                    const modal = document.querySelector('.project-detail-content').closest('.modal');
                    if (modal) {
                        document.body.removeChild(modal);
                    }
                    
                    // 显示友好的提示信息
                    UIManager.showNotification(`正在编辑事件"${task.name}"，编辑完成后可选择查看详情`);
                }, 300);
            } else {
                // 在普通列表中：直接编辑
                this.editEvent(task.id);
            }
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>删除';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteEvent(task.id);
        });
        
        taskActions.appendChild(editBtn);
        taskActions.appendChild(deleteBtn);
        
        // 组装任务项
        taskItem.appendChild(taskColor);
        taskItem.appendChild(batchCheckbox);
        taskItem.appendChild(taskCheckbox);
        taskItem.appendChild(taskContent);
        taskItem.appendChild(taskActions);
        
        return taskItem;
    },
    
    /**
     * 切换任务完成状态
     * @param {String} taskId 任务ID
     */
    toggleTaskCompletion(taskId) {
        // 严格匹配精确ID的任务项，防止选择器匹配到部分ID
        const taskItems = document.querySelectorAll(`.task-item[data-id="${taskId}"]`);
        if (taskItems.length === 0) {
            console.error(`未找到任务项: ${taskId}`);
            return;
        }
        
        // 获取任务对象，确保存在
        const task = StorageManager.getEventById(taskId);
        if (!task) {
            console.error(`任务ID ${taskId} 不存在`);
            return;
        }
        
        // 获取当前任务的完成状态
        const firstTask = taskItems[0];
        const checkbox = firstTask.querySelector('.task-checkbox');
        const isCompleted = checkbox ? checkbox.classList.contains('checked') : false;
        
        // 更新存储中的任务状态（只更新当前任务，不影响其他重复任务）
        const success = StorageManager.markEventCompleted(taskId, !isCompleted);
        if (!success) {
            console.error(`无法更新任务 ${taskId} 的完成状态`);
            return;
        }
        
        // 只更新当前操作的特定任务项的UI状态，不更新同一天其他相同任务
        taskItems.forEach(item => {
            // 确保100%精确匹配当前操作的任务项ID
            if (item.dataset.id === taskId) {
                const itemCheckbox = item.querySelector('.task-checkbox');
                if (itemCheckbox) {
                    // 更新复选框状态
                    if (!isCompleted) {
                        itemCheckbox.classList.add('checked');
                    } else {
                        itemCheckbox.classList.remove('checked');
                    }
                    
                    // 在项目详情视图中添加动画效果
                    const projectDetailModal = item.closest('.project-detail-content');
                    if (projectDetailModal && task.projectId) {
                        const isAutoComplete = localStorage.getItem(`auto-complete-${task.projectId}`) === 'true';
                        
                        if (isAutoComplete && !isCompleted) {
                            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            item.style.opacity = '0.5';
                            item.style.transform = 'translateX(10px)';
                        }
                    }
                }
            }
        });
        
        // 显示通知
        UIManager.showNotification(!isCompleted ? '任务已完成' : '任务已取消完成');
        
        // 刷新项目视图 - 确保不会影响到同一天的其他事件
        this.loadProjects();
        
        // 如果任务关联了项目，刷新可能已打开的项目详情模态框
        if (task.projectId) {
            const projectDetailModal = document.querySelector(`#project-detail-modal-${task.projectId}`);
            if (projectDetailModal) {
                const modalContent = projectDetailModal.querySelector('.project-detail-content');
                
                // 延迟刷新项目详情，让动画效果显示
                setTimeout(() => {
                    if (modalContent) {
                        const project = StorageManager.getProjects().find(p => p.id === task.projectId);
                        if (project) {
                            this.refreshProjectDetails(project, modalContent);
                        }
                    }
                }, 300);
            }
        }
        
        // 刷新日历视图
        if (window.CalendarManager) {
            window.CalendarManager.refreshCalendar();
        }
        
        // 更新专注模式任务选择器
        this.updateFocusTaskSelect();
        
        // 刷新最近任务视图（保持任务完成状态的独立性）
        setTimeout(() => {
            this.loadTasks();
        }, 50);
    },
    
    /**
     * 格式化时间显示
     * @param {Date} date 日期对象
     * @returns {String} 格式化后的时间字符串
     */
    formatTime(date) {
        // 今天的日期只显示时间，其他日期显示日期和时间
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 获取今年的第一天
        const thisYear = new Date(today);
        thisYear.setMonth(0, 1);
        thisYear.setHours(0, 0, 0, 0);
        
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        
        if (dateStart.getTime() === today.getTime()) {
            // 今天
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (dateStart.getTime() === tomorrow.getTime()) {
            // 明天
            return `明天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (dateStart >= thisYear) {
            // 今年的其他日期（不含年份）
            return date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            // 去年或更早的日期（包含年份）
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    },
    
    /**
     * 保存事件
     */
    saveEvent() {
        // 获取表单数据
        const name = this.elements.eventName.value.trim();
        const projectName = this.elements.eventProject.value.trim();
        const startTime = this.elements.eventStartTime.value;
        const endTime = this.elements.eventEndTime.value;
        const reminder = this.elements.eventReminder.checked;
        const location = this.elements.eventLocation.value.trim();
        const participants = this.elements.eventParticipants.value.trim();
        const color = this.elements.eventColor.value;
        const notes = this.elements.eventNotes.value.trim();
        const repeatType = this.elements.eventRepeat.value;
        const repeatEndDate = this.elements.eventRepeatEnd.value;
        const enableRepeatCount = this.elements.enableRepeatCount.checked;
        const repeatCount = enableRepeatCount ? parseInt(this.elements.eventRepeatCount.value) : null;
        
        // 验证必填字段
        if (!name) {
            UIManager.showNotification('请输入事件名称', 'error');
            this.elements.eventName.focus();
            return;
        }
        
        // 验证时间
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (end <= start) {
                UIManager.showNotification('结束时间必须晚于开始时间', 'error');
                this.elements.eventEndTime.focus();
                return;
            }
        }
        
        // 验证重复次数
        if (enableRepeatCount && (repeatCount < 1 || repeatCount > 100)) {
            UIManager.showNotification('重复次数必须在1-100之间', 'error');
            this.elements.eventRepeatCount.focus();
            return;
        }
        
        // 获取标签
        const tags = this.elements.eventTags.value.trim()
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        
        // 创建事件对象
        const event = {
            name,
            startTime: startTime ? new Date(startTime).toISOString() : null,
            endTime: endTime ? new Date(endTime).toISOString() : null,
            reminder,
            location,
            participants: participants.split('、').map(p => p.trim()).filter(p => p),
            color,
            notes,
            completed: false, // 默认未完成，编辑模式下会被覆盖
            completedTime: null, // 默认无完成时间，编辑模式下会被覆盖
            tags,
            repeat: {
                type: repeatType,
                endDate: repeatEndDate ? new Date(repeatEndDate).toISOString() : null,
                count: repeatCount
            }
        };
        
        // 关联项目
        if (projectName) {
            const project = StorageManager.getOrCreateProject(projectName);
            if (project) {
                event.projectId = project.id;
            }
        }
        
        // 检查是否是编辑模式
        if (this.editingEventId) {
            // 获取原事件信息
            const originalEvent = StorageManager.getEvents().find(e => e.id === this.editingEventId);
            
            if (originalEvent) {
                // 保持原事件的完成状态
                event.completed = originalEvent.completed;
                event.completedTime = originalEvent.completedTime;
                
                // 如果是重复事件，删除所有相关的重复事件
                if (originalEvent.isRepeatingEvent && originalEvent.originalEventId) {
                    // 删除所有具有相同originalEventId的事件
                    const allEvents = StorageManager.getEvents();
                    allEvents.forEach(e => {
                        if (e.originalEventId === originalEvent.originalEventId) {
                            StorageManager.deleteEvent(e.id);
                        }
                    });
                } else if (originalEvent.repeat && originalEvent.repeat.type !== 'none') {
                    // 如果是原始重复事件，删除所有相关的重复事件
                    const allEvents = StorageManager.getEvents();
                    allEvents.forEach(e => {
                        if (e.originalEventId === originalEvent.id || e.id === originalEvent.id) {
                            StorageManager.deleteEvent(e.id);
                        }
                    });
                } else {
                    // 普通事件，直接删除
                    StorageManager.deleteEvent(this.editingEventId);
                }
            }
            
            // 设置新事件的ID
            event.id = this.editingEventId;
            const editedEventId = this.editingEventId; // 保存编辑的事件ID
            this.editingEventId = null;
        }
        
        // 保存事件
        let totalEvents = 0;
        if (repeatType === 'none') {
            StorageManager.saveEvent(event);
            totalEvents = 1;
        } else {
            // 生成重复事件
            const events = this.generateRepeatEvents(event);
            events.forEach(e => {
                StorageManager.saveEvent(e);
                totalEvents++;
            });
        }
        
        // 重置表单
        this.resetEventForm();
        
        // 刷新任务列表
        this.loadTasks();
        
        // 刷新项目列表
        this.loadProjects();
        
        // 刷新日历视图
        if (window.CalendarManager) {
            window.CalendarManager.refreshCalendar();
        }
        
        // 显示通知
        if (editedEventId) {
            // 编辑模式：显示成功提示并提供查看详情选项
            UIManager.showNotification(`事件"${event.name}"已成功更新！`, 'success');
            
            // 清理事件详情窗口的取消处理函数
            if (window.EventDetailWindow && window.EventDetailWindow.handleCancelEdit) {
                delete window.EventDetailWindow.handleCancelEdit;
            }
            
            // 延迟显示查看详情选项
            setTimeout(() => {
                // 查找更新后的事件
                const updatedEvent = StorageManager.getEvents().find(e => e.id === editedEventId);
                if (updatedEvent) {
                    // 提供多个选项
                    const choice = confirm('编辑完成！选择操作：\n\n确定 - 查看事件详情\n取消 - 返回任务列表');
                    
                    if (choice) {
                        // 查看事件详情
                        if (window.EventDetailWindow) {
                            window.EventDetailWindow.show(updatedEvent);
                        }
                    } else {
                        // 检查是否需要重新打开项目详情
                        if (updatedEvent.projectId) {
                            const project = StorageManager.getProjects().find(p => p.id === updatedEvent.projectId);
                            if (project) {
                                const reopenProject = confirm(`是否要重新打开项目"${project.name}"的详情窗口？`);
                                if (reopenProject) {
                                    this.showProjectDetails(project);
                                    return;
                                }
                            }
                        }
                        
                        // 切换到最近要做视图
                        UIManager.switchView('recent-tasks');
                    }
                } else {
                    // 切换到最近要做视图
                    UIManager.switchView('recent-tasks');
                }
            }, 500);
        } else {
            // 新建模式：显示成功提示并切换到最近要做视图
            UIManager.showNotification(`成功保存 ${totalEvents} 个事件`, 'success');
            UIManager.switchView('recent-tasks');
        }
    },
    
    /**
     * 生成重复事件
     * @param {Object} event 原始事件
     * @returns {Array} 重复事件数组
     */
    generateRepeatEvents(event) {
        const events = [];
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        const repeatEndDate = event.repeat.endDate ? new Date(event.repeat.endDate) : null;
        
        // 计算时间差（毫秒）
        const duration = endDate.getTime() - startDate.getTime();
        
        // 确保原事件有ID，使用时间戳加随机字符创建基础ID
        const baseId = event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 根据重复类型生成事件
        let currentDate = new Date(startDate);
        let count = 0;
        const maxEvents = event.repeat.count || 100;
        
        while (count < maxEvents) {
            // 检查是否超过结束日期
            if (repeatEndDate && currentDate > repeatEndDate) {
                break;
            }
            
            // 创建新事件，使用一个更明确的ID格式
            const newEvent = {
                ...event,
                id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                startTime: new Date(currentDate).toISOString(),
                endTime: new Date(currentDate.getTime() + duration).toISOString(),
                originalEventId: baseId, // 记录原始事件ID
                repeatIndex: count, // 添加重复索引便于排序和识别
                isRepeatingEvent: true, // 标记为重复事件
                // 确保项目ID保持一致
                projectId: event.projectId,
                // 保持完成状态
                completed: event.completed,
                completedTime: event.completedTime,
                repeat: {
                    ...event.repeat,
                    originalEventId: baseId // 在重复设置中也记录原始事件ID
                }
            };
            
            events.push(newEvent);
            
            // 根据重复类型更新日期
            switch (event.repeat.type) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
            }
            
            count++;
        }
        
        return events;
    },
    
    /**
     * 编辑事件
     * @param {String} eventId 事件ID
     */
    editEvent(eventId) {
        const event = StorageManager.getEvents().find(e => e.id === eventId);
        if (!event) return;
        
        // 设置表单数据
        this.elements.eventName.value = event.name || '';
        
        // 设置项目
        if (event.projectId) {
            const project = StorageManager.getProjects().find(p => p.id === event.projectId);
            if (project) {
                this.elements.eventProject.value = project.name;
            }
        } else {
            this.elements.eventProject.value = '';
        }
        
        // 设置时间
        if (event.startTime) {
            this.elements.eventStartTime.value = this.formatDateForInput(event.startTime);
        } else {
            this.elements.eventStartTime.value = '';
        }
        
        if (event.endTime) {
            this.elements.eventEndTime.value = this.formatDateForInput(event.endTime);
        } else {
            this.elements.eventEndTime.value = '';
        }
        
        // 设置重复选项
        if (event.repeat) {
            this.elements.eventRepeat.value = event.repeat.type || 'none';
            const showRepeatOptions = event.repeat.type !== 'none';
            this.elements.repeatEndDate.style.display = showRepeatOptions ? 'block' : 'none';
            this.elements.repeatCount.style.display = showRepeatOptions ? 'block' : 'none';
            
            if (event.repeat.endDate) {
                this.elements.eventRepeatEnd.value = this.formatDateOnlyForInput(event.repeat.endDate);
            } else {
                this.elements.eventRepeatEnd.value = '';
            }
            
            // 设置重复次数
            if (event.repeat.count) {
                this.elements.enableRepeatCount.checked = true;
                this.elements.repeatCountInput.style.display = 'flex';
                this.elements.eventRepeatCount.value = event.repeat.count;
            } else {
                this.elements.enableRepeatCount.checked = false;
                this.elements.repeatCountInput.style.display = 'none';
                this.elements.eventRepeatCount.value = '1';
            }
        } else {
            this.elements.eventRepeat.value = 'none';
            this.elements.eventRepeatEnd.value = '';
            this.elements.repeatEndDate.style.display = 'none';
            this.elements.repeatCount.style.display = 'none';
            this.elements.enableRepeatCount.checked = false;
            this.elements.repeatCountInput.style.display = 'none';
            this.elements.eventRepeatCount.value = '1';
        }
        
        this.elements.eventReminder.checked = event.reminder || false;
        this.elements.eventLocation.value = event.location || '';
        this.elements.eventParticipants.value = Array.isArray(event.participants) ? 
            event.participants.join('、') : (event.participants || '');
        this.elements.eventColor.value = event.color || '#4285f4';
        this.elements.eventNotes.value = event.notes || '';
        
        // 设置标签
        this.elements.eventTags.value = event.tags ? event.tags.join(', ') : '';
        
        // 设置编辑模式
        this.editingEventId = event.id;
        
        // 切换到新建视图
        UIManager.switchView('create');
        
        // 延迟切换到传统新建标签
        setTimeout(() => {
            if (window.UIManager && window.UIManager.switchCreateTab) {
                window.UIManager.switchCreateTab('traditional-create');
            }
            
            // 显示编辑模式提示
            UIManager.showNotification(`正在编辑事件"${event.name}"，修改完成后点击保存即可`);
        }, 100);
    },
    
    /**
     * 删除事件
     * @param {String} eventId 事件ID
     */
    deleteEvent(eventId) {
        // 获取事件信息
        const event = StorageManager.getEvents().find(e => e.id === eventId);
        if (!event) return;

        // 删除事件
        StorageManager.deleteEvent(eventId);
        
        // 刷新任务列表
        this.loadTasks();
        
        // 刷新项目列表
        this.loadProjects();
        
        // 刷新日历视图
        if (window.CalendarManager) {
            window.CalendarManager.refreshCalendar();
        }
        
        // 关闭详情模态框
        UIManager.closeModal(this.elements.eventDetailsModal);
        
        // 显示通知
        UIManager.showNotification('事件已删除');
    },
    
    /**
     * 重置事件表单
     */
    resetEventForm() {
        if (!this.elements.taskForm) return;
        
        this.elements.taskForm.reset();
        this.editingEventId = null;
        
        // 设置默认颜色
        this.elements.eventColor.value = '#4285f4';
        
        // 重置标签输入框
        this.elements.eventTags.value = '';
    },
    
    /**
     * 打开地图选择器
     */
    openMapPicker() {
        UIManager.showNotification('地图选择功能暂未实现');
        // 地图选择功能将在后续版本实现
    },
    
    /**
     * 导入事件
     */
    importEvents() {
        const file = this.elements.importFile.files[0];
        if (!file) {
            UIManager.showNotification('请选择文件');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            let result;
            
            if (file.name.endsWith('.csv')) {
                result = StorageManager.importEventsFromCSV(content);
            } else if (file.name.endsWith('.ics')) {
                result = StorageManager.importEventsFromICS(content);
            } else {
                UIManager.showNotification('不支持的文件格式');
                return;
            }
            
            if (result.success) {
                // 刷新任务和项目列表
                this.loadTasks();
                this.loadProjects();
                
                // 刷新日历视图
                if (window.CalendarManager) {
                    window.CalendarManager.refreshCalendar();
                }
                
                UIManager.showNotification(`成功导入 ${result.count} 个事件`);
                
                // 重置导入表单
                this.elements.importFile.value = '';
                
                // 切换到最近要做视图
                UIManager.switchView('recent-tasks');
            } else {
                UIManager.showNotification(`导入失败: ${result.error}`);
            }
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.ics')) {
            reader.readAsText(file);
        } else {
            UIManager.showNotification('请选择 CSV 或 ICS 文件');
        }
    },
    
    /**
     * 加载项目列表
     */
    loadProjects() {
        // 检查项目容器是否存在
        if (!this.elements.projectsContainer) {
            console.warn('项目容器不存在，无法加载项目');
            return;
        }
        
        // 清空项目容器
        this.elements.projectsContainer.innerHTML = '';
        
        // 获取项目列表
        const projects = StorageManager.getProjects();
        
        // 如果没有项目，显示空状态
        if (projects.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-projects-message';
            emptyState.innerHTML = `
                <div class="empty-icon">📋</div>
                <h3>您没有要做的项目</h3>
                <p>可以在新建视图中创建一个新项目</p>
                <button class="create-project-btn">创建新项目</button>
            `;
            
            // 添加创建项目按钮的点击事件
            const createBtn = emptyState.querySelector('.create-project-btn');
            createBtn.addEventListener('click', () => {
                UIManager.switchView('create');
            });
            
            this.elements.projectsContainer.appendChild(emptyState);
            return;
        }
        
        projects.forEach(project => {
            const stats = StorageManager.getProjectStats(project.id);
            
            // 获取项目中的所有事件
            const projectEvents = StorageManager.getEvents({ projectId: project.id });
            let lastEventDate = '暂无事件';
            let lastEventEndTime = null;
            let deadlineDate = project.deadline || null;
            let daysLeft = null;
            
            if (projectEvents && projectEvents.length > 0) {
                // 查找最后结束的事件（按结束时间排序）
                const sortedByEndTime = [...projectEvents].sort((a, b) => {
                    // 如果没有结束时间，则使用开始时间
                    const aEndTime = a.endTime || a.startTime;
                    const bEndTime = b.endTime || b.startTime;
                    
                    if (!aEndTime && !bEndTime) return 0;
                    if (!aEndTime) return -1;
                    if (!bEndTime) return 1;
                    
                    return new Date(bEndTime) - new Date(aEndTime);
                });
                
                // 查找最近的事件（按开始时间排序）
                const sortedByStartTime = [...projectEvents].sort((a, b) => {
                    if (!a.startTime && !b.startTime) return 0;
                    if (!a.startTime) return -1;
                    if (!b.startTime) return 1;
                    return new Date(b.startTime) - new Date(a.startTime);
                });
                
                // 使用最近的事件日期显示
                if (sortedByStartTime[0].startTime) {
                    const date = new Date(sortedByStartTime[0].startTime);
                    lastEventDate = date.toLocaleDateString('zh-CN');
                }
                
                // 如果存在结束时间最晚的事件，将其设为项目截止时间
                if (sortedByEndTime[0] && (sortedByEndTime[0].endTime || sortedByEndTime[0].startTime)) {
                    lastEventEndTime = sortedByEndTime[0].endTime || sortedByEndTime[0].startTime;
                    
                    // 如果项目没有设置截止日期，或者选择自动更新截止日期
                    if (!deadlineDate || project.autoUpdateDeadline) {
                        // 将最后事件结束时间设为截止日期
                        deadlineDate = lastEventEndTime;
                        
                        // 更新项目信息
                        if (!project.deadline || project.autoUpdateDeadline) {
                            const updatedProject = {
                                ...project,
                                deadline: lastEventEndTime,
                                autoUpdateDeadline: project.autoUpdateDeadline === undefined ? true : project.autoUpdateDeadline
                            };
                            StorageManager.updateProject(updatedProject);
                        }
                    }
                }
            }
            
            // 计算项目截止日期倒数
            if (deadlineDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const deadline = new Date(deadlineDate);
                deadline.setHours(0, 0, 0, 0);
                
                const timeDiff = deadline.getTime() - today.getTime();
                daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            }
            
            // 创建项目卡片
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.innerHTML = `
                <div class="project-header">
                    <h3>${project.name}</h3>
                </div>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.progress}%"></div>
                    </div>
                    <div class="progress-text">${stats.progress}%</div>
                </div>
                <div class="project-dates">
                    <div class="last-event-date">
                        <i class="fas fa-calendar-check"></i>
                        <span>最近事件: ${lastEventDate}</span>
                    </div>
                    ${deadlineDate ? `
                    <div class="deadline-countdown ${daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'urgent' : ''}">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${daysLeft < 0 ? '已逾期' + Math.abs(daysLeft) + '天' : 
                               daysLeft === 0 ? '今日截止' : 
                               '剩余' + daysLeft + '天'}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="project-stats">
                    <span>总任务: ${stats.total}</span>
                    <span>已完成: ${stats.completed}</span>
                    <span>未完成: ${stats.uncompleted}</span>
                </div>
                <div class="project-buttons">
                    <button class="details-btn">查看详情</button>
                    <button class="delete-btn"><i class="fas fa-trash"></i>删除</button>
                    <button class="share-btn"><i class="fas fa-share-alt"></i>分享</button>
                </div>
            `;
            
            // 添加事件监听器
            const detailsBtn = projectCard.querySelector('.details-btn');
            detailsBtn.addEventListener('click', () => {
                this.showProjectDetails(project);
            });
            
            // 删除按钮
            const deleteBtn = projectCard.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 确认删除
                if (confirm(`确定要删除项目 "${project.name}" 吗？所有关联的事件也将被移除。`)) {
                    // 删除项目及关联事件
                    StorageManager.deleteProject(project.id);
                    // 重新加载项目列表
                    this.loadProjects();
                    // 重新加载任务列表
                    this.loadTasks();
                }
            });
            
            // 分享按钮事件
            const shareBtn = projectCard.querySelector('.share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                    const projectEvents = StorageManager.getEvents({ projectId: project.id });
                    let shareText = `📋【项目】${project.name}\n`;
                    shareText += `📈 进度：${stats.progress}%\n`;
                    shareText += `📝 总任务：${stats.total}   ✅ 已完成：${stats.completed}   ⏳ 未完成：${stats.uncompleted}\n`;
                    if (deadlineDate) {
                        shareText += `⏰ 截止日期：${new Date(deadlineDate).toLocaleDateString('zh-CN')}\n`;
                    }
                    shareText += `-----------------------------\n`;
                    if (projectEvents && projectEvents.length > 0) {
                        projectEvents.forEach((event, idx) => {
                            const status = event.completed ? '✅ 已完成' : '⏳ 未完成';
                            let line = ` ${event.completed ? '✔️' : ''} ${idx + 1}. ${event.name}`;
                            if (event.startTime) {
                                const date = new Date(event.startTime);
                                line += `（${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                                line += ')';
                            }
                            line += `  ${status}`;
                            shareText += line + '\n';
                        });
                    } else {
                        shareText += '（暂无任务）\n';
                    }
                    shareText += `-----------------------------\n`;
                    shareText += `🎉 来自有数`;
                    // 复制到剪贴板
                    const showShareTip = () => {
                        if (window.UIManager && typeof UIManager.showNotification === 'function') {
                            UIManager.showNotification('项目信息已复制，可粘贴到微信/QQ等', 3000);
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
                            notification.textContent = '项目信息已复制，可粘贴到微信/QQ等';
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
            
            // 将项目卡片添加到容器
            this.elements.projectsContainer.appendChild(projectCard);
        });
    },
    
    /**
     * 显示项目详情
     * @param {Object} project 项目对象
     */
    showProjectDetails(project) {
        // 创建项目详情模态框
        const modal = document.createElement('div');
        modal.className = 'modal open';
        modal.id = `project-detail-modal-${project.id}`;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content project-detail-content';
        
        // 标题和关闭按钮
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = `项目: ${project.name}`;
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.className = 'modal-close-btn';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            if (modal.refreshInterval) {
                clearInterval(modal.refreshInterval);
            }
        });
        // 创建操作按钮容器
        const actionButtons = document.createElement('div');
        actionButtons.className = 'modal-action-buttons';
        // 分享按钮
        const shareBtn = document.createElement('button');
        shareBtn.className = 'modal-share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> 分享';
        shareBtn.style.marginLeft = '12px';
        shareBtn.addEventListener('click', () => {
            const stats = StorageManager.getProjectStats(project.id);
            const projectEvents = StorageManager.getEvents({ projectId: project.id });
            let shareText = `📋【项目】${project.name}\n`;
            shareText += `📈 进度：${stats.progress}%\n`;
            shareText += `📝 总任务：${stats.total}   ✅ 已完成：${stats.completed}   ⏳ 未完成：${stats.uncompleted}\n`;
            if (project.deadline) {
                shareText += `⏰ 截止日期：${new Date(project.deadline).toLocaleDateString('zh-CN')}\n`;
            }
            shareText += `-----------------------------\n`;
            if (projectEvents && projectEvents.length > 0) {
                projectEvents.forEach((event, idx) => {
                    const status = event.completed ? '✅ 已完成' : '⏳ 未完成';
                    let line = ` ${event.completed ? '✔️' : ''} ${idx + 1}. ${event.name}`;
                    if (event.startTime) {
                        const date = new Date(event.startTime);
                        line += `（${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                        line += ')';
                    }
                    line += `  ${status}`;
                    shareText += line + '\n';
                });
            } else {
                shareText += '（暂无任务）\n';
            }
            shareText += `-----------------------------\n`;
            shareText += `🎉 来自有数`;
            // 复制到剪贴板
            const showShareTip = () => {
                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                    UIManager.showNotification('项目信息已复制，可粘贴到微信/QQ等', 3000);
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
                    notification.textContent = '项目信息已复制，可粘贴到微信/QQ等';
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
        actionButtons.appendChild(shareBtn);
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(actionButtons);
        modalHeader.appendChild(closeButton);
        
        // 添加到modal
        modalContent.appendChild(modalHeader);
        
        // 创建内容容器，后续会动态填充
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'project-details-container';
        modalContent.appendChild(detailsContainer);
        
        // 首次加载项目详情
        this.loadProjectDetailsContent(project, detailsContainer);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // 绑定自动刷新功能
        const autoRefreshToggle = document.getElementById(`auto-refresh-${project.id}`);
        autoRefreshToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                // 开启自动刷新，每10秒刷新一次
                modal.refreshInterval = setInterval(() => {
                    this.refreshProjectDetails(project, modalContent);
                }, 10000);
                
                // 显示提示
                UIManager.showNotification('已开启自动刷新（10秒间隔）');
            } else {
                // 关闭自动刷新
                if (modal.refreshInterval) {
                    clearInterval(modal.refreshInterval);
                    modal.refreshInterval = null;
                }
                UIManager.showNotification('已关闭自动刷新');
            }
        });
    },
    
    /**
     * 刷新项目详情
     * @param {Object} project 项目对象
     * @param {HTMLElement} modalContent 模态框内容容器
     */
    refreshProjectDetails(project, modalContent) {
        // 获取最新的项目信息
        const updatedProject = StorageManager.getProjects().find(p => p.id === project.id);
        if (!updatedProject) {
            UIManager.showNotification('项目不存在或已被删除', 'error');
            return;
        }
        
        // 获取内容容器
        const detailsContainer = modalContent.querySelector('.project-details-container');
        if (!detailsContainer) return;
        
        // 清空现有内容
        detailsContainer.innerHTML = '';
        
        // 加载最新内容
        this.loadProjectDetailsContent(updatedProject, detailsContainer);
        
        // 显示刷新成功提示（可选）
        const timestamp = document.createElement('div');
        timestamp.className = 'refresh-timestamp';
        timestamp.textContent = `上次刷新: ${new Date().toLocaleTimeString()}`;
        timestamp.style.fontSize = '0.8rem';
        timestamp.style.color = '#888';
        timestamp.style.textAlign = 'right';
        timestamp.style.marginTop = '10px';
        
        // 添加到详情容器底部
        detailsContainer.appendChild(timestamp);
    },
    
    /**
     * 加载项目详情内容
     * @param {Object} project 项目对象
     * @param {HTMLElement} container 内容容器
     */
    loadProjectDetailsContent(project, container) {
        // 获取项目下的所有事件
        const events = StorageManager.getEvents({ projectId: project.id });
        
        // 进度信息
        const stats = StorageManager.getProjectStats(project.id);
        
        const progressInfo = document.createElement('div');
        progressInfo.className = 'project-progress-info';
        progressInfo.innerHTML = `
            <div class="project-stat">总任务数: ${stats.total}</div>
            <div class="project-stat">已完成: ${stats.completed}</div>
            <div class="project-stat">进度: ${stats.progress}%</div>
        `;
        
        // 添加进度条
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = `${stats.progress}%`;
        
        progressBar.appendChild(progressFill);
        progressInfo.appendChild(progressBar);
        
        // 截止日期信息
        if (project.deadline) {
            const deadlineInfo = document.createElement('div');
            deadlineInfo.className = 'project-deadline-info';
            
            const deadline = new Date(project.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            deadline.setHours(0, 0, 0, 0);
            
            const timeDiff = deadline.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            const deadlineStatus = daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'urgent' : 'normal';
            const deadlineText = daysLeft < 0 ? `已逾期${Math.abs(daysLeft)}天` : 
                                daysLeft === 0 ? '今日截止' : 
                                `剩余${daysLeft}天`;
            
            deadlineInfo.innerHTML = `
                <div class="deadline-info ${deadlineStatus}">
                    <i class="fas fa-calendar-alt"></i>
                    <span>截止日期: ${deadline.toLocaleDateString('zh-CN')}</span>
                    <span class="deadline-countdown">${deadlineText}</span>
                </div>
            `;
            
            container.appendChild(deadlineInfo);
        }
        
        container.appendChild(progressInfo);
        
        // 创建完成事件的自动处理开关
        const autoCompleteToggle = document.createElement('div');
        autoCompleteToggle.className = 'auto-completion-toggle';
        autoCompleteToggle.style.display = 'none'; // 隐藏整个切换容器
        
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.id = `auto-complete-${project.id}`;
        toggleInput.className = 'auto-complete-toggle';
        toggleInput.checked = localStorage.getItem(`auto-complete-${project.id}`) === 'true';
        
        const toggleLabel = document.createElement('label');
        toggleLabel.htmlFor = `auto-complete-${project.id}`;
        toggleLabel.textContent = '';
        toggleLabel.style.marginLeft = '8px';
        toggleLabel.style.fontSize = '0.9rem';
        toggleLabel.style.cursor = 'pointer';
        
        autoCompleteToggle.appendChild(toggleInput);
        autoCompleteToggle.appendChild(toggleLabel);
        container.appendChild(autoCompleteToggle);
        
        // 保存自动完成设置
        toggleInput.addEventListener('change', () => {
            localStorage.setItem(`auto-complete-${project.id}`, toggleInput.checked);
            // 立即应用设置
            if (toggleInput.checked) {
                UIManager.showNotification('已开启自动完成处理');
                // 刷新视图以应用设置
                this.refreshProjectDetails(project, toggleInput.closest('.modal-content'));
            } else {
                UIManager.showNotification('已关闭自动完成处理');
            }
        });
        
        // 事件列表
        const eventsList = document.createElement('div');
        eventsList.className = 'project-events-list';
        
        // 按状态分组
        const incompleteEvents = events.filter(e => !e.completed);
        const completedEvents = events.filter(e => e.completed);
        
        // 未完成事件
        if (incompleteEvents.length > 0) {
            const incompleteHeader = document.createElement('h4');
            incompleteHeader.textContent = '未完成事件';
            eventsList.appendChild(incompleteHeader);
            
            incompleteEvents.forEach(event => {
                const taskItem = this.createTaskItem(event);
                
                // 添加任务完成状态变更的事件监听
                const taskCheckbox = taskItem.querySelector('.task-checkbox');
                if (taskCheckbox) {
                    // 确保复选框有任务ID引用
                    taskCheckbox.dataset.taskId = event.id;
                    
                    // 移除现有事件监听，避免重复绑定
                    const newCheckbox = taskCheckbox.cloneNode(true);
                    taskCheckbox.replaceWith(newCheckbox);
                    
                    // 保存对TaskManager的引用
                    const self = this;
                    
                    // 绑定新的事件监听，确保使用精确ID
                    newCheckbox.addEventListener('click', function(e) {
                        // 防止事件冒泡
                        e.stopPropagation();
                        
                        // 阻止重复处理
                        if (this.dataset.processing === 'true') return;
                        this.dataset.processing = 'true';
                        
                        // 获取当前任务项的精确ID（直接从数据属性获取）
                        const exactTaskId = this.dataset.taskId || this.closest('.task-item').dataset.id;
                        
                        // 确保ID存在且有效
                        if (!exactTaskId) {
                            console.error('无法获取任务ID');
                            this.dataset.processing = 'false';
                            return;
                        }
                        
                        // 调用toggleTaskCompletion并传递精确的任务ID
                        self.toggleTaskCompletion(exactTaskId);
                        
                        // 重置处理标记
                        setTimeout(() => {
                            this.dataset.processing = 'false';
                        }, 500);
                    });
                }
                
                eventsList.appendChild(taskItem);
            });
        }
        
        // 已完成事件
        if (completedEvents.length > 0) {
            const completedHeader = document.createElement('h4');
            completedHeader.textContent = '已完成事件';
            eventsList.appendChild(completedHeader);
            
            // 创建折叠按钮
            const collapseBtn = document.createElement('button');
            collapseBtn.className = 'collapse-completed-btn';
            collapseBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            collapseBtn.style.background = 'none';
            collapseBtn.style.border = 'none';
            collapseBtn.style.marginLeft = '10px';
            collapseBtn.style.cursor = 'pointer';
            collapseBtn.title = '显示/隐藏已完成事件';
            
            // 添加到已完成事件标题旁
            completedHeader.appendChild(collapseBtn);
            
            // 创建已完成事件容器
            const completedContainer = document.createElement('div');
            completedContainer.className = 'completed-events-container';
            completedContainer.style.transition = 'height 0.3s ease';
            
            // 根据本地存储的状态决定是否折叠
            const isCollapsed = localStorage.getItem(`collapse-completed-${project.id}`) === 'true';
            if (isCollapsed) {
                completedContainer.style.height = '0';
                completedContainer.style.overflow = 'hidden';
                collapseBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            }
            
            // 切换折叠状态
            collapseBtn.addEventListener('click', () => {
                const isCurrentlyCollapsed = completedContainer.style.height === '0px';
                if (isCurrentlyCollapsed) {
                    completedContainer.style.height = completedContainer.scrollHeight + 'px';
                    collapseBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                    localStorage.setItem(`collapse-completed-${project.id}`, 'false');
                } else {
                    completedContainer.style.height = '0';
                    collapseBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                    localStorage.setItem(`collapse-completed-${project.id}`, 'true');
                }
            });
            
            // 添加已完成事件
            completedEvents.forEach(event => {
                const taskItem = this.createTaskItem(event);
                
                // 添加任务完成状态变更的事件监听
                const taskCheckbox = taskItem.querySelector('.task-checkbox');
                if (taskCheckbox) {
                    // 移除现有事件监听，避免重复绑定
                    const newCheckbox = taskCheckbox.cloneNode(true);
                    taskCheckbox.replaceWith(newCheckbox);
                    const updatedCheckbox = taskItem.querySelector('.task-checkbox');
                    
                    // 保存对TaskManager的引用
                    const self = this;
                    
                    // 绑定新的事件监听，确保使用精确ID
                    updatedCheckbox.addEventListener('click', function(e) {
                        // 防止事件冒泡
                        e.stopPropagation();
                        
                        // 阻止重复处理
                        if (this.dataset.processing === 'true') return;
                        this.dataset.processing = 'true';
                        
                        // 获取当前任务项的精确ID
                        const exactTaskId = this.closest('.task-item').dataset.id;
                        
                        // 确保ID存在且有效
                        if (!exactTaskId) {
                            console.error('无法获取任务ID');
                            this.dataset.processing = 'false';
                            return;
                        }
                        
                        // 调用toggleTaskCompletion并传递精确的任务ID
                        self.toggleTaskCompletion(exactTaskId);
                        
                        // 重置处理标记
                        setTimeout(() => {
                            this.dataset.processing = 'false';
                        }, 500);
                    });
                }
                
                completedContainer.appendChild(taskItem);
            });
            
            eventsList.appendChild(completedContainer);
        }
        
        // 如果没有事件，显示提示信息
        if (events.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-events-message';
            emptyMessage.innerHTML = `
                <div class="empty-icon">📅</div>
                <p>该项目下暂无事件</p>
                <button class="add-event-btn">创建新事件</button>
            `;
            
            // 添加创建事件按钮的点击事件
            const addEventBtn = emptyMessage.querySelector('.add-event-btn');
            addEventBtn.addEventListener('click', () => {
                // 显示加载状态
                const originalText = addEventBtn.textContent;
                addEventBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 准备创建...';
                addEventBtn.disabled = true;
                
                // 延迟执行，给用户视觉反馈
                setTimeout(() => {
                    // 切换到创建视图
                    UIManager.switchView('create');
                    
                    // 关闭模态框
                    const modal = document.querySelector(`#project-detail-modal-${project.id}`);
                    if (modal) {
                        document.body.removeChild(modal);
                    }
                    
                    // 选择项目下拉框
                    const projectSelect = document.getElementById('event-project');
                    if (projectSelect) {
                        projectSelect.value = project.name;
                    }
                    
                    // 显示友好的提示信息
                    UIManager.showNotification(`正在为项目"${project.name}"创建新事件`);
                }, 300);
            });
            
            eventsList.appendChild(emptyMessage);
        }
        
        container.appendChild(eventsList);
    },
    
    /**
     * 更新专注模式任务选择器
     */
    updateFocusTaskSelect() {
        if (!this.elements.focusTask) return;
        
        // 清空选择器
        this.elements.focusTask.innerHTML = '<option value="">选择任务</option>';
        
        // 获取未完成的任务
        const incompleteTasks = StorageManager.getEvents({ completed: false });
        
        // 按时间排序
        incompleteTasks.sort((a, b) => {
            if (!a.startTime && !b.startTime) return 0;
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            
            return new Date(a.startTime) - new Date(b.startTime);
        });
        
        // 添加选项
        incompleteTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            
            let optionText = task.name;
            
            // 添加时间信息
            if (task.startTime) {
                const startDate = new Date(task.startTime);
                optionText += ` (${this.formatTime(startDate)})`;
            }
            
            option.textContent = optionText;
            this.elements.focusTask.appendChild(option);
        });
    },
    
    /**
     * 从文本导入事件
     */
    importFromText() {
        const text = this.elements.importText.value.trim();
        if (!text) {
            UIManager.showNotification('请输入要导入的文本', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const events = [];
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`第 ${index + 1} 行: 格式错误，至少需要事件名称和开始时间`);
                return;
            }

            try {
                // 解析日期时间
                const parseDateTime = (dateTimeStr) => {
                    if (!dateTimeStr) return null;
                    const date = new Date(dateTimeStr);
                    if (isNaN(date.getTime())) {
                        throw new Error('日期时间格式无效');
                    }
                    return date.toISOString();
                };

                const event = {
                    name: parts[0],
                    startTime: parseDateTime(parts[1]),
                    endTime: parseDateTime(parts[2]),
                    location: parts[3] || '',
                    participants: parts[4] ? parts[4].split('、').map(p => p.trim()).filter(p => p) : [],
                    tags: parts[5] ? parts[5].split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                    color: '#4285f4',
                    completed: false,
                    id: 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                };

                // 处理项目字段
                if (parts[6]) {
                    const project = StorageManager.getOrCreateProject(parts[6]);
                    if (project) {
                        event.projectId = project.id;
                    }
                }

                // 处理重复设置
                if (parts[7]) {
                    const repeatSettings = parts[7].split(',').map(s => s.trim());
                    if (repeatSettings.length > 0) {
                        event.repeat = {
                            type: 'none',
                            endDate: null,
                            count: null
                        };

                        // 解析重复类型
                        const repeatType = repeatSettings[0].toLowerCase();
                        if (['daily', 'weekly', 'monthly', 'yearly'].includes(repeatType)) {
                            event.repeat.type = repeatType;
                        }

                        // 解析结束日期
                        if (repeatSettings[1]) {
                            const endDate = new Date(repeatSettings[1]);
                            if (!isNaN(endDate.getTime())) {
                                event.repeat.endDate = endDate.toISOString();
                            }
                        }

                        // 解析重复次数
                        if (repeatSettings[2]) {
                            const count = parseInt(repeatSettings[2]);
                            if (!isNaN(count) && count > 0 && count <= 100) {
                                event.repeat.count = count;
                            }
                        }
                    }
                }

                // 验证必填字段
                if (!event.name) {
                    throw new Error('事件名称不能为空');
                }
                if (!event.startTime) {
                    throw new Error('开始时间不能为空');
                }

                // 验证时间
                if (event.startTime && event.endTime) {
                    const start = new Date(event.startTime);
                    const end = new Date(event.endTime);
                    if (end <= start) {
                        throw new Error('结束时间必须晚于开始时间');
                    }
                }

                // 验证重复设置
                if (event.repeat && event.repeat.type !== 'none') {
                    if (event.repeat.endDate) {
                        const start = new Date(event.startTime);
                        const end = new Date(event.repeat.endDate);
                        if (end <= start) {
                            throw new Error('重复结束日期必须晚于开始时间');
                        }
                    }
                }

                events.push(event);
            } catch (e) {
                errors.push(`第 ${index + 1} 行: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`导入出错：\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有事件
        try {
            let totalEvents = 0;
            events.forEach(event => {
                if (event.repeat && event.repeat.type !== 'none') {
                    // 生成重复事件
                    const repeatEvents = this.generateRepeatEvents(event);
                    repeatEvents.forEach(e => {
                        // 为每个重复事件生成新的唯一ID，但保持相同的项目ID
                        e.id = 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        // 确保项目ID保持一致
                        if (event.projectId) {
                            e.projectId = event.projectId;
                        }
                        StorageManager.saveEvent(e);
                        totalEvents++;
                    });
                } else {
                    StorageManager.saveEvent(event);
                    totalEvents++;
                }
            });

            // 清空输入框
            this.elements.importText.value = '';

            // 刷新任务列表
            this.loadTasks();
            
            // 刷新项目列表
            this.loadProjects();
            
            // 刷新日历视图
            if (window.CalendarManager) {
                window.CalendarManager.refreshCalendar();
            }

            UIManager.showNotification(`成功导入 ${totalEvents} 个事件`, 'success');
            
            // 切换到最近要做视图
            UIManager.switchView('recent-tasks');
        } catch (error) {
            UIManager.showNotification(`保存事件时出错：${error.message}`, 'error');
        }
    },
    
    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // ... existing code ...
        
        // 添加重复选项变化监听
        if (this.elements.eventRepeat) {
            this.elements.eventRepeat.addEventListener('change', () => {
                const repeatType = this.elements.eventRepeat.value;
                const showRepeatOptions = repeatType !== 'none';
                this.elements.repeatEndDate.style.display = showRepeatOptions ? 'block' : 'none';
                this.elements.repeatCount.style.display = showRepeatOptions ? 'block' : 'none';
            });
        }
        
        // 添加重复次数开关监听
        if (this.elements.enableRepeatCount) {
            this.elements.enableRepeatCount.addEventListener('change', () => {
                this.elements.repeatCountInput.style.display = 
                    this.elements.enableRepeatCount.checked ? 'flex' : 'none';
            });
        }
    },

    /**
     * 更新批量删除按钮状态
     */
    updateBatchDeleteButton() {
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        if (!batchDeleteBtn || !selectAllBtn || !deselectAllBtn) return;
        
        const checkedBoxes = document.querySelectorAll('.batch-checkbox:checked');
        const allCheckboxes = document.querySelectorAll('.batch-checkbox');
        
        // 更新全选/全不选按钮状态
        selectAllBtn.style.display = checkedBoxes.length < allCheckboxes.length ? 'block' : 'none';
        deselectAllBtn.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
        
        // 更新批量删除按钮状态
        batchDeleteBtn.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
    },
    
    /**
     * 显示批量选择模式
     */
    showBatchSelectMode() {
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        const cancelSelectBtn = document.getElementById('cancel-select-btn');
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        
        // 显示所有复选框
        batchCheckboxes.forEach(checkbox => {
            checkbox.style.display = 'block';
        });
        
        // 显示全选/全不选/取消选择按钮
        if (selectAllBtn) selectAllBtn.style.display = 'block';
        if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        if (cancelSelectBtn) cancelSelectBtn.style.display = 'block';
        
        // 更新批量删除按钮状态
        this.updateBatchDeleteButton();
    },
    
    /**
     * 隐藏批量选择模式
     */
    hideBatchSelectMode() {
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        const cancelSelectBtn = document.getElementById('cancel-select-btn');
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        
        // 隐藏所有复选框
        batchCheckboxes.forEach(checkbox => {
            checkbox.style.display = 'none';
            checkbox.checked = false;
        });
        
        // 隐藏全选/全不选/取消选择按钮
        if (selectAllBtn) selectAllBtn.style.display = 'none';
        if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        if (cancelSelectBtn) cancelSelectBtn.style.display = 'none';
        
        // 重置批量删除按钮状态
        if (batchDeleteBtn) {
            batchDeleteBtn.classList.remove('active');
            batchDeleteBtn.style.display = 'block';
        }
    },
    
    /**
     * 全选所有任务
     */
    selectAllTasks() {
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        batchCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updateBatchDeleteButton();
    },
    
    /**
     * 取消全选
     */
    deselectAllTasks() {
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        batchCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateBatchDeleteButton();
    },
    
    
    /**
     * 批量删除选中的任务
     */
    batchDeleteTasks() {
        const checkedBoxes = document.querySelectorAll('.batch-checkbox:checked');
        if (checkedBoxes.length === 0) return;
        
        checkedBoxes.forEach(checkbox => {
            const taskItem = checkbox.closest('.task-item');
            const taskId = taskItem.dataset.id;
            this.deleteEvent(taskId);
        });
        
        // 隐藏批量选择模式
        this.hideBatchSelectMode();
    },
    
    /**
     * 搜索任务
     * @param {String} query 搜索关键词
     */
    searchTasks(query) {
        query = query.toLowerCase().trim();
        
        // 如果搜索框为空，显示所有任务
        if (!query) {
            this.loadTasks();
            return;
        }
        
        // 获取所有事件
        const events = StorageManager.getEvents();
        
        // 筛选匹配的事件
        const matchedEvents = events.filter(event => {
            // 匹配事件名称
            if (event.name && event.name.toLowerCase().includes(query)) {
                return true;
            }
            
            // 匹配事件描述
            if (event.description && event.description.toLowerCase().includes(query)) {
                return true;
            }
            
            // 匹配事件地点
            if (event.location && event.location.toLowerCase().includes(query)) {
                return true;
            }
            
            // 匹配事件标签
            if (event.tags && Array.isArray(event.tags)) {
                return event.tags.some(tag => tag.toLowerCase().includes(query));
            }
            
            return false;
        });
        
        // 清空任务列表
        if (this.elements.taskList) {
            this.elements.taskList.innerHTML = '';
        }
        
        // 如果没有找到匹配的事件，显示提示
        if (matchedEvents.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-task-message';
            emptyMessage.textContent = `未找到匹配 "${query}" 的事件`;
            this.elements.taskList.appendChild(emptyMessage);
            return;
        }
        
        // 显示搜索结果数量
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'date-header';
        resultsHeader.innerHTML = `<h3>搜索结果: 找到 ${matchedEvents.length} 个匹配项</h3>`;
        this.elements.taskList.appendChild(resultsHeader);
        
        // 显示匹配的事件
        matchedEvents.forEach(event => {
            const taskItem = this.createTaskItem(event);
            taskItem.classList.add('search-match');
            this.elements.taskList.appendChild(taskItem);
        });
    },
    
    /**
     * 添加清单简版显示
     */
    addTodolistPreview() {
        // 检查页面中是否已存在清单预览，避免重复
        if (document.querySelector('.todolist-preview')) {
            return;
        }
        
        const data = StorageManager.getData();
        
        if (!data.lists || data.lists.length === 0) return;
        
        // 创建清单预览区域
        const todolistPreview = document.createElement('div');
        todolistPreview.className = 'preview-section todolist-preview';
        
        // 创建标题（可点击折叠）
        const todolistHeader = document.createElement('div');
        todolistHeader.className = 'date-header collapsible collapsed';
        todolistHeader.innerHTML = `
            <h3><i class="fas fa-tasks"></i> 最近清单</h3>
            <span class="collapse-icon"><i class="fas fa-chevron-right"></i></span>
        `;
        
        // 创建内容容器（可折叠）
        const todolistContent = document.createElement('div');
        todolistContent.className = 'collapsible-content collapsed';
        
        // 添加折叠/展开功能
        todolistHeader.addEventListener('click', () => {
            todolistHeader.classList.toggle('collapsed');
            todolistContent.classList.toggle('collapsed');
            const icon = todolistHeader.querySelector('.collapse-icon i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-right');
        });
        
        // 筛选出有事项的清单
        const listsWithItems = data.lists.filter(list => list.items && list.items.length > 0);
        
        // 如果没有含事项的清单，则不显示预览
        if (listsWithItems.length === 0) return;
        
        const listPreviewContainer = document.createElement('div');
        listPreviewContainer.className = 'preview-container';
        
        // 最多显示3个清单
        const previewLists = listsWithItems.slice(0, 3);
        
        previewLists.forEach(list => {
            const listPreview = document.createElement('div');
            listPreview.className = 'preview-item todo-preview';
            
            // 显示清单名称和有多少项
            const itemCount = list.items ? list.items.length : 0;
            const completedCount = list.items ? list.items.filter(item => item.completed).length : 0;
            const incompleteCount = itemCount - completedCount;
            
            // 添加颜色指示器和进度条
            const colorIndicator = incompleteCount > 0 ? (incompleteCount > itemCount/2 ? 'high' : 'medium') : 'low';
            const progressPercent = itemCount > 0 ? Math.round((completedCount / itemCount) * 100) : 100;
            
            listPreview.innerHTML = `
                <div class="preview-header">
                    <div class="preview-title">
                        <i class="fas fa-list-ul"></i> ${list.name} 
                        <span class="priority-tag priority-${colorIndicator}">${incompleteCount} 待完成</span>
                    </div>
                    <div class="preview-progress-container">
                        <div class="preview-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="preview-info">完成度: ${progressPercent}% (${completedCount}/${itemCount})</div>
                </div>
                <div class="preview-items">
                    ${this.getTodolistPreviewItems(list)}
                </div>
                <div class="preview-actions">
                    <button class="view-more-btn"><i class="fas fa-eye"></i> 查看详情</button>
                    <button class="quick-add-btn" data-list-id="${list.id}"><i class="fas fa-plus"></i> 快速添加</button>
                </div>
            `;
            
            // 为查看详情按钮添加事件
            const viewMoreBtn = listPreview.querySelector('.view-more-btn');
            viewMoreBtn.addEventListener('click', () => {
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('todolist');
                    if (window.TodoListManager && typeof TodoListManager.selectList === 'function') {
                        setTimeout(() => {
                            TodoListManager.selectList(list.id);
                        }, 100);
                    }
                }
            });
            
            // 为快速添加按钮添加事件
            const quickAddBtn = listPreview.querySelector('.quick-add-btn');
            quickAddBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const listId = quickAddBtn.getAttribute('data-list-id');
                this.showQuickAddDialog(listId);
            });
            
            listPreviewContainer.appendChild(listPreview);
        });
        
        // 如果有更多清单，显示"查看更多"
        if (listsWithItems.length > 3) {
            const viewMorePreview = document.createElement('div');
            viewMorePreview.className = 'preview-more';
            viewMorePreview.innerHTML = `
                <button class="view-all-btn"><i class="fas fa-list-alt"></i> 查看全部 ${listsWithItems.length} 个清单</button>
            `;
            
            // 为查看全部按钮添加事件
            const viewAllBtn = viewMorePreview.querySelector('.view-all-btn');
            viewAllBtn.addEventListener('click', () => {
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('todolist');
                }
            });
            
            listPreviewContainer.appendChild(viewMorePreview);
        }
        
        todolistContent.appendChild(listPreviewContainer);
        todolistPreview.appendChild(todolistHeader);
        todolistPreview.appendChild(todolistContent);
        
        // 查找任务列表容器
        const taskList = this.elements.taskList;
        if (!taskList) {
            console.error('找不到任务列表容器，无法添加清单预览');
            return;
        }
        
        // 查找天气容器
        const weatherContainer = document.querySelector('.weather-tips-container');
        if (weatherContainer && weatherContainer.parentNode) {
            // 将清单预览插入到天气容器后面
            weatherContainer.parentNode.insertBefore(todolistPreview, weatherContainer.nextSibling);
        } else {
            // 如果找不到天气容器，则添加到任务列表开头
            if (taskList.firstChild) {
                taskList.insertBefore(todolistPreview, taskList.firstChild);
            } else {
                taskList.appendChild(todolistPreview);
            }
        }
    },
    
    /**
     * 获取清单预览项目
     * @param {Object} list 清单对象
     * @returns {string} 预览项目HTML
     */
    getTodolistPreviewItems(list) {
        if (!list.items || list.items.length === 0) {
            return '<div class="empty-preview">暂无项目</div>';
        }
        
        // 按是否完成排序，同时按优先级和截止日期排序
        const sortedItems = [...list.items].sort((a, b) => {
            // 首先按照完成状态排序
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // 如果都是未完成的，优先按重要度排序
            if (!a.completed && !b.completed) {
                // 获取重要度优先级，同时处理中文和英文格式
                const getPriorityValue = (priority) => {
                    if (!priority) return 0;
                    if (priority === 'high' || priority === '高') return 3;
                    if (priority === 'medium' || priority === '中') return 2;
                    if (priority === 'low' || priority === '低') return 1;
                    return 0;
                };
                
                const aPriority = getPriorityValue(a.priority);
                const bPriority = getPriorityValue(b.priority);
                
                // 高优先级排在前面
                if (aPriority !== bPriority) {
                    return bPriority - aPriority;
                }
                
                // 如果优先级相同，有截止日期的排前面
                const aDueDate = a.dueDate ? new Date(a.dueDate) : null;
                const bDueDate = b.dueDate ? new Date(b.dueDate) : null;
                
                // 如果一个有截止日期而另一个没有
                if (aDueDate && !bDueDate) return -1;
                if (!aDueDate && bDueDate) return 1;
                
                // 如果都有截止日期，按日期排序
                if (aDueDate && bDueDate) {
                    return aDueDate - bDueDate;
                }
            }
            
            return 0;
        });
        
        // 显示前3个项目（增加显示数量）
        const previewItems = sortedItems.slice(0, 3);
        
        let html = '';
        previewItems.forEach(item => {
            // 计算截止日期状态
            let dueDateHtml = '';
            if (item.dueDate && !item.completed) {
                const dueDate = new Date(item.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let dueClass = 'due-future';
                let dueText = `${diffDays}天后到期`;
                
                if (diffDays < 0) {
                    dueClass = 'due-overdue';
                    dueText = `已逾期${Math.abs(diffDays)}天`;
                } else if (diffDays === 0) {
                    dueClass = 'due-today';
                    dueText = '今天到期';
                } else if (diffDays <= 3) {
                    dueClass = 'due-soon';
                    dueText = `${diffDays}天后到期`;
                }
                
                dueDateHtml = `<span class="preview-due-date ${dueClass}"><i class="fas fa-clock"></i> ${dueText}</span>`;
            }
            
            // 添加重要度标记
            let priorityHtml = '';
            if (item.priority && !item.completed) {
                // 处理优先级，支持中文和英文格式
                let priorityClass = '';
                let priorityIcon = '';
                let priorityText = '';
                
                // 统一处理各种可能的优先级值格式
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
    
    /**
     * 显示快速添加项目对话框
     * @param {string} listId 清单ID
     */
    showQuickAddDialog(listId) {
        // 查找或创建对话框
        let quickAddDialog = document.getElementById('quick-add-dialog');
        if (!quickAddDialog) {
            quickAddDialog = document.createElement('div');
            quickAddDialog.id = 'quick-add-dialog';
            quickAddDialog.className = 'modal';
            document.body.appendChild(quickAddDialog);
        }
        
        // 获取清单信息
        const data = StorageManager.getData();
        const list = data.lists.find(l => l.id === listId);
        if (!list) return;
        
        // 设置对话框内容
        quickAddDialog.innerHTML = `
            <div class="modal-content quick-add-modal">
                <div class="modal-header">
                    <h3>添加项目到"${list.name}"</h3>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <input type="text" id="quick-add-item-title" placeholder="输入项目标题" class="quick-add-input">
                    <div class="quick-add-options">
                        <div class="quick-add-option">
                            <label for="quick-add-due-date">截止日期</label>
                            <input type="date" id="quick-add-due-date">
                        </div>
                        <div class="quick-add-option">
                            <label for="quick-add-priority">重要度</label>
                            <select id="quick-add-priority" class="quick-add-select">
                                <option value="">无</option>
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="quick-add-save-btn" class="primary-btn" data-list-id="${listId}">添加</button>
                    <button id="quick-add-cancel-btn" class="secondary-btn">取消</button>
                </div>
            </div>
        `;
        
        // 显示对话框
        quickAddDialog.style.display = 'flex';
        
        // 聚焦输入框
        setTimeout(() => {
            document.getElementById('quick-add-item-title').focus();
        }, 100);
        
        // 添加事件处理
        const closeBtn = quickAddDialog.querySelector('.close-modal-btn');
        const cancelBtn = document.getElementById('quick-add-cancel-btn');
        const saveBtn = document.getElementById('quick-add-save-btn');
        
        // 关闭对话框函数
        const closeDialog = () => {
            quickAddDialog.style.display = 'none';
        };
        
        // 关闭按钮事件
        closeBtn.addEventListener('click', closeDialog);
        
        // 取消按钮事件
        cancelBtn.addEventListener('click', closeDialog);
        
        // 保存按钮事件
        saveBtn.addEventListener('click', () => {
            const titleInput = document.getElementById('quick-add-item-title');
            const dueDateInput = document.getElementById('quick-add-due-date');
            const prioritySelect = document.getElementById('quick-add-priority');
            
            const title = titleInput.value.trim();
            const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
            const priority = prioritySelect.value;
            
            if (title) {
                // 添加项目到清单
                const data = StorageManager.getData();
                const list = data.lists.find(l => l.id === listId);
                
                if (list) {
                    const newItem = {
                        id: Date.now().toString(),
                        title: title,
                        completed: false,
                        createTime: new Date().toISOString(),
                        dueDate: dueDate ? dueDate.toISOString() : null,
                        priority: priority || null
                    };
                    
                    if (!list.items) {
                        list.items = [];
                    }
                    
                    list.items.push(newItem);
                    StorageManager.saveData(data);
                    
                    // 刷新预览
                    this.reloadPreviews();
                    
                    // 如果清单界面是可见的，也刷新它
                    if (window.TodoListManager) {
                        TodoListManager.loadLists();
                        if (TodoListManager.currentListId === listId) {
                            TodoListManager.loadListItems(list);
                        }
                    }
                }
                
                // 关闭对话框
                closeDialog();
            }
        });
        
        // 按Enter键提交
        const titleInput = document.getElementById('quick-add-item-title');
        titleInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
    },
    
    /**
     * 重新加载所有预览区域
     */
    reloadPreviews() {
        // 移除现有预览
        this.clearPreviews();
        
        // 移除清单和倒数日预览的重新加载
    },
    
    /**
     * 添加倒数日简版显示
     */
    addCountdownPreview() {
        // 检查页面中是否已存在倒数日预览，避免重复
        if (document.querySelector('.countdown-preview-section')) {
            return;
        }
        
        const data = StorageManager.getData();
        
        if (!data.countdowns || data.countdowns.length === 0) return;
        
        // 创建倒数日预览区域
        const countdownPreview = document.createElement('div');
        countdownPreview.className = 'preview-section countdown-preview-section';
        
        // 创建标题（可点击折叠）
        const countdownHeader = document.createElement('div');
        countdownHeader.className = 'date-header collapsible collapsed';
        countdownHeader.innerHTML = `
            <h3><i class="fas fa-calendar-day"></i> 最近倒数日</h3>
            <span class="collapse-icon"><i class="fas fa-chevron-right"></i></span>
        `;
        
        // 创建内容容器（可折叠）
        const countdownContent = document.createElement('div');
        countdownContent.className = 'collapsible-content collapsed';
        
        // 添加折叠/展开功能
        countdownHeader.addEventListener('click', () => {
            countdownHeader.classList.toggle('collapsed');
            countdownContent.classList.toggle('collapsed');
            const icon = countdownHeader.querySelector('.collapse-icon i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-right');
        });
        
        // 按日期排序倒数日（优先显示最近的日期）
        const sortedCountdowns = [...data.countdowns].sort((a, b) => {
            const daysA = this._calculateCountdownDays(a);
            const daysB = this._calculateCountdownDays(b);
            
            // 优先显示未来的日期，按天数升序排序
            if (daysA >= 0 && daysB >= 0) return daysA - daysB;
            // 如果两个都是过去的日期，按天数降序排序（最近过去的在前）
            if (daysA < 0 && daysB < 0) return daysB - daysA;
            // 未来的日期优先于过去的日期
            return daysB - daysA;
        });
        
        // 获取前三个倒数日
        const previewCountdowns = sortedCountdowns.slice(0, 3);
        const countdownPreviewContainer = document.createElement('div');
        countdownPreviewContainer.className = 'preview-container';
        
        previewCountdowns.forEach(countdown => {
            const countdownPreviewItem = document.createElement('div');
            countdownPreviewItem.className = 'preview-item countdown-preview';
            countdownPreviewItem.style.setProperty('--accent-color', countdown.color || '#4285f4');
            
            // 计算剩余天数（使用内部方法确保一致性）
            const days = this._calculateCountdownDays(countdown);
            
            // 设置显示文本和样式
            let daysText = '';
            let daysClass = '';
            let statusIcon = '';
            
            if (days === 0) {
                daysText = '就是今天';
                daysClass = 'today';
                statusIcon = '<i class="fas fa-star"></i>';
            } else if (days > 0) {
                if (days <= 7) {
                    daysClass = 'soon';
                    statusIcon = '<i class="fas fa-hourglass-half"></i>';
                } else {
                    daysClass = 'future';
                    statusIcon = '<i class="fas fa-hourglass-start"></i>';
                }
                daysText = `还有 ${days} 天`;
            } else {
                daysText = `已过 ${Math.abs(days)} 天`;
                daysClass = 'past';
                statusIcon = '<i class="fas fa-history"></i>';
            }
            
            // 格式化日期显示
            const formattedDate = this._formatCountdownDate(countdown.date);
            
            // 显示进度条（仅对未来7天内的事件）
            let progressBar = '';
            if (days >= 0 && days <= 7) {
                const percent = days === 0 ? 100 : Math.round((7 - days) / 7 * 100);
                progressBar = `
                    <div class="countdown-progress">
                        <div class="countdown-progress-bar" style="width: ${percent}%"></div>
                    </div>
                `;
            }
            
            // 添加备注预览（如果有）
            let notesPreview = '';
            if (countdown.notes && countdown.notes.trim()) {
                const shortNotes = countdown.notes.length > 30 
                    ? countdown.notes.substring(0, 27) + '...' 
                    : countdown.notes;
                notesPreview = `
                    <div class="countdown-notes-preview">
                        <i class="fas fa-quote-left"></i> ${shortNotes}
                    </div>
                `;
            }
            
            countdownPreviewItem.innerHTML = `
                <div class="preview-countdown-header">
                    <div class="countdown-icon-container ${daysClass}">
                        ${countdown.icon || '📅'}
                    </div>
                    <div class="countdown-title-container">
                        <span class="preview-countdown-title">${countdown.name}</span>
                        <span class="countdown-type-tag">${window.CountdownManager ? window.CountdownManager.formatTypeShort(countdown.type) : (countdown.type === 'yearly' ? '每年' : countdown.type === 'monthly' ? '每月' : '单次')}</span>
                    </div>
                </div>
                ${progressBar}
                <div class="preview-countdown-days ${daysClass}">
                    ${statusIcon} ${daysText}
                </div>
                <div class="preview-countdown-date">
                    <i class="far fa-calendar-alt"></i> ${formattedDate}
                </div>
                ${notesPreview}
                <div class="preview-actions">
                    <button class="view-more-btn"><i class="fas fa-eye"></i> 查看详情</button>
                </div>
            `;
            
            // 为查看详情按钮添加事件
            const viewMoreBtn = countdownPreviewItem.querySelector('.view-more-btn');
            viewMoreBtn.addEventListener('click', () => {
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('countdown');
                }
            });
            
            countdownPreviewContainer.appendChild(countdownPreviewItem);
        });
        
        // 如果有更多倒数日，显示"查看更多"
        if (data.countdowns.length > 3) {
            const viewMorePreview = document.createElement('div');
            viewMorePreview.className = 'preview-more';
            viewMorePreview.innerHTML = `
                <button class="view-all-btn"><i class="fas fa-calendar-alt"></i> 查看全部 ${data.countdowns.length} 个倒数日</button>
            `;
            
            // 为查看全部按钮添加事件
            const viewAllBtn = viewMorePreview.querySelector('.view-all-btn');
            viewAllBtn.addEventListener('click', () => {
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('countdown');
                }
            });
            
            countdownPreviewContainer.appendChild(viewMorePreview);
        }
        
        countdownContent.appendChild(countdownPreviewContainer);
        countdownPreview.appendChild(countdownHeader);
        countdownPreview.appendChild(countdownContent);
        
        // 查找任务列表容器
        const taskList = this.elements.taskList;
        if (!taskList) {
            console.error('找不到任务列表容器，无法添加倒数日预览');
            return;
        }
        
        // 查找清单预览区域
        const todolistPreview = document.querySelector('.todolist-preview');
        if (todolistPreview && todolistPreview.parentNode) {
            // 将倒数日预览插入到清单预览后面
            todolistPreview.parentNode.insertBefore(countdownPreview, todolistPreview.nextSibling);
        } else {
            // 如果找不到清单预览，则添加到天气区域后面
            const weatherContainer = document.querySelector('.weather-tips-container');
            if (weatherContainer && weatherContainer.parentNode) {
                weatherContainer.parentNode.insertBefore(countdownPreview, weatherContainer.nextSibling);
            } else {
                // 如果都找不到，则添加到任务列表中
                if (taskList.firstChild) {
                    taskList.insertBefore(countdownPreview, taskList.firstChild);
                } else {
                    taskList.appendChild(countdownPreview);
                }
            }
        }
    },
    
    /**
     * 计算倒数日天数（内部方法）
     * @private
     * @param {Object} countdown 倒数日对象
     * @returns {number} 距离天数
     */
    _calculateCountdownDays(countdown) {
        if (!countdown || !countdown.date) return 0;
        
        try {
            // 获取今天的日期并重置时分秒，确保只比较日期部分
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 解析目标日期，确保正确解析格式
            const dateParts = countdown.date.split('-');
            if (dateParts.length !== 3) {
                return 0;
            }
            
            // 创建日期对象 (月份需要减1，因为JS中月份是0-11)
            let targetDate = new Date(
                parseInt(dateParts[0]), 
                parseInt(dateParts[1]) - 1, 
                parseInt(dateParts[2])
            );
            
            // 确保日期有效
            if (isNaN(targetDate.getTime())) {
                return 0;
            }
            
            if (countdown.type === 'yearly') {
                // 对于每年重复的日期
                const currentYear = today.getFullYear();
                const targetMonth = targetDate.getMonth();
                const targetDay = targetDate.getDate();
                
                // 设置为今年的对应日期
                targetDate = new Date(currentYear, targetMonth, targetDay);
                
                // 如果今年的日期已过，计算到明年的天数
                if (targetDate < today) {
                    targetDate = new Date(currentYear + 1, targetMonth, targetDay);
                }
            } else if (countdown.type === 'monthly') {
                // 对于每月重复的日期
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth();
                const targetDay = targetDate.getDate();
                
                // 设置为当前月的对应日期
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
        } catch (e) {
            console.error('计算倒数日天数出错:', e);
            return 0;
        }
    },
    
    /**
     * 格式化倒数日日期（内部方法）
     * @private
     * @param {string} dateStr 日期字符串
     * @returns {string} 格式化后的日期
     */
    _formatCountdownDate(dateStr) {
        try {
            // 解析日期字符串 (格式应该是 YYYY-MM-DD)
            const dateParts = dateStr.split('-');
            if (dateParts.length !== 3) {
                return dateStr;
            }
            
            // 创建日期对象 (月份需要减1，因为JS中月份是0-11)
            const date = new Date(
                parseInt(dateParts[0]), 
                parseInt(dateParts[1]) - 1, 
                parseInt(dateParts[2])
            );
            
            // 检查日期是否有效
            if (isNaN(date.getTime())) {
                return dateStr;
            }
            
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        } catch (e) {
            return dateStr;
        }
    },
    
    /**
     * 清除所有预览区域
     */
    clearPreviews() {
        // 移除清单预览
        const todolistPreview = document.querySelector('.todolist-preview');
        if (todolistPreview) {
            todolistPreview.remove();
        }
        
        // 移除倒数日预览
        const countdownPreview = document.querySelector('.countdown-preview-section');
        if (countdownPreview) {
            countdownPreview.remove();
        }
        
        // 移除任何其他存在的预览区域
        const allPreviews = document.querySelectorAll('.preview-section');
        allPreviews.forEach(preview => preview.remove());
    },

    /**
     * 初始化标签筛选功能
     */
    initTagFilter() {
        // 获取所有事件，收集所有标签
        const events = StorageManager.getEvents();
        const tagSet = new Set();
        const tagCounts = {};
        
        events.forEach(event => {
            if (event.tags && Array.isArray(event.tags)) {
                event.tags.forEach(tag => {
                    if (tag) {
                        tagSet.add(tag);
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                });
            }
        });
        
        const tags = Array.from(tagSet);
        const container = document.getElementById('unified-filter-container');
        const buttonsContainer = document.getElementById('tag-filter-buttons');
        const tagCountElement = document.getElementById('tag-count');
        const clearFilterBtn = document.getElementById('clear-all-filters-btn');
        
        if (!container || !buttonsContainer) return;
        
        // 更新标签计数
        if (tagCountElement) {
            tagCountElement.textContent = tags.length;
        }
        
        // 清空按钮容器
        buttonsContainer.innerHTML = '';
        
        if (tags.length === 0) {
            // 如果没有标签，隐藏整个筛选容器
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        // 创建标签按钮
        tags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-filter-btn';
            btn.innerHTML = `${tag} <span class="tag-count">${tagCounts[tag]}</span>`;
            btn.setAttribute('data-tag', tag);
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
                this.updateFilterStatus();
                this.applyTagFilter();
            });
            buttonsContainer.appendChild(btn);
        });
        
        // 绑定清除筛选按钮事件
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
        
        // 初始化筛选状态
        this.updateFilterStatus();
    },

    /**
     * 更新筛选状态显示
     */
    updateFilterStatus() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-filter-btn.selected')).map(btn => btn.getAttribute('data-tag'));
        const searchQuery = this.elements.listSearchInput ? this.elements.listSearchInput.value.trim() : '';
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const clearFilterBtn = document.getElementById('clear-all-filters-btn');
        const filterStatus = document.getElementById('filter-status');
        const filterStatusText = document.getElementById('filter-status-text');
        
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const hasFilters = selectedTags.length > 0 || searchQuery.length > 0 || startDate || endDate;
        
        // 控制出行贴士的显示/隐藏
        this.toggleWeatherTipsVisibility(!hasFilters);
        
        // 显示/隐藏清除筛选按钮
        if (clearFilterBtn) {
            clearFilterBtn.style.display = hasFilters ? 'flex' : 'none';
        }
        
        // 更新状态指示器
        if (filterStatus && filterStatusText) {
            if (hasFilters) {
                filterStatus.style.display = 'flex';
                filterStatus.classList.add('active');
                
                let statusText = '';
                const parts = [];
                
                if (selectedTags.length > 0) {
                    parts.push(`${selectedTags.length} 个标签`);
                }
                if (searchQuery.length > 0) {
                    parts.push(`搜索: "${searchQuery}"`);
                }
                if (startDate || endDate) {
                    if (startDate && endDate) {
                        parts.push(`日期: ${startDate} 至 ${endDate}`);
                    } else if (startDate) {
                        parts.push(`开始日期: ${startDate}`);
                    } else if (endDate) {
                        parts.push(`结束日期: ${endDate}`);
                    }
                }
                
                statusText = parts.join('，');
                filterStatusText.textContent = statusText;
            } else {
                filterStatus.style.display = 'none';
                filterStatus.classList.remove('active');
            }
        }
    },

    /**
     * 控制出行贴士的显示/隐藏
     * @param {boolean} show - 是否显示出行贴士
     */
    toggleWeatherTipsVisibility(show) {
        const weatherTipsContainer = document.querySelector('.weather-tips-container');
        if (weatherTipsContainer) {
            if (show) {
                weatherTipsContainer.style.display = 'flex';
                weatherTipsContainer.style.opacity = '1';
                weatherTipsContainer.style.transform = 'translateY(0)';
            } else {
                weatherTipsContainer.style.opacity = '0';
                weatherTipsContainer.style.transform = 'translateY(-10px)';
                // 延迟隐藏，让动画效果完成
                setTimeout(() => {
                    weatherTipsContainer.style.display = 'none';
                }, 300);
            }
        }
    },

    /**
     * 清除所有筛选条件
     */
    clearAllFilters() {
        // 如果统一筛选管理器存在，优先使用它
        if (window.unifiedFilterManager) {
            window.unifiedFilterManager.clearAllFilters();
            return;
        }
        
        // 备用清除逻辑（当统一筛选管理器不可用时）
        // 清除选中的标签
        const selectedButtons = document.querySelectorAll('.tag-filter-btn.selected');
        selectedButtons.forEach(btn => btn.classList.remove('selected'));
        
        // 清除搜索框
        if (this.elements.listSearchInput) {
            this.elements.listSearchInput.value = '';
        }
        
        // 隐藏清除搜索按钮
        if (this.elements.clearSearchBtn) {
            this.elements.clearSearchBtn.style.display = 'none';
        }
        
        // 清除日期筛选
        this.clearDateFilter();
        
        // 清除项目筛选
        const projectSelect = document.getElementById('project-filter-select');
        const clearProjectFilterBtn = document.getElementById('clear-project-filter-btn');
        const projectFilterStatus = document.getElementById('project-filter-status');
        
        if (projectSelect) {
            projectSelect.value = '';
        }
        if (clearProjectFilterBtn) {
            clearProjectFilterBtn.style.display = 'none';
        }
        if (projectFilterStatus) {
            projectFilterStatus.style.display = 'none';
        }
        
        // 更新状态并重新加载任务（这会自动恢复出行贴士和预览的显示）
        this.updateFilterStatus();
        this.loadTasks(true); // 传入true确保刷新预览区域
    },

    /**
     * 应用标签筛选和搜索（保持向后兼容）
     */
    applyTagFilter() {
        this.applyAllFilters();
    },

    /**
     * 初始化日期筛选功能
     */
    initDateFilter() {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const quickDateButtons = document.querySelectorAll('.quick-date-btn');
        
        // 绑定日期输入框事件
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                this.updateDateFilterStatus();
                this.applyAllFilters();
            });
        }
        
        if (endDateInput) {
            endDateInput.addEventListener('change', () => {
                this.updateDateFilterStatus();
                this.applyAllFilters();
            });
        }
        
        // 绑定快捷日期按钮事件
        quickDateButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const dateType = btn.getAttribute('data-type');
                this.setQuickDate(dateType);
            });
        });
        
        // 初始化日期筛选状态
        this.updateDateFilterStatus();
    },

    /**
     * 设置快捷日期
     * @param {string} dateType 日期类型
     */
    setQuickDate(dateType) {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const quickDateButtons = document.querySelectorAll('.quick-date-btn');
        
        // 清除所有快捷按钮的激活状态
        quickDateButtons.forEach(btn => btn.classList.remove('active'));
        
        const today = new Date();
        let startDate, endDate;
        
        switch (dateType) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                startDate = endDate = tomorrow.toISOString().split('T')[0];
                break;
            case 'this-week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                startDate = weekStart.toISOString().split('T')[0];
                endDate = weekEnd.toISOString().split('T')[0];
                break;
            case 'next-week':
                const nextWeekStart = new Date(today);
                nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
                const nextWeekEnd = new Date(nextWeekStart);
                nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
                startDate = nextWeekStart.toISOString().split('T')[0];
                endDate = nextWeekEnd.toISOString().split('T')[0];
                break;
            case 'this-month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                startDate = monthStart.toISOString().split('T')[0];
                endDate = monthEnd.toISOString().split('T')[0];
                break;
            case 'next-month':
                const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                startDate = nextMonthStart.toISOString().split('T')[0];
                endDate = nextMonthEnd.toISOString().split('T')[0];
                break;
            default:
                return;
        }
        
        // 设置日期输入框的值
        if (startDateInput) startDateInput.value = startDate;
        if (endDateInput) endDateInput.value = endDate;
        
        // 激活对应的快捷按钮
        const activeBtn = document.querySelector(`[data-type="${dateType}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        // 更新状态并应用筛选
        this.updateDateFilterStatus();
        this.applyAllFilters();
    },

    /**
     * 清除日期筛选
     */
    clearDateFilter() {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const quickDateButtons = document.querySelectorAll('.quick-date-btn');
        
        // 清空日期输入框
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        
        // 清除快捷按钮的激活状态
        quickDateButtons.forEach(btn => btn.classList.remove('active'));
        
        // 更新状态并应用筛选
        this.updateDateFilterStatus();
        this.applyAllFilters();
    },

    /**
     * 更新日期筛选状态显示
     */
    updateDateFilterStatus() {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const dateFilterStatus = document.getElementById('date-filter-status');
        const dateFilterStatusText = document.getElementById('date-filter-status-text');
        
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const hasDateFilter = startDate || endDate;
        
        // 更新状态指示器
        if (dateFilterStatus && dateFilterStatusText) {
            if (hasDateFilter) {
                dateFilterStatus.style.display = 'flex';
                dateFilterStatus.classList.add('active');
                
                let statusText = '';
                if (startDate && endDate) {
                    statusText = `日期范围: ${startDate} 至 ${endDate}`;
                } else if (startDate) {
                    statusText = `开始日期: ${startDate}`;
                } else if (endDate) {
                    statusText = `结束日期: ${endDate}`;
                }
                dateFilterStatusText.textContent = statusText;
            } else {
                dateFilterStatus.style.display = 'none';
                dateFilterStatus.classList.remove('active');
            }
        }
    },

    /**
     * 应用所有筛选条件（标签、搜索、日期）
     */
    applyAllFilters() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-filter-btn.selected')).map(btn => btn.getAttribute('data-tag'));
        const searchQuery = this.elements.listSearchInput ? this.elements.listSearchInput.value.trim().toLowerCase() : '';
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const hasFilters = selectedTags.length > 0 || searchQuery.length > 0 || startDate || endDate;
        
        // 如果没有筛选条件，直接调用loadTasks恢复正常显示
        if (!hasFilters) {
            this.loadTasks();
            return;
        }
        
        // 隐藏最近倒数日和最近清单预览
        this.hidePreviews();
        
        let events = StorageManager.getEvents();
        
        // 标签筛选
        if (selectedTags.length > 0) {
            events = events.filter(event => Array.isArray(event.tags) && selectedTags.every(tag => event.tags.includes(tag)));
        }
        
        // 搜索筛选
        if (searchQuery) {
            events = events.filter(event => {
                if (event.name && event.name.toLowerCase().includes(searchQuery)) return true;
                if (event.description && event.description.toLowerCase().includes(searchQuery)) return true;
                if (event.location && event.location.toLowerCase().includes(searchQuery)) return true;
                if (event.tags && Array.isArray(event.tags)) {
                    return event.tags.some(tag => tag.toLowerCase().includes(searchQuery));
                }
                return false;
            });
        }
        
        // 日期筛选
        if (startDate || endDate) {
            events = events.filter(event => {
                if (!event.startTime) return false;
                
                const eventDate = new Date(event.startTime);
                const eventDateStr = eventDate.toISOString().split('T')[0];
                
                if (startDate && endDate) {
                    return eventDateStr >= startDate && eventDateStr <= endDate;
                } else if (startDate) {
                    return eventDateStr >= startDate;
                } else if (endDate) {
                    return eventDateStr <= endDate;
                }
                
                return true;
            });
        }
        
        // 更新筛选状态
        this.updateFilterStatus();
        this.updateDateFilterStatus();
        
        // 渲染结果
        if (this.elements.taskList) {
            this.elements.taskList.innerHTML = '';
        }
        
        if (events.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-task-message';
            emptyMessage.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-search" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-color); margin-bottom: 8px;">未找到匹配的事件</h3>
                    <p style="color: var(--text-secondary);">请尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            this.elements.taskList.appendChild(emptyMessage);
            return;
        }
        
        // 显示筛选结果数量
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'date-header';
        resultsHeader.innerHTML = `<h3>筛选结果: 找到 ${events.length} 个事件</h3>`;
        this.elements.taskList.appendChild(resultsHeader);
        
        events.forEach(event => {
            const taskItem = this.createTaskItem(event);
            taskItem.classList.add('search-match');
            this.elements.taskList.appendChild(taskItem);
        });
    },

    /**
     * 初始化折叠功能事件绑定
     */
    initFilterCollapse() {
        // 统一筛选容器的折叠功能现在由unified-filter.js处理
        // 这里保留方法以保持向后兼容性
        console.log('筛选折叠功能已迁移到统一筛选管理器');
    },

    /**
     * 切换筛选区域的折叠状态
     * @param {string} filterType - 筛选类型 ('tag' 或 'date')
     */
    toggleFilterCollapse(filterType) {
        const isTagFilter = filterType === 'tag';
        const toggleBtn = isTagFilter ? this.elements.tagFilterToggle : this.elements.dateFilterToggle;
        const content = isTagFilter ? this.elements.tagFilterContent : this.elements.dateFilterContent;
        const container = isTagFilter ? this.elements.tagFilterContainer : this.elements.dateFilterContainer;
        
        if (!toggleBtn || !content || !container) return;
        
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            // 展开
            content.classList.remove('collapsed');
            container.setAttribute('data-collapsed', 'false');
            this.saveCollapseState(filterType, false);
        } else {
            // 折叠
            content.classList.add('collapsed');
            container.setAttribute('data-collapsed', 'true');
            this.saveCollapseState(filterType, true);
        }
    },

    /**
     * 初始化默认折叠状态
     */
    initDefaultCollapseState() {
        // 默认设置为折叠状态
        if (this.elements.tagFilterContent) {
            this.elements.tagFilterContent.classList.add('collapsed');
            this.elements.tagFilterContainer.setAttribute('data-collapsed', 'true');
        }
        
        if (this.elements.dateFilterContent) {
            this.elements.dateFilterContent.classList.add('collapsed');
            this.elements.dateFilterContainer.setAttribute('data-collapsed', 'true');
        }
        
        // 检查本地存储中的折叠状态（如果有的话）
        const tagCollapsed = this.getCollapseState('tag');
        const dateCollapsed = this.getCollapseState('date');
        
        // 如果本地存储中有状态，则应用该状态
        if (tagCollapsed !== null && this.elements.tagFilterContent) {
            if (tagCollapsed) {
                this.elements.tagFilterContent.classList.add('collapsed');
                this.elements.tagFilterContainer.setAttribute('data-collapsed', 'true');
            } else {
                this.elements.tagFilterContent.classList.remove('collapsed');
                this.elements.tagFilterContainer.setAttribute('data-collapsed', 'false');
            }
        }
        
        if (dateCollapsed !== null && this.elements.dateFilterContent) {
            if (dateCollapsed) {
                this.elements.dateFilterContent.classList.add('collapsed');
                this.elements.dateFilterContainer.setAttribute('data-collapsed', 'true');
            } else {
                this.elements.dateFilterContent.classList.remove('collapsed');
                this.elements.dateFilterContainer.setAttribute('data-collapsed', 'false');
            }
        }
    },

    /**
     * 保存折叠状态到本地存储
     * @param {string} filterType - 筛选类型
     * @param {boolean} collapsed - 是否折叠
     */
    saveCollapseState(filterType, collapsed) {
        try {
            const key = `filter_${filterType}_collapsed`;
            localStorage.setItem(key, collapsed.toString());
        } catch (error) {
            console.warn('保存折叠状态失败:', error);
        }
    },

    /**
     * 从本地存储获取折叠状态
     * @param {string} filterType - 筛选类型
     * @returns {boolean|null} 是否折叠，null表示使用默认状态
     */
    getCollapseState(filterType) {
        try {
            const key = `filter_${filterType}_collapsed`;
            const value = localStorage.getItem(key);
            // 如果没有保存过状态，返回null表示使用默认状态
            return value === null ? null : value === 'true';
        } catch (error) {
            console.warn('获取折叠状态失败:', error);
            return null; // 使用默认状态
        }
    },

    /**
     * 隐藏最近倒数日和最近清单预览
     */
    hidePreviews() {
        // 移除清单预览
        const todolistPreview = document.querySelector('.todolist-preview');
        if (todolistPreview) {
            todolistPreview.remove();
        }
        
        // 移除倒数日预览
        const countdownPreview = document.querySelector('.countdown-preview-section');
        if (countdownPreview) {
            countdownPreview.remove();
        }
    },

    /**
     * 初始化项目筛选功能
     */
    initProjectFilter() {
        const projectSelect = document.getElementById('project-filter-select');
        const clearProjectFilterBtn = document.getElementById('clear-project-filter-btn');
        const projectFilterStatus = document.getElementById('project-filter-status');
        const projectFilterStatusText = document.getElementById('project-filter-status-text');
        
        if (!projectSelect) return;
        
        // 加载项目选项
        this.loadProjectFilterOptions();
        
        // 项目选择变化事件
        projectSelect.addEventListener('change', () => {
            const selectedProjectId = projectSelect.value;
            const hasProjectFilter = selectedProjectId !== '';
            
            // 更新状态显示
            if (projectFilterStatus && projectFilterStatusText) {
                if (hasProjectFilter) {
                    const selectedOption = projectSelect.options[projectSelect.selectedIndex];
                    projectFilterStatus.style.display = 'flex';
                    projectFilterStatusText.textContent = `已筛选项目: ${selectedOption.text}`;
                } else {
                    projectFilterStatus.style.display = 'none';
                }
            }
            
            // 应用筛选
            this.applyAllFilters();
        });
        
        // 清除项目筛选按钮（现在由统一筛选管理器处理）
        if (clearProjectFilterBtn) {
            clearProjectFilterBtn.addEventListener('click', () => {
                projectSelect.value = '';
                if (projectFilterStatus) {
                    projectFilterStatus.style.display = 'none';
                }
                this.applyAllFilters();
            });
        }
    },
    
    /**
     * 加载项目筛选选项
     */
    loadProjectFilterOptions() {
        const projectSelect = document.getElementById('project-filter-select');
        if (!projectSelect) return;
        
        // 保存当前选中的值
        const currentValue = projectSelect.value;
        
        // 清空选项（保留"所有项目"选项）
        projectSelect.innerHTML = '<option value="">所有项目</option>';
        
        // 获取所有项目
        const projects = StorageManager.getProjects();
        
        // 添加项目选项
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
        
        // 恢复选中的值
        projectSelect.value = currentValue;
    },

    /**
     * 应用所有筛选条件（标签、搜索、日期、项目）
     */
    applyAllFilters() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-filter-btn.selected')).map(btn => btn.getAttribute('data-tag'));
        const searchQuery = this.elements.listSearchInput ? this.elements.listSearchInput.value.trim().toLowerCase() : '';
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const projectSelect = document.getElementById('project-filter-select');
        
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const selectedProjectId = projectSelect ? projectSelect.value : '';
        
        const hasFilters = selectedTags.length > 0 || searchQuery.length > 0 || startDate || endDate || selectedProjectId;
        
        // 如果没有筛选条件，直接调用loadTasks恢复正常显示
        if (!hasFilters) {
            this.loadTasks();
            return;
        }
        
        // 隐藏最近倒数日和最近清单预览
        this.hidePreviews();
        
        let events = StorageManager.getEvents();
        
        // 标签筛选
        if (selectedTags.length > 0) {
            events = events.filter(event => Array.isArray(event.tags) && selectedTags.every(tag => event.tags.includes(tag)));
        }
        
        // 搜索筛选
        if (searchQuery) {
            events = events.filter(event => {
                if (event.name && event.name.toLowerCase().includes(searchQuery)) return true;
                if (event.description && event.description.toLowerCase().includes(searchQuery)) return true;
                if (event.location && event.location.toLowerCase().includes(searchQuery)) return true;
                if (event.tags && Array.isArray(event.tags)) {
                    return event.tags.some(tag => tag.toLowerCase().includes(searchQuery));
                }
                return false;
            });
        }
        
        // 日期筛选
        if (startDate || endDate) {
            events = events.filter(event => {
                if (!event.startTime) return false;
                
                const eventDate = new Date(event.startTime);
                const eventDateStr = eventDate.toISOString().split('T')[0];
                
                if (startDate && endDate) {
                    return eventDateStr >= startDate && eventDateStr <= endDate;
                } else if (startDate) {
                    return eventDateStr >= startDate;
                } else if (endDate) {
                    return eventDateStr <= endDate;
                }
                
                return true;
            });
        }
        
        // 项目筛选
        if (selectedProjectId) {
            events = events.filter(event => event.projectId === selectedProjectId);
        }
        
        // 更新筛选状态
        this.updateFilterStatus();
        this.updateDateFilterStatus();
        
        // 渲染结果
        if (this.elements.taskList) {
            this.elements.taskList.innerHTML = '';
        }
        
        if (events.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-task-message';
            emptyMessage.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-search" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-color); margin-bottom: 8px;">未找到匹配的事件</h3>
                    <p style="color: var(--text-secondary);">请尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            this.elements.taskList.appendChild(emptyMessage);
            return;
        }
        
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'date-header';
        resultsHeader.innerHTML = `<h3>筛选结果: 找到 ${events.length} 个事件</h3>`;
        this.elements.taskList.appendChild(resultsHeader);
        
        events.forEach(event => {
            const taskItem = this.createTaskItem(event);
            taskItem.classList.add('search-match');
            this.elements.taskList.appendChild(taskItem);
        });
    },

    /**
     * 将Date对象转换为本地时间字符串（用于datetime-local输入框）
     */
    formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    /**
     * 将Date对象转换为本地日期字符串（用于date输入框）
     */
    formatDateOnlyForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 取消事件创建并返回上一页
     */
    cancelEvent() {
        // 重置表单
        this.resetEventForm();
        
        // 返回上一页
        if (window.CreateMenuManager) {
            window.CreateMenuManager.goBack();
        } else {
            // 如果没有新建菜单管理器，默认返回最近要做页面
            if (window.UIManager) {
                window.UIManager.switchView('recent');
            }
        }
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    TaskManager.init();
});

// 导出
window.TaskManager = TaskManager;
window.TaskManager = TaskManager;