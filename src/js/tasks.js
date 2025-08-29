/**
 * 任务管理模块
 * 负责处理任务/Things的创建、Edit、Delet等操作
 */

const TaskManager = {
    /**
     * 初始化任务管理器
     * @param {Boolean} reloadContent 是否重新加载Content，默认为true
     */
    init(reloadContent = true) {
        // 只在第一times初始化或明确要求时缓存元素和绑定Things
        if (!this.initialized) {
            this.cacheElements();
            this.bindEvents();
            this.initialized = true;
        }
        
        // 只在需要时重新加载Content
        if (reloadContent) {
            this.loadTasks();
            this.loadProjects();
            this.setTodayDate();
        }
        
        // 始终初始化Things监听器，确保动态添加的元素有正确的Things绑定
        this.initEventListeners();
        this.initTagFilter(); // 初始化Label筛选
        this.initDateFilter(); // 初始化日期筛选
        this.initProjectFilter(); // 初始化Project筛选
    },
    
    /**
     * 缓存DOM元素
     */
    cacheElements() {
        // 任务列表和日期
        this.elements = {
            taskList: document.getElementById('task-List'),
            todayDate: document.getElementById('today-date'),
            projectsContainer: document.getElementById('projects-container'),
            
            // 搜索相关
            ListSearchInput: document.getElementById('List-search-input'),
            clearSearchBtn: document.getElementById('clear-search-btn'),
            
            // Things表单
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
            
            // 专注任务Select器
            focusTask: document.getElementById('focus-task'),
            
            // 新添加的Label输入框
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
     * 绑定Things处理
     */
    bindEvents() {
        // 保存Things
        if (this.elements.saveEventBtn) {
            this.elements.saveEventBtn.addEventListener('click', () => {
                this.saveEvent();
            });
        }
        
        // 取消Things
        if (this.elements.cancelEventBtn) {
            this.elements.cancelEventBtn.addEventListener('click', () => {
                this.cancelEvent();
            });
        }
        
        // 地图Select器
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
        
        // EditThings
        if (this.elements.editEventBtn) {
            this.elements.editEventBtn.addEventListener('click', () => {
                const eventId = this.elements.eventDetailsModal.dataset.eventId;
                this.editEvent(eventId);
            });
        }
        
        // DeletThings
        if (this.elements.deleteEventBtn) {
            this.elements.deleteEventBtn.addEventListener('click', () => {
                const eventId = this.elements.eventDetailsModal.dataset.eventId;
                this.deleteEvent(eventId);
            });
        }
        
        // 批量Delet按钮
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        if (batchDeleteBtn) {
            batchDeleteBtn.style.display = 'block'; // 始终显示批量Delet按钮
            batchDeleteBtn.addEventListener('click', () => {
                if (batchDeleteBtn.classList.contains('active')) {
                    // 如果按钮处于激活状态，执行Delet操作
                    this.batchDeleteTasks();
                } else {
                    // 如果按钮未激活，进入Batch Select模式
                    this.showBatchSelectMode();
                    batchDeleteBtn.classList.add('active');
                }
            });
        }

        // 取消批量Delet按钮
        const cancelSelectBtn = document.getElementById('cancel-select-btn');
        if (cancelSelectBtn) {
            cancelSelectBtn.addEventListener('click', () => {
                this.hideBatchSelectMode();
            });
        }
        
        // Select all按钮
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllTasks();
            });
        }
        
        // 取消Select all按钮
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
        
        // 添加重复times数开关监听
        if (this.elements.enableRepeatCount) {
            this.elements.enableRepeatCount.addEventListener('change', () => {
                this.elements.repeatCountInput.style.display = 
                    this.elements.enableRepeatCount.checked ? 'flex' : 'none';
            });
        }
        
        // 搜索功能
        if (this.elements.ListSearchInput) {
            this.elements.ListSearchInput.addEventListener('input', () => {
                // 显示或隐藏清除按钮
                if (this.elements.ListSearchInput.value) {
                    this.elements.clearSearchBtn.style.display = 'flex';
                } else {
                    this.elements.clearSearchBtn.style.display = 'none';
                }
                this.applyTagFilter();
            });
            
            // 添加回车键搜索功能
            this.elements.ListSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyTagFilter();
                }
            });
        }
        
        // 清除搜索按钮
        if (this.elements.clearSearchBtn) {
            this.elements.clearSearchBtn.addEventListener('click', () => {
                this.elements.ListSearchInput.value = '';
                this.elements.clearSearchBtn.style.display = 'none';
                this.applyTagFilter();
            });
        }
        
        // 折叠功能Things绑定
        this.initFilterCollapse();
    },
    
    /**
     * Set today's date display
     */
    setTodayDate() {
        if (this.elements.todayDate) {
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            this.elements.todayDate.textContent = `Today (${today.toLocaleDateString('en-US', options)})`;
        }
    },
    
    /**
     * 加载任务列表
     * @param {Boolean} refreshPreviews 是否刷新Preview区域，默认为true
     */
    loadTasks(refreshPreviews = true) {
        // 检查任务列表容器是否存在
        if (!this.elements.taskList) {
            console.error('找不到任务列表容器，Empty法加载任务列表');
            return;
        }
        
        // 检查是否有筛选条件
        const selectedTags = Array.from(document.querySelectorAll('.tag-filter-btn.selected')).map(btn => btn.getAttribute('data-tag'));
        const searchQuery = this.elements.ListSearchInput ? this.elements.ListSearchInput.value.trim().toLowerCase() : '';
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const hasFilters = selectedTags.length > 0 || searchQuery.length > 0 || startDate || endDate;
        
        // 清空任务列表Content
        this.elements.taskList.innerHTML = '';
        
        // 只有在没有筛选条件且需要刷新Preview区域时才显示Preview
        if (refreshPreviews && !hasFilters) {
            // 清除所有Preview区域
            this.clearPreviews();
        }
        
        // 获取所有Things
        let events = StorageManager.getEvents();
        
        // 按time分组
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
            // 检查ThingsID是否完整，确保每个Things有唯一标识
            if (!event.id) {
                console.warn('发现没有ID的Things:', event);
                event.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                StorageManager.saveEvent(event);
            }
            
            if (!event.startTime) {
                // 没有开始time的Things默认为今天
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
        
        // 按Completed状态和开始time排序
        const sortEvents = (events) => {
            return events.sort((a, b) => {
                // 优先按照Completed状态排序（未Completed在前）
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                
                // 其times按照开始time排序（早的在前）
                const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
                const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
                return aTime - bTime;
            });
        };
        
        // 对各组Things应用排序
        const sortedPastEvents = sortEvents(pastEvents);
        const sortedYesterdayEvents = sortEvents(yesterdayEvents);
        const sortedTodayEvents = sortEvents(todayEvents);
        const sortedFutureEvents = sortEvents(futureEvents);
        
        // Create date separator function
        const createDateSeparator = (title) => {
            const separator = document.createElement('div');
            separator.className = 'date-separator';
            separator.textContent = title;
            return separator;
        };
        
        // 添加今天的Things
        if (sortedTodayEvents.length > 0) {
            // const todayHeader = createDateSeparator('今天的Things');
            // this.elements.taskList.appendChild(todayHeader);
            
            sortedTodayEvents.forEach(event => {
                this.elements.taskList.appendChild(this.createTaskItem(event));
            });
        } else {
            const emptyToday = document.createElement('div');
            emptyToday.className = 'empty-task-message';
            emptyToday.textContent = 'Nothing to do today';
            this.elements.taskList.appendChild(emptyToday);
        }
        
        // 添加未来的Things
        if (sortedFutureEvents.length > 0) {
            this.elements.taskList.appendChild(createDateSeparator('即将到来'));
            sortedFutureEvents.forEach(event => {
                this.elements.taskList.appendChild(this.createTaskItem(event));
            });
        }
        
        // 添加昨天的Things（默认隐藏）
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
        
        // 添加Earlier的Things（默认隐藏）
        if (sortedPastEvents.length > 0) {
            const pastContainer = document.createElement('div');
            pastContainer.className = 'past-events-container collapsed';
            
            const pastHeader = createDateSeparator('Earlier');
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
        
        // 更新Focus任务Select器
        this.updateFocusTaskSelect();
        
        // 控制批量Delet按钮的显示
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        
        // 计算总Things数
        const totalEvents = events.length;
        
        // 如果没有Things，隐藏所有相关按钮
        if (totalEvents === 0) {
            if (batchDeleteBtn) batchDeleteBtn.style.display = 'none';
            if (selectAllBtn) selectAllBtn.style.display = 'none';
            if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        } else {
            // 如果有Things，显示批量Delet按钮（但默认隐藏Select all/全不选按钮）
            if (batchDeleteBtn) batchDeleteBtn.style.display = 'block';
            if (selectAllBtn) selectAllBtn.style.display = 'none';
            if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        }
        this.initTagFilter(); // 任务渲染后刷新Label筛选区
        
        // 初始化出行贴士显示状态（确保在没有筛选条件时显示）
        this.updateFilterStatus();
        
        // 通知快速导航更新计数
        if (window.QuickNavManager && typeof QuickNavManager.triggerDataUpdate === 'function') {
            QuickNavManager.triggerDataUpdate();
        }
        
        // 渲染完毕后立即high亮正在进行的Things
        if (window.highlightOngoingEvents) {
            window.highlightOngoingEvents();
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
        
        // 绑定复选框点击Things
        taskCheckbox.addEventListener('click', function(e) {
            // 阻止Things冒泡，防止触发任务详情
            e.stopPropagation();
            
            // 防止重复处理同一点击
            if (this.dataset.processing === 'true') return;
            this.dataset.processing = 'true';
            
            // 获取当前任务的精确ID（从数据属性medium获取，而不是从闭包medium）
            const exactTaskId = this.dataset.taskId || this.closest('.task-item').dataset.id;
            
            // 确保ID存在且有效
            if (!exactTaskId) {
                console.error('Empty法获取任务ID');
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
        
        // Batch Select复选框（默认隐藏）
        const batchCheckbox = document.createElement('input');
        batchCheckbox.type = 'checkbox';
        batchCheckbox.className = 'batch-checkbox';
        batchCheckbox.style.display = 'none';
        batchCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
            this.updateBatchDeleteButton();
        });
        
        // 任务Content
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskTitle = document.createElement('div');
        taskTitle.className = 'task-title';
        taskTitle.textContent = task.name;
        
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        
        let infoText = '';
        
        // 显示time
        if (task.startTime) {
            const startTime = new Date(task.startTime);
            infoText += `${this.formatTime(startTime)} `;
            
            if (task.endTime) {
                const endTime = new Date(task.endTime);
                infoText += `- ${this.formatTime(endTime)} `;
            }
        }
        
        // 显示place
        if (task.location) {
            infoText += `@ ${task.location} `;
        }
        
        // 显示Project
        if (task.projectId) {
            const project = StorageManager.getProjects().find(p => p.id === task.projectId);
            if (project) {
                const projectSpan = document.createElement('span');
                projectSpan.className = 'task-project';
                projectSpan.textContent = project.name;
                taskInfo.appendChild(projectSpan);
            }
        }
        
        // 添加Label
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
        
        // 点击任务Content查看详情
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
        editBtn.innerHTML = '<i class="fas fa-edit"></i>Edit';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // 检查是否在Project详情窗口medium
            const isInProjectDetail = document.querySelector('.project-detail-content');
            
            if (isInProjectDetail) {
                // 在Project详情窗口medium：显示Edit提示
                editBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 准备Edit...';
                editBtn.disabled = true;
                
                setTimeout(() => {
                    // 切换到Edit模式
                    this.editEvent(task.id);
                    
                    // CloseProject详情窗口
                    const modal = document.querySelector('.project-detail-content').closest('.modal');
                    if (modal) {
                        document.body.removeChild(modal);
                    }
                    
                    // 显示友好的提示信息
                    UIManager.showNotification(`正在EditThings"${task.name}"，EditCompleted后可Select查看详情`);
                }, 300);
            } else {
                // 在普通列表medium：直接Edit
                this.editEvent(task.id);
            }
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>Delet';
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
     * 切换任务Completed状态
     * @param {String} taskId 任务ID
     */
    toggleTaskCompletion(taskId) {
        // 严格匹配精确ID的任务项，防止Select器匹配到部分ID
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
        
        // 获取当前任务的Completed状态
        const firstTask = taskItems[0];
        const checkbox = firstTask.querySelector('.task-checkbox');
        const isCompleted = checkbox ? checkbox.classList.contains('checked') : false;
        
        // 更新存储medium的任务状态（只更新当前任务，不影响其他重复任务）
        const success = StorageManager.markEventCompleted(taskId, !isCompleted);
        if (!success) {
            console.error(`Empty法更新任务 ${taskId} 的Completed状态`);
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
                    
                    // 在Project详情视图medium添加动画效果
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
        UIManager.showNotification(!isCompleted ? 'Task completed' : 'Task completion cancelled');
        
        // 刷新Project视图 - 确保不会影响到同一天的其他Things
        this.loadProjects();
        
        // 如果任务关联了Project，刷新可能已打开的Project详情模态框
        if (task.projectId) {
            const projectDetailModal = document.querySelector(`#project-detail-modal-${task.projectId}`);
            if (projectDetailModal) {
                const modalContent = projectDetailModal.querySelector('.project-detail-content');
                
                // 延迟刷新Project详情，让动画效果显示
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
        
        // 更新Focus任务Select器
        this.updateFocusTaskSelect();
        
        // 刷新最近任务视图（保持任务Completed状态的独立性）
        setTimeout(() => {
            this.loadTasks();
        }, 50);
    },
    
    /**
     * 格式化time显示
     * @param {Date} date Date object
     * @returns {String} 格式化后的time字符串
     */
    formatTime(date) {
        // Today's date only shows time, other dates show date and time
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
            // Today
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (dateStart.getTime() === tomorrow.getTime()) {
            // Tomorrow
            return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (dateStart >= thisYear) {
            // Other dates this year (without year)
            return date.toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            // Last year or earlier dates (including year)
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    },
    
    /**
     * 保存Things
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
            UIManager.showNotification('Please enter a task name', 'error');
            this.elements.eventName.focus();
            return;
        }
        
        // 验证time
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (end <= start) {
                UIManager.showNotification('End time must be later than start time', 'error');
                this.elements.eventEndTime.focus();
                return;
            }
        }
        
        // 验证重复times数
        if (enableRepeatCount && (repeatCount < 1 || repeatCount > 100)) {
            UIManager.showNotification('Repeat count must be between 1-100', 'error');
            this.elements.eventRepeatCount.focus();
            return;
        }
        
        // 获取Label
        const tags = this.elements.eventTags.value.trim()
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        
        // 创建Things对象
        const event = {
            name,
            startTime: startTime ? new Date(startTime).toISOString() : null,
            endTime: endTime ? new Date(endTime).toISOString() : null,
            reminder,
            location,
            participants: participants.split('、').map(p => p.trim()).filter(p => p),
            color,
            notes,
            completed: false, // 默认未Completed，Edit模式下会被覆盖
            completedTime: null, // 默认EmptyCompletedtime，Edit模式下会被覆盖
            tags,
            repeat: {
                type: repeatType,
                endDate: repeatEndDate ? new Date(repeatEndDate).toISOString() : null,
                count: repeatCount
            }
        };
        
        // 关联Project
        if (projectName) {
            const project = StorageManager.getOrCreateProject(projectName);
            if (project) {
                event.projectId = project.id;
            }
        }
        
        // 检查是否是Edit模式
        if (this.editingEventId) {
            // 获取原Things信息
            const originalEvent = StorageManager.getEvents().find(e => e.id === this.editingEventId);
            
            if (originalEvent) {
                // 保持原Things的Completed状态
                event.completed = originalEvent.completed;
                event.completedTime = originalEvent.completedTime;
                
                // 如果是重复Things，Delet所有相关的重复Things
                if (originalEvent.isRepeatingEvent && originalEvent.originalEventId) {
                    // Delet所有具有相同originalEventId的Things
                    const allEvents = StorageManager.getEvents();
                    allEvents.forEach(e => {
                        if (e.originalEventId === originalEvent.originalEventId) {
                            StorageManager.deleteEvent(e.id);
                        }
                    });
                } else if (originalEvent.repeat && originalEvent.repeat.type !== 'none') {
                    // 如果是原始重复Things，Delet所有相关的重复Things
                    const allEvents = StorageManager.getEvents();
                    allEvents.forEach(e => {
                        if (e.originalEventId === originalEvent.id || e.id === originalEvent.id) {
                            StorageManager.deleteEvent(e.id);
                        }
                    });
                } else {
                    // 普通Things，直接Delet
                    StorageManager.deleteEvent(this.editingEventId);
                }
            }
            
            // Set新Things的ID
            event.id = this.editingEventId;
            const editedEventId = this.editingEventId; // 保存Edit的ThingsID
            this.editingEventId = null;
        }
        
        // 保存Things
        let totalEvents = 0;
        if (repeatType === 'none') {
            StorageManager.saveEvent(event);
            totalEvents = 1;
        } else {
            // 生成重复Things
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
        
        // 刷新Project列表
        this.loadProjects();
        
        // 刷新日历视图
        if (window.CalendarManager) {
            window.CalendarManager.refreshCalendar();
        }
        
        // 显示通知
        if (editedEventId) {
            // Edit模式：显示成功提示并提供查看详情选项
            UIManager.showNotification(`Things"${event.name}"已成功更新！`, 'success');
            
            // 清理Things详情窗口的取消处理函数
            if (window.EventDetailWindow && window.EventDetailWindow.handleCancelEdit) {
                delete window.EventDetailWindow.handleCancelEdit;
            }
            
            // 延迟显示查看详情选项
            setTimeout(() => {
                // 查找更新后的Things
                const updatedEvent = StorageManager.getEvents().find(e => e.id === editedEventId);
                if (updatedEvent) {
                    // 提供多个选项
                    const choice = confirm('EditCompleted！Select操作：\n\n确定 - 查看Things详情\n取消 - 返回任务列表');
                    
                    if (choice) {
                        // 查看Things详情
                        if (window.EventDetailWindow) {
                            window.EventDetailWindow.show(updatedEvent);
                        }
                    } else {
                        // 检查是否需要重新打开Project详情
                        if (updatedEvent.projectId) {
                            const project = StorageManager.getProjects().find(p => p.id === updatedEvent.projectId);
                            if (project) {
                                const reopenProject = confirm(`是否要重新打开Project"${project.name}"的详情窗口？`);
                                if (reopenProject) {
                                    this.showProjectDetails(project);
                                    return;
                                }
                            }
                        }
                        
                        // 切换到Soon视图
                        UIManager.switchView('recent-tasks');
                    }
                } else {
                    // 切换到Soon视图
                    UIManager.switchView('recent-tasks');
                }
            }, 500);
        } else {
            // New模式：显示成功提示并切换到Soon视图
            UIManager.showNotification(`成功保存 ${totalEvents} 个Things`, 'success');
            UIManager.switchView('recent-tasks');
        }
    },
    
    /**
     * 生成重复Things
     * @param {Object} event 原始Things
     * @returns {Array} 重复Things数组
     */
    generateRepeatEvents(event) {
        const events = [];
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        const repeatEndDate = event.repeat.endDate ? new Date(event.repeat.endDate) : null;
        
        // 计算time差（毫秒）
        const duration = endDate.getTime() - startDate.getTime();
        
        // 确保原Things有ID，使用time戳加随机字符创建基础ID
        const baseId = event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 根据重复类型生成Things
        let currentDate = new Date(startDate);
        let count = 0;
        const maxEvents = event.repeat.count || 100;
        
        while (count < maxEvents) {
            // Check if past end date
            if (repeatEndDate && currentDate > repeatEndDate) {
                break;
            }
            
            // 创建新Things，使用一个更明确的ID格式
            const newEvent = {
                ...event,
                id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                startTime: new Date(currentDate).toISOString(),
                endTime: new Date(currentDate.getTime() + duration).toISOString(),
                originalEventId: baseId, // 记录原始ThingsID
                repeatIndex: count, // 添加重复索引便于排序和识别
                isRepeatingEvent: true, // 标记为重复Things
                // 确保ProjectID保持一致
                projectId: event.projectId,
                // 保持Completed状态
                completed: event.completed,
                completedTime: event.completedTime,
                repeat: {
                    ...event.repeat,
                    originalEventId: baseId // 在重复Setmedium也记录原始ThingsID
                }
            };
            
            events.push(newEvent);
            
            // Update date based on repeat type
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
     * EditThings
     * @param {String} eventId ThingsID
     */
    editEvent(eventId) {
        const event = StorageManager.getEvents().find(e => e.id === eventId);
        if (!event) return;
        
        // Set表单数据
        this.elements.eventName.value = event.name || '';
        
        // SetProject
        if (event.projectId) {
            const project = StorageManager.getProjects().find(p => p.id === event.projectId);
            if (project) {
                this.elements.eventProject.value = project.name;
            }
        } else {
            this.elements.eventProject.value = '';
        }
        
        // Settime
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
        
        // Set重复选项
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
            
            // Set重复times数
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
        
        // SetLabel
        this.elements.eventTags.value = event.tags ? event.tags.join(', ') : '';
        
        // SetEdit模式
        this.editingEventId = event.id;
        
        // 切换到New视图
        UIManager.switchView('create');
        
        // 延迟切换到传统NewLabel
        setTimeout(() => {
            if (window.UIManager && window.UIManager.switchCreateTab) {
                window.UIManager.switchCreateTab('traditional-create');
            }
            
            // 显示Edit模式提示
            UIManager.showNotification(`正在EditThings"${event.name}"，修改Completed后点击保存即可`);
        }, 100);
    },
    
    /**
     * DeletThings
     * @param {String} eventId ThingsID
     */
    deleteEvent(eventId) {
        // 获取Things信息
        const event = StorageManager.getEvents().find(e => e.id === eventId);
        if (!event) return;

        // DeletThings
        StorageManager.deleteEvent(eventId);
        
        // 刷新任务列表
        this.loadTasks();
        
        // 刷新Project列表
        this.loadProjects();
        
        // 刷新日历视图
        if (window.CalendarManager) {
            window.CalendarManager.refreshCalendar();
        }
        
        // Close详情模态框
        UIManager.closeModal(this.elements.eventDetailsModal);
        
        // 显示通知
        UIManager.showNotification('Things已Delet');
    },
    
    /**
     * 重置Things表单
     */
    resetEventForm() {
        if (!this.elements.taskForm) return;
        
        this.elements.taskForm.reset();
        this.editingEventId = null;
        
        // Set默认颜色
        this.elements.eventColor.value = '#4285f4';
        
        // 重置Label输入框
        this.elements.eventTags.value = '';
    },
    
    /**
     * 打开地图Select器
     */
    openMapPicker() {
        UIManager.showNotification('The Map Select function is not yet implemented');
        // 地图Select功能将在后续版本实现
    },
    
    /**
     * 导入Things
     */
    importEvents() {
        const file = this.elements.importFile.files[0];
        if (!file) {
            UIManager.showNotification('请Select文件');
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
                // 刷新任务和Project列表
                this.loadTasks();
                this.loadProjects();
                
                // 刷新日历视图
                if (window.CalendarManager) {
                    window.CalendarManager.refreshCalendar();
                }
                
                UIManager.showNotification(`成功导入 ${result.count} 个Things`);
                
                // 重置导入表单
                this.elements.importFile.value = '';
                
                // 切换到Soon视图
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
            UIManager.showNotification('请Select CSV 或 ICS 文件');
        }
    },
    
    /**
     * 加载Project列表
     */
    loadProjects() {
        // 检查Project容器是否存在
        if (!this.elements.projectsContainer) {
            console.warn('Project容器不存在，Empty法加载Project');
            return;
        }
        
        // 清空Project容器
        this.elements.projectsContainer.innerHTML = '';
        
        // 获取Project列表
        const projects = StorageManager.getProjects();
        
        // 如果没有Project，显示空状态
        if (projects.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-projects-message';
            emptyState.innerHTML = `
                <div class="empty-icon">📋</div>
                <h3>Empty</h3>
                <p>Create a new Project in the New view</p>
                <button class="create-project-btn">New project </button>
            `;
            
            // 添加创建Project按钮的点击Things
            const createBtn = emptyState.querySelector('.create-project-btn');
            createBtn.addEventListener('click', () => {
                UIManager.switchView('create');
            });
            
            this.elements.projectsContainer.appendChild(emptyState);
            return;
        }
        
        projects.forEach(project => {
            const stats = StorageManager.getProjectStats(project.id);
            
            // 获取Projectmedium的所有Things
            const projectEvents = StorageManager.getEvents({ projectId: project.id });
            let lastEventDate = '暂EmptyThings';
            let lastEventEndTime = null;
            let deadlineDate = project.deadline || null;
            let daysLeft = null;
            
            if (projectEvents && projectEvents.length > 0) {
                // 查找最后结束的Things（按结束time排序）
                const sortedByEndTime = [...projectEvents].sort((a, b) => {
                    // 如果没有结束time，则使用开始time
                    const aEndTime = a.endTime || a.startTime;
                    const bEndTime = b.endTime || b.startTime;
                    
                    if (!aEndTime && !bEndTime) return 0;
                    if (!aEndTime) return -1;
                    if (!bEndTime) return 1;
                    
                    return new Date(bEndTime) - new Date(aEndTime);
                });
                
                // 查找最近的Things（按开始time排序）
                const sortedByStartTime = [...projectEvents].sort((a, b) => {
                    if (!a.startTime && !b.startTime) return 0;
                    if (!a.startTime) return -1;
                    if (!b.startTime) return 1;
                    return new Date(b.startTime) - new Date(a.startTime);
                });
                
                // Use the most recent Things date display
                if (sortedByStartTime[0].startTime) {
                    const date = new Date(sortedByStartTime[0].startTime);
                    lastEventDate = date.toLocaleDateString('en-US');
                }
                
                // 如果存在结束time最晚的Things，将其设为Project截止time
                if (sortedByEndTime[0] && (sortedByEndTime[0].endTime || sortedByEndTime[0].startTime)) {
                    lastEventEndTime = sortedByEndTime[0].endTime || sortedByEndTime[0].startTime;
                    
                    // If Project has no due date set, or auto-update due date is selected
                    if (!deadlineDate || project.autoUpdateDeadline) {
                        // 将最后Things结束time设为截止日期
                        deadlineDate = lastEventEndTime;
                        
                        // 更新Project信息
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
            
            // 计算Project截止日期倒数
            if (deadlineDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const deadline = new Date(deadlineDate);
                deadline.setHours(0, 0, 0, 0);
                
                const timeDiff = deadline.getTime() - today.getTime();
                daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            }
            
            // 创建Project卡片
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
                        <span>Recent Things: ${lastEventDate}</span>
                    </div>
                    ${deadlineDate ? `
                    <div class="deadline-countdown ${daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'urgent' : ''}">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${daysLeft < 0 ? 'Overdue' + Math.abs(daysLeft) + 'day' : 
                               daysLeft === 0 ? 'Deadline today' : 
                               'Remaining' + daysLeft + 'days'}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="project-stats">
                    <span>General mission: ${stats.total}</span>
                    <span>Completed: ${stats.completed}</span>
                    <span>Uncompleted: ${stats.uncompleted}</span>
                </div>
                <div class="project-buttons">
                    <button class="details-btn">View details</button>
                    <button class="delete-btn"><i class="fas fa-trash"></i>Delet</button>
                    <button class="share-btn"><i class="fas fa-share-alt"></i>Share</button>
                </div>
            `;
            
            // 添加Things监听器
            const detailsBtn = projectCard.querySelector('.details-btn');
            detailsBtn.addEventListener('click', () => {
                this.showProjectDetails(project);
            });
            
            // Delet按钮
            const deleteBtn = projectCard.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 确认Delet
                if (confirm(`Are you sure you want to DeletProject "${project.name}"? All associated Things will also be removed.`)) {
                    // DeletProject及关联Things
                    StorageManager.deleteProject(project.id);
                    // 重新加载Project列表
                    this.loadProjects();
                    // 重新加载任务列表
                    this.loadTasks();
                }
            });
            
            // Share按钮Things
            const shareBtn = projectCard.querySelector('.share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                    const projectEvents = StorageManager.getEvents({ projectId: project.id });
                    let shareText = `📋【Project】${project.name}\n`;
                    shareText += `📈 Progress:${stats.progress}%\n`;
                    shareText += `📝 General Mission:${stats.total}   ✅ Completed：${stats.completed}   ⏳ Incomplete：${stats.uncompleted}\n`;
                    if (deadlineDate) {
                        shareText += `⏰ Deadline:${new Date(deadlineDate).toLocaleDateString('en-US')}\n`;
                    }
                    shareText += `-----------------------------\n`;
                    if (projectEvents && projectEvents.length > 0) {
                        projectEvents.forEach((event, idx) => {
                            const status = event.completed ? '✅ Completed' : '⏳ 未Completed';
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
                        shareText += '（Temporary Empty Mission）\n';
                    }
                    shareText += `-----------------------------\n`;
                    shareText += `🎉 By Treege for Desktop`;
                    // Copy到剪贴板
                    const showShareTip = () => {
                        if (window.UIManager && typeof UIManager.showNotification === 'function') {
                            UIManager.showNotification('Project information has been copied and can be pasted into WeChat/QQ, etc', 3000);
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
                            notification.textContent = 'Project information has been copied and can be pasted into WeChat/QQ, etc';
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
                            alert('`Copy failed, please copy manually`');
                        }
                        document.body.removeChild(textarea);
                    }
                });
            }
            
            // 将Project卡片添加到容器
            this.elements.projectsContainer.appendChild(projectCard);
        });
    },
    
    /**
     * 显示Project详情
     * @param {Object} project Project对象
     */
    showProjectDetails(project) {
        // 创建Project详情模态框
        const modal = document.createElement('div');
        modal.className = 'modal open';
        modal.id = `project-detail-modal-${project.id}`;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content project-detail-content';
        
        // Title和Close按钮
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = `Project: ${project.name}`;
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
        // Share按钮
        const shareBtn = document.createElement('button');
        shareBtn.className = 'modal-share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
        shareBtn.style.marginLeft = '12px';
        shareBtn.addEventListener('click', () => {
            const stats = StorageManager.getProjectStats(project.id);
            const projectEvents = StorageManager.getEvents({ projectId: project.id });
            let shareText = `📋【Project】${project.name}\n`;
            shareText += `📈 Progress：${stats.progress}%\n`;
            shareText += `📝 General mission：${stats.total}   ✅ Completed：${stats.completed}   ⏳ Incomplete：${stats.uncompleted}\n`;
            if (project.deadline) {
                shareText += `⏰ Deadline：${new Date(project.deadline).toLocaleDateString('en-US')}\n`;
            }
            shareText += `-----------------------------\n`;
            if (projectEvents && projectEvents.length > 0) {
                projectEvents.forEach((event, idx) => {
                    const status = event.completed ? '✅ Completed' : '⏳ Incomplete';
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
                shareText += '（Temporary Empty Mission）\n';
            }
            shareText += `-----------------------------\n`;
            shareText += `🎉 By Treege for Desktop`;
            // Copy到剪贴板
            const showShareTip = () => {
                if (window.UIManager && typeof UIManager.showNotification === 'function') {
                    UIManager.showNotification('Project information has been copied and can be pasted into WeChat/QQ, etc', 3000);
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
                    notification.textContent = 'Project information has been copied and can be pasted into WeChat/QQ, etc';
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
                    alert('If the copy fails, please copy it manually');
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
        
        // 创建Content容器，后续会动态填充
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'project-details-container';
        modalContent.appendChild(detailsContainer);
        
        // 首times加载Project详情
        this.loadProjectDetailsContent(project, detailsContainer);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // 绑定自动刷新功能
        const autoRefreshToggle = document.getElementById(`auto-refresh-${project.id}`);
        autoRefreshToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                // 开启自动刷新，每10秒刷新一times
                modal.refreshInterval = setInterval(() => {
                    this.refreshProjectDetails(project, modalContent);
                }, 10000);
                
                // 显示提示
                UIManager.showNotification('Auto-refresh is turned on (10-second interval)');
            } else {
                // Close自动刷新
                if (modal.refreshInterval) {
                    clearInterval(modal.refreshInterval);
                    modal.refreshInterval = null;
                }
                UIManager.showNotification('Auto-refresh is turned off');
            }
        });
    },
    
    /**
     * 刷新Project详情
     * @param {Object} project Project对象
     * @param {HTMLElement} modalContent 模态框Content容器
     */
    refreshProjectDetails(project, modalContent) {
        // 获取最新的Project信息
        const updatedProject = StorageManager.getProjects().find(p => p.id === project.id);
        if (!updatedProject) {
            UIManager.showNotification('Project does not exist or has been deleted', 'error');
            return;
        }
        
        // 获取Content容器
        const detailsContainer = modalContent.querySelector('.project-details-container');
        if (!detailsContainer) return;
        
        // 清空现有Content
        detailsContainer.innerHTML = '';
        
        // 加载最新Content
        this.loadProjectDetailsContent(updatedProject, detailsContainer);
        
        // 显示刷新成功提示（可选）
        const timestamp = document.createElement('div');
        timestamp.className = 'refresh-timestamp';
        timestamp.textContent = `Last time refreshed: ${new Date().toLocaleTimeString()}`;
        timestamp.style.fontSize = '0.8rem';
        timestamp.style.color = '#888';
        timestamp.style.textAlign = 'right';
        timestamp.style.marginTop = '10px';
        
        // 添加到详情容器底部
        detailsContainer.appendChild(timestamp);
    },
    
    /**
     * 加载Project详情Content
     * @param {Object} project Project对象
     * @param {HTMLElement} container Content容器
     */
    loadProjectDetailsContent(project, container) {
        // 获取Project下的所有Things
        const events = StorageManager.getEvents({ projectId: project.id });
        
        // 进度信息
        const stats = StorageManager.getProjectStats(project.id);
        
        const progressInfo = document.createElement('div');
        progressInfo.className = 'project-progress-info';
        progressInfo.innerHTML = `
            <div class="project-stat">Total Tasks:${stats.total}</div>
            <div class="project-stat">Completed: ${stats.completed}</div>
            <div class="project-stat">Progress:${stats.progress}%</div>
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
            const deadlineText = daysLeft < 0 ? `${Math.abs(daysLeft)} days have expired` : 
                                daysLeft === 0 ? 'Deadline today' : 
                                `${daysLeft} days remaining`;
            
            deadlineInfo.innerHTML = `
                <div class="deadline-info ${deadlineStatus}">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Deadline: ${deadline.toLocaleDateString('en-US')}</span>
                    <span class="deadline-countdown">${deadlineText}</span>
                </div>
            `;
            
            container.appendChild(deadlineInfo);
        }
        
        container.appendChild(progressInfo);
        
        // 创建Completed Things的自动处理开关
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
        
        // 保存自动CompletedSet
        toggleInput.addEventListener('change', () => {
            localStorage.setItem(`auto-complete-${project.id}`, toggleInput.checked);
            // 立即应用Set
            if (toggleInput.checked) {
                UIManager.showNotification('已开启自动Completed处理');
                // 刷新视图以应用Set
                this.refreshProjectDetails(project, toggleInput.closest('.modal-content'));
            } else {
                UIManager.showNotification('已Close自动Completed处理');
            }
        });
        
        // Things列表
        const eventsList = document.createElement('div');
        eventsList.className = 'project-events-List';
        
        // 按状态分组
        const incompleteEvents = events.filter(e => !e.completed);
        const completedEvents = events.filter(e => e.completed);
        
        // Unfinished Things
        if (incompleteEvents.length > 0) {
            const incompleteHeader = document.createElement('h4');
            incompleteHeader.textContent = 'Unfinished Things';
            eventsList.appendChild(incompleteHeader);
            
            incompleteEvents.forEach(event => {
                const taskItem = this.createTaskItem(event);
                
                // 添加任务Completed状态变更的Things监听
                const taskCheckbox = taskItem.querySelector('.task-checkbox');
                if (taskCheckbox) {
                    // 确保复选框有任务ID引用
                    taskCheckbox.dataset.taskId = event.id;
                    
                    // 移除现有Things监听，避免重复绑定
                    const newCheckbox = taskCheckbox.cloneNode(true);
                    taskCheckbox.replaceWith(newCheckbox);
                    
                    // 保存对TaskManager的引用
                    const self = this;
                    
                    // 绑定新的Things监听，确保使用精确ID
                    newCheckbox.addEventListener('click', function(e) {
                        // 防止Things冒泡
                        e.stopPropagation();
                        
                        // 阻止重复处理
                        if (this.dataset.processing === 'true') return;
                        this.dataset.processing = 'true';
                        
                        // 获取当前任务项的精确ID（直接从数据属性获取）
                        const exactTaskId = this.dataset.taskId || this.closest('.task-item').dataset.id;
                        
                        // 确保ID存在且有效
                        if (!exactTaskId) {
                            console.error('Failed to get task ID');
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
        
        // Completed Things
        if (completedEvents.length > 0) {
            const completedHeader = document.createElement('h4');
            completedHeader.textContent = 'Completed Things';
            eventsList.appendChild(completedHeader);
            
            // 创建折叠按钮
            const collapseBtn = document.createElement('button');
            collapseBtn.className = 'collapse-completed-btn';
            collapseBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            collapseBtn.style.background = 'none';
            collapseBtn.style.border = 'none';
            collapseBtn.style.marginLeft = '10px';
            collapseBtn.style.cursor = 'pointer';
            collapseBtn.title = '`Show/Hide Completed Things`';
            
            // 添加到Completed ThingsTitle旁
            completedHeader.appendChild(collapseBtn);
            
            // 创建Completed Things容器
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
            
            // 添加Completed Things
            completedEvents.forEach(event => {
                const taskItem = this.createTaskItem(event);
                
                // 添加任务Completed状态变更的Things监听
                const taskCheckbox = taskItem.querySelector('.task-checkbox');
                if (taskCheckbox) {
                    // 移除现有Things监听，避免重复绑定
                    const newCheckbox = taskCheckbox.cloneNode(true);
                    taskCheckbox.replaceWith(newCheckbox);
                    const updatedCheckbox = taskItem.querySelector('.task-checkbox');
                    
                    // 保存对TaskManager的引用
                    const self = this;
                    
                    // 绑定新的Things监听，确保使用精确ID
                    updatedCheckbox.addEventListener('click', function(e) {
                        // 防止Things冒泡
                        e.stopPropagation();
                        
                        // 阻止重复处理
                        if (this.dataset.processing === 'true') return;
                        this.dataset.processing = 'true';
                        
                        // 获取当前任务项的精确ID
                        const exactTaskId = this.closest('.task-item').dataset.id;
                        
                        // 确保ID存在且有效
                        if (!exactTaskId) {
                            console.error('Failed to get task ID');
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
        
        // 如果没有Things，显示提示信息
        if (events.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-events-message';
            emptyMessage.innerHTML = `
                <div class="empty-icon">📅</div>
                <p>No tasks in this project yet</p>
                <button class="add-event-btn">Create new task</button>
            `;
            
            // 添加创建Things按钮的点击Things
            const addEventBtn = emptyMessage.querySelector('.add-event-btn');
            addEventBtn.addEventListener('click', () => {
                // 显示加载状态
                const originalText = addEventBtn.textContent;
                addEventBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing to create...';
                addEventBtn.disabled = true;
                
                // 延迟执行，给用户视觉反馈
                setTimeout(() => {
                    // 切换到创建视图
                    UIManager.switchView('create');
                    
                    // Close模态框
                    const modal = document.querySelector(`#project-detail-modal-${project.id}`);
                    if (modal) {
                        document.body.removeChild(modal);
                    }
                    
                    // SelectProject下拉框
                    const projectSelect = document.getElementById('event-project');
                    if (projectSelect) {
                        projectSelect.value = project.name;
                    }
                    
                    // 显示友好的提示信息
                    UIManager.showNotification(`正在为Project"${project.name}"创建新Things`);
                }, 300);
            });
            
            eventsList.appendChild(emptyMessage);
        }
        
        container.appendChild(eventsList);
    },
    
    /**
     * 更新Focus任务Select器
     */
    updateFocusTaskSelect() {
        if (!this.elements.focusTask) return;
        
        // 清空Select器
        this.elements.focusTask.innerHTML = '<option value="">Select任务</option>';
        
        // 获取未Completed的任务
        const incompleteTasks = StorageManager.getEvents({ completed: false });
        
        // 按time排序
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
            
            // 添加time信息
            if (task.startTime) {
                const startDate = new Date(task.startTime);
                optionText += ` (${this.formatTime(startDate)})`;
            }
            
            option.textContent = optionText;
            this.elements.focusTask.appendChild(option);
        });
    },
    
    /**
     * 从文本导入Things
     */
    importFromText() {
        const text = this.elements.importText.value.trim();
        if (!text) {
            UIManager.showNotification('Please enter text to import', 'error');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        const events = [];
        const errors = [];

        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length < 2) {
                errors.push(`Line ${index + 1}: Format error, task name and start time are required`);
                return;
            }

            try {
                // 解析日期time
                const parseDateTime = (dateTimeStr) => {
                    if (!dateTimeStr) return null;
                    const date = new Date(dateTimeStr);
                    if (isNaN(date.getTime())) {
                        throw new Error('Date time format empty effect');
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

                // 处理Project字段
                if (parts[6]) {
                    const project = StorageManager.getOrCreateProject(parts[6]);
                    if (project) {
                        event.projectId = project.id;
                    }
                }

                // 处理重复Set
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

                        // 解析重复times数
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
                    throw new Error('Task name cannot be empty');
                }
                if (!event.startTime) {
                    throw new Error('Start time cannot be empty');
                }

                // 验证time
                if (event.startTime && event.endTime) {
                    const start = new Date(event.startTime);
                    const end = new Date(event.endTime);
                    if (end <= start) {
                        throw new Error('End time must be later than start time');
                    }
                }

                // 验证重复Set
                if (event.repeat && event.repeat.type !== 'none') {
                    if (event.repeat.endDate) {
                        const start = new Date(event.startTime);
                        const end = new Date(event.repeat.endDate);
                        if (end <= start) {
                            throw new Error('Repeat end date must be later than start time');
                        }
                    }
                }

                events.push(event);
            } catch (e) {
                errors.push(`Line ${index + 1}: ${e.message}`);
            }
        });

        if (errors.length > 0) {
            UIManager.showNotification(`Import error:\n${errors.join('\n')}`, 'error');
            return;
        }

        // 保存所有Things
        try {
            let totalEvents = 0;
            events.forEach(event => {
                if (event.repeat && event.repeat.type !== 'none') {
                    // 生成重复Things
                    const repeatEvents = this.generateRepeatEvents(event);
                    repeatEvents.forEach(e => {
                        // 为每个重复Things生成新的唯一ID，但保持相同的ProjectID
                        e.id = 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        // 确保ProjectID保持一致
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
            
            // 刷新Project列表
            this.loadProjects();
            
            // 刷新日历视图
            if (window.CalendarManager) {
                window.CalendarManager.refreshCalendar();
            }

            UIManager.showNotification(`Successfully imported ${totalEvents} tasks`, 'success');
            
            // 切换到Soon视图
            UIManager.switchView('recent-tasks');
        } catch (error) {
            UIManager.showNotification(`Error saving tasks: ${error.message}`, 'error');
        }
    },
    
    /**
     * 初始化Things监听器
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
        
        // 添加重复times数开关监听
        if (this.elements.enableRepeatCount) {
            this.elements.enableRepeatCount.addEventListener('change', () => {
                this.elements.repeatCountInput.style.display = 
                    this.elements.enableRepeatCount.checked ? 'flex' : 'none';
            });
        }
    },

    /**
     * 更新批量Delet按钮状态
     */
    updateBatchDeleteButton() {
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        if (!batchDeleteBtn || !selectAllBtn || !deselectAllBtn) return;
        
        const checkedBoxes = document.querySelectorAll('.batch-checkbox:checked');
        const allCheckboxes = document.querySelectorAll('.batch-checkbox');
        
        // 更新Select all/全不选按钮状态
        selectAllBtn.style.display = checkedBoxes.length < allCheckboxes.length ? 'block' : 'none';
        deselectAllBtn.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
        
        // 更新批量Delet按钮状态
        batchDeleteBtn.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
    },
    
    /**
     * 显示Batch Select模式
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
        
        // 显示Select all/全不选/Cancel Select按钮
        if (selectAllBtn) selectAllBtn.style.display = 'block';
        if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        if (cancelSelectBtn) cancelSelectBtn.style.display = 'block';
        
        // 更新批量Delet按钮状态
        this.updateBatchDeleteButton();
    },
    
    /**
     * 隐藏Batch Select模式
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
        
        // 隐藏Select all/全不选/Cancel Select按钮
        if (selectAllBtn) selectAllBtn.style.display = 'none';
        if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        if (cancelSelectBtn) cancelSelectBtn.style.display = 'none';
        
        // 重置批量Delet按钮状态
        if (batchDeleteBtn) {
            batchDeleteBtn.classList.remove('active');
            batchDeleteBtn.style.display = 'block';
        }
    },
    
    /**
     * Select all所有任务
     */
    selectAllTasks() {
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        batchCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updateBatchDeleteButton();
    },
    
    /**
     * 取消Select all
     */
    deselectAllTasks() {
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        batchCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateBatchDeleteButton();
    },
    
    
    /**
     * 批量Delet选medium的任务
     */
    batchDeleteTasks() {
        const checkedBoxes = document.querySelectorAll('.batch-checkbox:checked');
        if (checkedBoxes.length === 0) return;
        
        checkedBoxes.forEach(checkbox => {
            const taskItem = checkbox.closest('.task-item');
            const taskId = taskItem.dataset.id;
            this.deleteEvent(taskId);
        });
        
        // 隐藏Batch Select模式
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
        
        // 获取所有Things
        const events = StorageManager.getEvents();
        
        // 筛选匹配的Things
        const matchedEvents = events.filter(event => {
            // 匹配Things名称
            if (event.name && event.name.toLowerCase().includes(query)) {
                return true;
            }
            
            // 匹配Things描述
            if (event.description && event.description.toLowerCase().includes(query)) {
                return true;
            }
            
            // 匹配Thingsplace
            if (event.location && event.location.toLowerCase().includes(query)) {
                return true;
            }
            
            // 匹配ThingsLabel
            if (event.tags && Array.isArray(event.tags)) {
                return event.tags.some(tag => tag.toLowerCase().includes(query));
            }
            
            return false;
        });
        
        // 清空任务列表
        if (this.elements.taskList) {
            this.elements.taskList.innerHTML = '';
        }
        
        // 如果没有找到匹配的Things，显示提示
        if (matchedEvents.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-task-message';
            emptyMessage.textContent = `未找到匹配 "${query}" 的Things`;
            this.elements.taskList.appendChild(emptyMessage);
            return;
        }
        
        // 显示搜索结果数量
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'date-header';
        resultsHeader.innerHTML = `<h3>搜索结果: 找到 ${matchedEvents.length} 个匹配项</h3>`;
        this.elements.taskList.appendChild(resultsHeader);
        
        // 显示匹配的Things
        matchedEvents.forEach(event => {
            const taskItem = this.createTaskItem(event);
            taskItem.classList.add('search-match');
            this.elements.taskList.appendChild(taskItem);
        });
    },
    
    /**
     * 添加List简版显示
     */
    addTodoListPreview() {
        // 检查页面medium是否已存在ListPreview，避免重复
        if (document.querySelector('.todoList-preview')) {
            return;
        }
        
        const data = StorageManager.getData();
        
        if (!data.Lists || data.Lists.length === 0) return;
        
        // 创建ListPreview区域
        const todoListPreview = document.createElement('div');
        todoListPreview.className = 'preview-section todoList-preview';
        
        // 创建Title（可点击折叠）
        const todoListHeader = document.createElement('div');
        todoListHeader.className = 'date-header collapsible collapsed';
        todoListHeader.innerHTML = `
            <h3><i class="fas fa-tasks"></i> 最近List</h3>
            <span class="collapse-icon"><i class="fas fa-chevron-right"></i></span>
        `;
        
        // 创建Content容器（可折叠）
        const todoListContent = document.createElement('div');
        todoListContent.className = 'collapsible-content collapsed';
        
        // 添加折叠/Expand功能
        todoListHeader.addEventListener('click', () => {
            todoListHeader.classList.toggle('collapsed');
            todoListContent.classList.toggle('collapsed');
            const icon = todoListHeader.querySelector('.collapse-icon i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-right');
        });
        
        // 筛选出有事项的List
        const ListsWithItems = data.Lists.filter(List => List.items && List.items.length > 0);
        
        // 如果没有含事项的List，则不显示Preview
        if (ListsWithItems.length === 0) return;
        
        const ListPreviewContainer = document.createElement('div');
        ListPreviewContainer.className = 'preview-container';
        
        // 最多显示3个List
        const previewLists = ListsWithItems.slice(0, 3);
        
        previewLists.forEach(List => {
            const ListPreview = document.createElement('div');
            ListPreview.className = 'preview-item todo-preview';
            
            // 显示List名称和有多少项
            const itemCount = List.items ? List.items.length : 0;
            const completedCount = List.items ? List.items.filter(item => item.completed).length : 0;
            const incompleteCount = itemCount - completedCount;
            
            // 添加颜色指示器和进度条
            const colorIndicator = incompleteCount > 0 ? (incompleteCount > itemCount/2 ? 'high' : 'medium') : 'low';
            const progressPercent = itemCount > 0 ? Math.round((completedCount / itemCount) * 100) : 100;
            
            ListPreview.innerHTML = `
                <div class="preview-header">
                    <div class="preview-title">
                        <i class="fas fa-List-ul"></i> ${List.name} 
                        <span class="priority-tag priority-${colorIndicator}">${incompleteCount} pending</span>
                    </div>
                    <div class="preview-progress-container">
                        <div class="preview-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="preview-info">Completion: ${progressPercent}% (${completedCount}/${itemCount})</div>
                </div>
                <div class="preview-items">
                    ${this.getTodoListPreviewItems(List)}
                </div>
                <div class="preview-actions">
                    <button class="view-more-btn"><i class="fas fa-eye"></i> View details</button>
                    <button class="quick-add-btn" data-List-id="${List.id}"><i class="fas fa-plus"></i> Quick add</button>
                </div>
            `;
            
            // 为查看详情按钮添加Things
            const viewMoreBtn = ListPreview.querySelector('.view-more-btn');
            viewMoreBtn.addEventListener('click', () => {
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('todoList');
                    if (window.TodoListManager && typeof TodoListManager.selectList === 'function') {
                        setTimeout(() => {
                            TodoListManager.selectList(List.id);
                        }, 100);
                    }
                }
            });
            
            // 为快速添加按钮添加Things
            const quickAddBtn = ListPreview.querySelector('.quick-add-btn');
            quickAddBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const ListId = quickAddBtn.getAttribute('data-List-id');
                this.showQuickAddDialog(ListId);
            });
            
            ListPreviewContainer.appendChild(ListPreview);
        });
        
        // 如果有更多List，显示"查看更多"
        if (ListsWithItems.length > 3) {
            const viewMorePreview = document.createElement('div');
            viewMorePreview.className = 'preview-more';
            viewMorePreview.innerHTML = `
                <button class="view-all-btn"><i class="fas fa-List-alt"></i> View all ${ListsWithItems.length} lists</button>
            `;
            
            // 为查看全部按钮添加Things
            const viewAllBtn = viewMorePreview.querySelector('.view-all-btn');
            viewAllBtn.addEventListener('click', () => {
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('todoList');
                }
            });
            
            ListPreviewContainer.appendChild(viewMorePreview);
        }
        
        todoListContent.appendChild(ListPreviewContainer);
        todoListPreview.appendChild(todoListHeader);
        todoListPreview.appendChild(todoListContent);
        
        // 查找任务列表容器
        const taskList = this.elements.taskList;
        if (!taskList) {
            console.error('Task list container not found, unable to add list preview');
            return;
        }
        
        // 查找天气容器
        const weatherContainer = document.querySelector('.weather-tips-container');
        if (weatherContainer && weatherContainer.parentNode) {
            // 将ListPreview插入到天气容器后面
            weatherContainer.parentNode.insertBefore(todoListPreview, weatherContainer.nextSibling);
        } else {
            // 如果找不到天气容器，则添加到任务列表开头
            if (taskList.firstChild) {
                taskList.insertBefore(todoListPreview, taskList.firstChild);
            } else {
                taskList.appendChild(todoListPreview);
            }
        }
    },
    
    /**
     * 获取ListPreviewProject
     * @param {Object} List List对象
     * @returns {string} PreviewProjectHTML
     */
    getTodoListPreviewItems(List) {
        if (!List.items || List.items.length === 0) {
            return '<div class="empty-preview">No items yet</div>';
        }
        
        // 按是否Completed排序，同时按优先级和截止日期排序
        const sortedItems = [...List.items].sort((a, b) => {
            // 首先按照Completed状态排序
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // 如果都是未Completed的，优先按重要度排序
            if (!a.completed && !b.completed) {
                // 获取重要度优先级，同时处理medium文和英文格式
                const getPriorityValue = (priority) => {
                    if (!priority) return 0;
                    if (priority === 'high' || priority === 'high') return 3;
                    if (priority === 'medium' || priority === 'medium') return 2;
                    if (priority === 'low' || priority === '低') return 1;
                    return 0;
                };
                
                const aPriority = getPriorityValue(a.priority);
                const bPriority = getPriorityValue(b.priority);
                
                // high优先级排在前面
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
        
        // 显示前3个Project（增加显示数量）
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
                let dueText = `Due in ${diffDays} days`;
                
                if (diffDays < 0) {
                    dueClass = 'due-overdue';
                    dueText = `Overdue by ${Math.abs(diffDays)} days`;
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
                // 处理优先级，支持medium文和英文格式
                let priorityClass = '';
                let priorityIcon = '';
                let priorityText = '';
                
                // 统一处理各种可能的优先级值格式
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
    
    /**
     * 显示快速添加Project对话框
     * @param {string} ListId ListID
     */
    showQuickAddDialog(ListId) {
        // 查找或创建对话框
        let quickAddDialog = document.getElementById('quick-add-dialog');
        if (!quickAddDialog) {
            quickAddDialog = document.createElement('div');
            quickAddDialog.id = 'quick-add-dialog';
            quickAddDialog.className = 'modal';
            document.body.appendChild(quickAddDialog);
        }
        
        // 获取List信息
        const data = StorageManager.getData();
        const List = data.Lists.find(l => l.id === ListId);
        if (!List) return;
        
        // Set对话框Content
        quickAddDialog.innerHTML = `
            <div class="modal-content quick-add-modal">
                <div class="modal-header">
                    <h3>添加Project到"${List.name}"</h3>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <input type="text" id="quick-add-item-title" placeholder="输入ProjectTitle" class="quick-add-input">
                    <div class="quick-add-options">
                        <div class="quick-add-option">
                            <label for="quick-add-due-date">Due Date</label>
                            <input type="date" id="quick-add-due-date">
                        </div>
                        <div class="quick-add-option">
                            <label for="quick-add-priority">重要度</label>
                            <select id="quick-add-priority" class="quick-add-select">
                                <option value="">Empty</option>
                                <option value="low">低</option>
                                <option value="medium">medium</option>
                                <option value="high">high</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="quick-add-save-btn" class="primary-btn" data-List-id="${ListId}">添加</button>
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
        
        // 添加Things处理
        const closeBtn = quickAddDialog.querySelector('.close-modal-btn');
        const cancelBtn = document.getElementById('quick-add-cancel-btn');
        const saveBtn = document.getElementById('quick-add-save-btn');
        
        // Close对话框函数
        const closeDialog = () => {
            quickAddDialog.style.display = 'none';
        };
        
        // Close按钮Things
        closeBtn.addEventListener('click', closeDialog);
        
        // 取消按钮Things
        cancelBtn.addEventListener('click', closeDialog);
        
        // 保存按钮Things
        saveBtn.addEventListener('click', () => {
            const titleInput = document.getElementById('quick-add-item-title');
            const dueDateInput = document.getElementById('quick-add-due-date');
            const prioritySelect = document.getElementById('quick-add-priority');
            
            const title = titleInput.value.trim();
            const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
            const priority = prioritySelect.value;
            
            if (title) {
                // 添加Project到List
                const data = StorageManager.getData();
                const List = data.Lists.find(l => l.id === ListId);
                
                if (List) {
                    const newItem = {
                        id: Date.now().toString(),
                        title: title,
                        completed: false,
                        createTime: new Date().toISOString(),
                        dueDate: dueDate ? dueDate.toISOString() : null,
                        priority: priority || null
                    };
                    
                    if (!List.items) {
                        List.items = [];
                    }
                    
                    List.items.push(newItem);
                    StorageManager.saveData(data);
                    
                    // 刷新Preview
                    this.reloadPreviews();
                    
                    // 如果List界面是可见的，也刷新它
                    if (window.TodoListManager) {
                        TodoListManager.loadLists();
                        if (TodoListManager.currentListId === ListId) {
                            TodoListManager.loadListItems(List);
                        }
                    }
                }
                
                // Close对话框
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
     * 重新加载所有Preview区域
     */
    reloadPreviews() {
        // 移除现有Preview
        this.clearPreviews();
        
        // 移除List和 Countdown DayPreview的重新加载
    },
    
    /**
     * 添加 Countdown Day简版显示
     */
    addCountdownPreview() {
        // 检查页面medium是否已存在 Countdown DayPreview，避免重复
        if (document.querySelector('.countdown-preview-section')) {
            return;
        }
        
        const data = StorageManager.getData();
        
        if (!data.countdowns || data.countdowns.length === 0) return;
        
        // 创建 Countdown DayPreview区域
        const countdownPreview = document.createElement('div');
        countdownPreview.className = 'preview-section countdown-preview-section';
        
        // 创建Title（可点击折叠）
        const countdownHeader = document.createElement('div');
        countdownHeader.className = 'date-header collapsible collapsed';
        countdownHeader.innerHTML = `
            <h3><i class="fas fa-calendar-day"></i> 最近 Countdown Day</h3>
            <span class="collapse-icon"><i class="fas fa-chevron-right"></i></span>
        `;
        
        // 创建Content容器（可折叠）
        const countdownContent = document.createElement('div');
        countdownContent.className = 'collapsible-content collapsed';
        
        // 添加折叠/Expand功能
        countdownHeader.addEventListener('click', () => {
            countdownHeader.classList.toggle('collapsed');
            countdownContent.classList.toggle('collapsed');
            const icon = countdownHeader.querySelector('.collapse-icon i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-right');
        });
        
        // 按日期排序 Countdown Day（优先显示最近的日期）
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
        
        // 获取前三个 Countdown Day
        const previewCountdowns = sortedCountdowns.slice(0, 3);
        const countdownPreviewContainer = document.createElement('div');
        countdownPreviewContainer.className = 'preview-container';
        
        previewCountdowns.forEach(countdown => {
            const countdownPreviewItem = document.createElement('div');
            countdownPreviewItem.className = 'preview-item countdown-preview';
            countdownPreviewItem.style.setProperty('--accent-color', countdown.color || '#4285f4');
            
            // 计算剩余天数（使用内部方法确保一致性）
            const days = this._calculateCountdownDays(countdown);
            
            // Set显示文本和样式
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
            
            // 显示进度条（仅对未来7天内的Things）
            let progressBar = '';
            if (days >= 0 && days <= 7) {
                const percent = days === 0 ? 100 : Math.round((7 - days) / 7 * 100);
                progressBar = `
                    <div class="countdown-progress">
                        <div class="countdown-progress-bar" style="width: ${percent}%"></div>
                    </div>
                `;
            }
            
            // 添加RemarkPreview（如果有）
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
                        <span class="countdown-type-tag">${window.CountdownManager ? window.CountdownManager.formatTypeShort(countdown.type) : (countdown.type === 'yearly' ? 'Everyyear' : countdown.type === 'monthly' ? 'Everymonth' : '单times')}</span>
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
            
            // 为查看详情按钮添加Things
            const viewMoreBtn = countdownPreviewItem.querySelector('.view-more-btn');
            viewMoreBtn.addEventListener('click', () => {
                if (window.UIManager && typeof UIManager.switchView === 'function') {
                    UIManager.switchView('countdown');
                }
            });
            
            countdownPreviewContainer.appendChild(countdownPreviewItem);
        });
        
        // 如果有更多 Countdown Day，显示"查看更多"
        if (data.countdowns.length > 3) {
            const viewMorePreview = document.createElement('div');
            viewMorePreview.className = 'preview-more';
            viewMorePreview.innerHTML = `
                <button class="view-all-btn"><i class="fas fa-calendar-alt"></i> 查看全部 ${data.countdowns.length} 个 Countdown Day</button>
            `;
            
            // 为查看全部按钮添加Things
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
            console.error('找不到任务列表容器，Empty法添加 Countdown DayPreview');
            return;
        }
        
        // 查找ListPreview区域
        const todoListPreview = document.querySelector('.todoList-preview');
        if (todoListPreview && todoListPreview.parentNode) {
            // 将 Countdown DayPreview插入到ListPreview后面
            todoListPreview.parentNode.insertBefore(countdownPreview, todoListPreview.nextSibling);
        } else {
            // 如果找不到ListPreview，则添加到天气区域后面
            const weatherContainer = document.querySelector('.weather-tips-container');
            if (weatherContainer && weatherContainer.parentNode) {
                weatherContainer.parentNode.insertBefore(countdownPreview, weatherContainer.nextSibling);
            } else {
                // 如果都找不到，则添加到任务列表medium
                if (taskList.firstChild) {
                    taskList.insertBefore(countdownPreview, taskList.firstChild);
                } else {
                    taskList.appendChild(countdownPreview);
                }
            }
        }
    },
    
    /**
     * 计算 Countdown Day天数（内部方法）
     * @private
     * @param {Object} countdown  Countdown Day对象
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
            
            // 创建日期对象 (月份需要减1，因为JSmedium月份是0-11)
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
        } catch (e) {
            console.error('计算 Countdown Day天数出错:', e);
            return 0;
        }
    },
    
    /**
     * 格式化 Countdown Day日期（内部方法）
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
            
            // 创建日期对象 (月份需要减1，因为JSmedium月份是0-11)
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
     * 清除所有Preview区域
     */
    clearPreviews() {
        // 移除ListPreview
        const todoListPreview = document.querySelector('.todoList-preview');
        if (todoListPreview) {
            todoListPreview.remove();
        }
        
        // 移除 Countdown DayPreview
        const countdownPreview = document.querySelector('.countdown-preview-section');
        if (countdownPreview) {
            countdownPreview.remove();
        }
        
        // 移除任何其他存在的Preview区域
        const allPreviews = document.querySelectorAll('.preview-section');
        allPreviews.forEach(preview => preview.remove());
    },

    /**
     * 初始化Label筛选功能
     */
    initTagFilter() {
        // 获取所有Things，收集所有Label
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
        
        // 更新Label计数
        if (tagCountElement) {
            tagCountElement.textContent = tags.length;
        }
        
        // 清空按钮容器
        buttonsContainer.innerHTML = '';
        
        if (tags.length === 0) {
            // 如果没有Label，隐藏整个筛选容器
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        // 创建Label按钮
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
        
        // 绑定清除筛选按钮Things
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
        const searchQuery = this.elements.ListSearchInput ? this.elements.ListSearchInput.value.trim() : '';
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
                    parts.push(`${selectedTags.length} 个Label`);
                }
                if (searchQuery.length > 0) {
                    parts.push(`Search: "${searchQuery}"`);
                }
                if (startDate || endDate) {
                    if (startDate && endDate) {
                        parts.push(`Date: ${startDate} - ${endDate}`);
                    } else if (startDate) {
                        parts.push(`Start Date: ${startDate}`);
                    } else if (endDate) {
                        parts.push(`End Date: ${endDate}`);
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
                // 延迟隐藏，让动画效果Completed
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
        // 清除选medium的Label
        const selectedButtons = document.querySelectorAll('.tag-filter-btn.selected');
        selectedButtons.forEach(btn => btn.classList.remove('selected'));
        
        // 清除搜索框
        if (this.elements.ListSearchInput) {
            this.elements.ListSearchInput.value = '';
        }
        
        // 隐藏清除搜索按钮
        if (this.elements.clearSearchBtn) {
            this.elements.clearSearchBtn.style.display = 'none';
        }
        
        // 清除日期筛选
        this.clearDateFilter();
        
        // 清除Project筛选
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
        
        // 更新状态并重新加载任务（这会自动恢复出行贴士和Preview的显示）
        this.updateFilterStatus();
        this.loadTasks(true); // 传入true确保刷新Preview区域
    },

    /**
     * 应用Label筛选和搜索（保持向后兼容）
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
        
        // 绑定日期输入框Things
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
        
        // 绑定快捷日期按钮Things
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
     * Set快捷日期
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
        
        // Set日期输入框的值
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
                    statusText = `Date Range: ${startDate} - ${endDate}`;
                } else if (startDate) {
                    statusText = `Start Date: ${startDate}`;
                } else if (endDate) {
                    statusText = `End Date: ${endDate}`;
                }
                dateFilterStatusText.textContent = statusText;
            } else {
                dateFilterStatus.style.display = 'none';
                dateFilterStatus.classList.remove('active');
            }
        }
    },

    /**
     * 应用所有筛选条件（Label、搜索、日期）
     */
    applyAllFilters() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-filter-btn.selected')).map(btn => btn.getAttribute('data-tag'));
        const searchQuery = this.elements.ListSearchInput ? this.elements.ListSearchInput.value.trim().toLowerCase() : '';
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
        
        // 隐藏最近 Countdown Day和最近ListPreview
        this.hidePreviews();
        
        let events = StorageManager.getEvents();
        
        // Label筛选
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
                    <h3 style="color: var(--text-color); margin-bottom: 8px;">未找到匹配的Things</h3>
                    <p style="color: var(--text-secondary);">请尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            this.elements.taskList.appendChild(emptyMessage);
            // 渲染完毕后立即high亮正在进行的Things
            if (window.highlightOngoingEvents) {
                window.highlightOngoingEvents();
            }
            return;
        }
        
        // 显示筛选结果数量
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'date-header';
        resultsHeader.innerHTML = `<h3>筛选结果: 找到 ${events.length} 个Things</h3>`;
        this.elements.taskList.appendChild(resultsHeader);
        
        events.forEach(event => {
            const taskItem = this.createTaskItem(event);
            taskItem.classList.add('search-match');
            this.elements.taskList.appendChild(taskItem);
        });
        // 渲染完毕后立即high亮正在进行的Things
        if (window.highlightOngoingEvents) {
            window.highlightOngoingEvents();
        }
    },

    /**
     * 初始化折叠功能Things绑定
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
            // Expand
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
        // 默认Set为折叠状态
        if (this.elements.tagFilterContent) {
            this.elements.tagFilterContent.classList.add('collapsed');
            this.elements.tagFilterContainer.setAttribute('data-collapsed', 'true');
        }
        
        if (this.elements.dateFilterContent) {
            this.elements.dateFilterContent.classList.add('collapsed');
            this.elements.dateFilterContainer.setAttribute('data-collapsed', 'true');
        }
        
        // 检查本地存储medium的折叠状态（如果有的话）
        const tagCollapsed = this.getCollapseState('tag');
        const dateCollapsed = this.getCollapseState('date');
        
        // 如果本地存储medium有状态，则应用该状态
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
     * 隐藏最近 Countdown Day和最近ListPreview
     */
    hidePreviews() {
        // 移除ListPreview
        const todoListPreview = document.querySelector('.todoList-preview');
        if (todoListPreview) {
            todoListPreview.remove();
        }
        
        // 移除 Countdown DayPreview
        const countdownPreview = document.querySelector('.countdown-preview-section');
        if (countdownPreview) {
            countdownPreview.remove();
        }
    },

    /**
     * 初始化Project筛选功能
     */
    initProjectFilter() {
        const projectSelect = document.getElementById('project-filter-select');
        const clearProjectFilterBtn = document.getElementById('clear-project-filter-btn');
        const projectFilterStatus = document.getElementById('project-filter-status');
        const projectFilterStatusText = document.getElementById('project-filter-status-text');
        
        if (!projectSelect) return;
        
        // 加载Project选项
        this.loadProjectFilterOptions();
        
        // ProjectSelect变化Things
        projectSelect.addEventListener('change', () => {
            const selectedProjectId = projectSelect.value;
            const hasProjectFilter = selectedProjectId !== '';
            
            // 更新状态显示
            if (projectFilterStatus && projectFilterStatusText) {
                if (hasProjectFilter) {
                    const selectedOption = projectSelect.options[projectSelect.selectedIndex];
                    projectFilterStatus.style.display = 'flex';
                    projectFilterStatusText.textContent = `已筛选Project: ${selectedOption.text}`;
                } else {
                    projectFilterStatus.style.display = 'none';
                }
            }
            
            // 应用筛选
            this.applyAllFilters();
        });
        
        // 清除Project筛选按钮（现在由统一筛选管理器处理）
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
     * 加载Project筛选选项
     */
    loadProjectFilterOptions() {
        const projectSelect = document.getElementById('project-filter-select');
        if (!projectSelect) return;
        
        // 保存当前选medium的值
        const currentValue = projectSelect.value;
        
        // 清空选项（保留"所有Project"选项）
        projectSelect.innerHTML = '<option value="">所有Project</option>';
        
        // 获取所有Project
        const projects = StorageManager.getProjects();
        
        // 添加Project选项
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
        
        // 恢复选medium的值
        projectSelect.value = currentValue;
    },

    /**
     * 应用所有筛选条件（Label、搜索、日期、Project）
     */
    applyAllFilters() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-filter-btn.selected')).map(btn => btn.getAttribute('data-tag'));
        const searchQuery = this.elements.ListSearchInput ? this.elements.ListSearchInput.value.trim().toLowerCase() : '';
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
        
        // 隐藏最近 Countdown Day和最近ListPreview
        this.hidePreviews();
        
        let events = StorageManager.getEvents();
        
        // Label筛选
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
        
        // Project筛选
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
                    <h3 style="color: var(--text-color); margin-bottom: 8px;">未找到匹配的Things</h3>
                    <p style="color: var(--text-secondary);">请尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            this.elements.taskList.appendChild(emptyMessage);
            // 渲染完毕后立即high亮正在进行的Things
            if (window.highlightOngoingEvents) {
                window.highlightOngoingEvents();
            }
            return;
        }
        
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'date-header';
        resultsHeader.innerHTML = `<h3>筛选结果: 找到 ${events.length} 个Things</h3>`;
        this.elements.taskList.appendChild(resultsHeader);
        
        events.forEach(event => {
            const taskItem = this.createTaskItem(event);
            taskItem.classList.add('search-match');
            this.elements.taskList.appendChild(taskItem);
        });
        // 渲染完毕后立即high亮正在进行的Things
        if (window.highlightOngoingEvents) {
            window.highlightOngoingEvents();
        }
    },

    /**
     * 将Date对象转换为本地time字符串（用于datetime-local输入框）
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
     * 取消Things创建并返回上一页
     */
    cancelEvent() {
        // 重置表单
        this.resetEventForm();
        
        // 返回上一页
        if (window.CreateMenuManager) {
            window.CreateMenuManager.goBack();
        } else {
            // 如果没有New菜单管理器，默认返回Soon页面
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