/**
 * 日历视图管理模块
 * 负责日历视图的初始化和事件管理
 */

const CalendarManager = {
    // 日历实例
    calendar: null,
    // 当前视图类型
    currentView: '周',
    // 当前显示的日期
    currentDate: new Date(),
    // 是否处于批量删除模式
    batchDeleteMode: false,
    // 视图配置
    viewConfig: {
        '日': {
            gridTemplate: '1fr',
            rows: 'auto 1fr',
            maxWidth: '800px',
            margin: '0 auto'
        },
        '周': {
            gridTemplate: 'repeat(7, 1fr)',
            rows: 'auto 1fr'
        },
        '月': {
            gridTemplate: 'repeat(7, 1fr)',
            rows: 'auto repeat(5, 1fr)'
        },
        '年': {
            gridTemplate: 'repeat(4, 1fr)',
            rows: 'repeat(3, 1fr)'
        }
    },
    
    /**
     * 初始化日历管理器
     */
    init() {
        this.initCalendar();
        this.bindEvents();
    },
    
    /**
     * 初始化日历
     */
    initCalendar() {
        const calendarElement = document.getElementById('dp');
        if (!calendarElement) return;
        
        // 保存批量删除模式状态
        const wasBatchDeleteMode = this.batchDeleteMode;
        
        // 清空日历容器
        calendarElement.innerHTML = '';
        
        // 创建日历容器
        const calendarContainer = this.createCalendarContainer();
        
        // 创建日历头部
        const calendarHeader = this.createCalendarHeader();
        
        // 创建日历主体容器
        const calendarBodyContainer = this.createCalendarBodyContainer();
        
        // 创建日历主体
        const calendarBody = this.createCalendarBody();
        
        // 组装日历
        calendarBodyContainer.appendChild(calendarBody);
        calendarContainer.appendChild(calendarHeader);
        calendarContainer.appendChild(calendarBodyContainer);
        calendarElement.appendChild(calendarContainer);
        
        // 加载事件数据
        this.loadEvents();
        
        // 如果之前是批量删除模式，恢复该状态
        if (wasBatchDeleteMode) {
            this.showBatchSelectMode();
        }
    },
    
    /**
     * 创建日历容器
     * @returns {HTMLElement} 日历容器元素
     */
    createCalendarContainer() {
        const container = document.createElement('div');
        container.className = 'calendar-container';
        container.style.position = 'absolute';
        container.style.top = '60px';
        container.style.left = '0';
        container.style.right = '0';
        container.style.bottom = '0';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflow = 'hidden';
        container.style.zIndex = '1000';
        container.style.backgroundColor = 'var(--bg-color)';
        return container;
    },
    
    /**
     * 创建日历头部
     * @returns {HTMLElement} 日历头部元素
     */
    createCalendarHeader() {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.style.flexShrink = '0';
        header.style.padding = '5px';
        header.style.backgroundColor = 'var(--card-bg-color)';
        header.style.borderBottom = '1px solid var(--border-color)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.position = 'relative';
        header.style.zIndex = '1001';
        header.style.margin = '0';
        
        // 创建左侧控制区域
        const leftControls = this.createLeftControls();
        
        // 创建搜索框
        const searchContainer = this.createSearchBox();
        
        // 创建导航区域
        const navigation = this.createNavigation();
        
        // 组装头部
        header.appendChild(leftControls);
        header.appendChild(searchContainer);
        header.appendChild(navigation);
        
        return header;
    },
    
    /**
     * 创建搜索框
     * @returns {HTMLElement} 搜索框元素
     */
    createSearchBox() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'calendar-search-container';
        searchContainer.style.display = 'flex';
        searchContainer.style.alignItems = 'center';
        searchContainer.style.position = 'relative';
        searchContainer.style.maxWidth = '300px';
        searchContainer.style.width = '100%';
        
        const searchIcon = document.createElement('span');
        searchIcon.innerHTML = '<i class="fas fa-search"></i>';
        searchIcon.style.position = 'absolute';
        searchIcon.style.left = '10px';
        searchIcon.style.color = 'var(--text-color-light)';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '搜索事件...';
        searchInput.className = 'calendar-search-input';
        searchInput.style.border = '1px solid var(--border-color)';
        searchInput.style.borderRadius = '20px';
        searchInput.style.padding = '8px 12px 8px 35px';
        searchInput.style.width = '100%';
        searchInput.style.backgroundColor = 'var(--bg-color)';
        searchInput.style.color = 'var(--text-color)';
        searchInput.style.outline = 'none';
        searchInput.style.transition = 'all 0.3s';
        
        searchInput.addEventListener('focus', () => {
            searchInput.style.boxShadow = '0 0 0 2px var(--primary-color-light)';
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.style.boxShadow = 'none';
        });
        
        // 输入时显示清除按钮，但不立即搜索
        searchInput.addEventListener('input', () => {
            if (searchInput.value) {
                const clearBtn = searchContainer.querySelector('.clear-search-btn');
                if (!clearBtn) {
                    const clearButton = document.createElement('button');
                    clearButton.className = 'clear-search-btn';
                    clearButton.innerHTML = '<i class="fas fa-times"></i>';
                    clearButton.style.position = 'absolute';
                    clearButton.style.right = '10px';
                    clearButton.style.top = '50%';
                    clearButton.style.transform = 'translateY(-50%)';
                    clearButton.style.border = 'none';
                    clearButton.style.background = 'transparent';
                    clearButton.style.color = 'var(--text-color-light)';
                    clearButton.style.cursor = 'pointer';
                    clearButton.style.display = 'flex';
                    clearButton.style.alignItems = 'center';
                    clearButton.style.justifyContent = 'center';
                    clearButton.style.padding = '5px';
                    clearButton.style.zIndex = '2';
                    
                    clearButton.addEventListener('click', () => {
                        searchInput.value = '';
                        clearButton.remove();
                        this.loadEvents(); // 重新加载所有事件
                    });
                    
                    searchContainer.appendChild(clearButton);
                }
            } else {
                const clearBtn = searchContainer.querySelector('.clear-search-btn');
                if (clearBtn) {
                    clearBtn.remove();
                }
                this.loadEvents(); // 清空搜索时显示所有事件
            }
        });
        
        // 添加回车键搜索功能
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchEvents(searchInput.value);
            }
        });
        
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
        
        return searchContainer;
    },
    
    /**
     * 创建左侧控制区域
     * @returns {HTMLElement} 左侧控制区域元素
     */
    createLeftControls() {
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '10px';
        controls.style.alignItems = 'center';
        
        // 创建视图切换按钮组
        const viewButtons = this.createViewButtons();
        
        // 创建今天按钮
        const todayBtn = this.createTodayButton();
        
        // 创建取消批量删除按钮
        const cancelBatchDeleteBtn = this.createCancelBatchDeleteButton();
        
        controls.appendChild(viewButtons);
        controls.appendChild(todayBtn);
        controls.appendChild(cancelBatchDeleteBtn);
        
        return controls;
    },
    
    /**
     * 创建取消批量删除按钮
     * @returns {HTMLElement} 取消批量删除按钮元素
     */
    createCancelBatchDeleteButton() {
        const btn = document.createElement('button');
        btn.textContent = '取消批量删除';
        btn.className = 'calendar-cancel-batch-btn danger-btn';
        btn.style.display = this.batchDeleteMode ? 'inline-block' : 'none';
        btn.style.backgroundColor = '#6c757d';
        btn.style.color = 'white';
        btn.style.fontWeight = 'bold';
        btn.style.padding = '8px 15px';
        btn.style.borderRadius = '4px';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'background-color 0.3s';
        
        btn.addEventListener('mouseover', () => {
            btn.style.backgroundColor = '#5a6268';
        });
        
        btn.addEventListener('mouseout', () => {
            btn.style.backgroundColor = '#6c757d';
        });
        
        btn.addEventListener('click', () => this.cancelBatchDelete());
        
        return btn;
    },
    
    /**
     * 取消批量删除操作
     */
    cancelBatchDelete() {
        this.batchDeleteMode = false;
        
        // 隐藏批量选择复选框
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        if (batchCheckboxes) {
            batchCheckboxes.forEach(checkbox => {
                checkbox.style.display = 'none';
                checkbox.checked = false;
            });
        }
        
        // 更新批量删除按钮状态
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        if (batchDeleteBtn) {
            batchDeleteBtn.classList.remove('active');
        }
        
        // 移除取消批量删除按钮
        const cancelBatchBtn = document.querySelector('.calendar-cancel-batch-btn');
        if (cancelBatchBtn) {
            cancelBatchBtn.remove();
        }
        
        // 隐藏全选/全不选/取消选择按钮
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        const cancelSelectBtn = document.getElementById('cancel-select-btn');
        if (selectAllBtn) selectAllBtn.style.display = 'none';
        if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        if (cancelSelectBtn) cancelSelectBtn.style.display = 'none';
        
        // 通知用户
        if (window.UIManager) {
            UIManager.showNotification('已取消批量删除模式');
        }
    },
    
    /**
     * 创建视图切换按钮组
     * @returns {HTMLElement} 视图切换按钮组元素
     */
    createViewButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'calendar-view-buttons';
        
        // 获取视图配置的键
        const viewKeys = Object.keys(this.viewConfig);
        
        // 在移动设备上只显示日视图和周视图
        const isMobile = window.innerWidth <= 768;
        
        viewKeys.forEach(view => {
            // 如果是移动设备且是月视图或年视图，跳过创建
            if (isMobile && (view === '月' || view === '年')) {
                return;
            }
            
            const button = document.createElement('button');
            button.className = 'calendar-view-btn';
            button.setAttribute('data-view', view);
            if (view === this.currentView) button.classList.add('active');
            
            button.addEventListener('click', () => this.switchView(view));
            
            // 创建文本容器
            const textSpan = document.createElement('span');
            textSpan.textContent = view;
            button.appendChild(textSpan);
            
            buttonContainer.appendChild(button);
        });
        
        return buttonContainer;
    },
    
    /**
     * 创建今天按钮
     * @returns {HTMLElement} 今天按钮元素
     */
    createTodayButton() {
        const button = document.createElement('button');
        button.className = 'calendar-today-btn';
        button.addEventListener('click', () => this.goToToday());
        
        // 创建文本容器
        const textSpan = document.createElement('span');
        textSpan.textContent = '今天';
        button.appendChild(textSpan);
        
        return button;
    },
    
    /**
     * 创建导航区域
     * @returns {HTMLElement} 导航区域元素
     */
    createNavigation() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '<';
        prevBtn.className = 'calendar-nav-btn';
        prevBtn.style.padding = '5px 10px';
        prevBtn.style.fontSize = '14px';
        prevBtn.style.fontWeight = 'bold';
        prevBtn.style.cursor = 'pointer';
        prevBtn.style.backgroundColor = 'var(--primary-color)';
        prevBtn.style.color = 'white';
        prevBtn.style.border = 'none';
        prevBtn.style.borderRadius = '4px';
        prevBtn.addEventListener('click', () => this.navigate(-1));
        
        const currentDate = document.createElement('span');
        currentDate.textContent = this.formatDateRange(this.currentDate);
        currentDate.className = 'calendar-current-date';
        currentDate.style.padding = '0 10px';
        currentDate.style.fontWeight = 'bold';
        
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '>';
        nextBtn.className = 'calendar-nav-btn';
        nextBtn.style.padding = '5px 10px';
        nextBtn.style.fontSize = '14px';
        nextBtn.style.fontWeight = 'bold';
        nextBtn.style.cursor = 'pointer';
        nextBtn.style.backgroundColor = 'var(--primary-color)';
        nextBtn.style.color = 'white';
        nextBtn.style.border = 'none';
        nextBtn.style.borderRadius = '4px';
        nextBtn.addEventListener('click', () => this.navigate(1));
        
        // 如果处于严格模式，禁用导航按钮
        if (this.isStrictMode()) {
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
            prevBtn.title = '专注模式下不允许导航';
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
            nextBtn.title = '专注模式下不允许导航';
        }
        
        container.appendChild(prevBtn);
        container.appendChild(currentDate);
        container.appendChild(nextBtn);
        
        return container;
    },
    
    /**
     * 创建日历主体容器
     * @returns {HTMLElement} 日历主体容器元素
     */
    createCalendarBodyContainer() {
        const container = document.createElement('div');
        container.className = 'calendar-body-container';
        container.style.flex = '1';
        container.style.overflow = 'auto';
        container.style.position = 'relative';
        container.style.padding = '5px';
        container.style.zIndex = '1000';
        container.style.backgroundColor = 'var(--bg-color)';
        container.style.height = 'calc(100% - 50px)';
        container.style.margin = '0';
        return container;
    },
    
    /**
     * 创建日历主体
     * @returns {HTMLElement} 日历主体元素
     */
    createCalendarBody() {
        const body = document.createElement('div');
        body.className = 'calendar_default_main';
        
        // 应用视图配置
        const config = this.viewConfig[this.currentView];
        body.style.gridTemplateColumns = config.gridTemplate;
        body.style.gridTemplateRows = config.rows;
        if (config.maxWidth) body.style.maxWidth = config.maxWidth;
        if (config.margin) body.style.margin = config.margin;
        
        // 应用通用样式
        body.style.gap = '0';
        body.style.height = '100%';
        body.style.width = '100%';
        body.style.border = '1px solid var(--border-color)';
        body.style.borderRadius = '4px';
        body.style.overflow = 'hidden';
        body.style.backgroundColor = 'var(--card-bg-color)';
        body.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
        
        // 创建视图内容
        this.createViewContent(body);
        
        return body;
    },
    
    /**
     * 创建视图内容
     * @param {HTMLElement} container 容器元素
     */
    createViewContent(container) {
        switch (this.currentView) {
            case '日':
                this.createDayView(container);
                break;
            case '周':
                this.createWeekView(container);
                break;
            case '月':
                this.createMonthView(container);
                break;
            case '年':
                this.createYearView(container);
                break;
        }
    },
    
    /**
     * 创建日期单元格
     * @param {Date} date 日期对象
     * @returns {HTMLElement} 日期单元格元素
     */
    createDateCell(date) {
        const cell = document.createElement('div');
        cell.className = 'calendar_default_cell';
        cell.dataset.date = date.toISOString().slice(0, 10);
        cell.dataset.year = date.getFullYear();
        cell.dataset.month = date.getMonth() + 1;
        cell.dataset.day = date.getDate();
        cell.style.width = '100%';
        cell.style.height = '100%';
        cell.style.backgroundColor = 'var(--card-bg-color)';
        cell.style.border = '1px solid var(--border-color)';
        cell.style.margin = '0';
        cell.style.padding = '0';
        cell.style.position = 'relative';
        
        // 标记今天、过去和未来的日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            cell.classList.add('calendar_default_cell_today');
            cell.style.backgroundColor = 'var(--primary-color-light)';
            cell.style.border = '3px solid var(--primary-color)';
            cell.style.boxShadow = '0 0 15px rgba(66, 133, 244, 0.6)';
            cell.style.transform = 'scale(1.03)';
            cell.style.zIndex = '2';
            cell.style.transition = 'all 0.3s ease';
        } else if (date < today) {
            cell.classList.add('past-date');
            cell.style.backgroundColor = 'var(--bg-color)';
            cell.style.opacity = '0.7';
        } else {
            cell.classList.add('future-date');
            cell.style.backgroundColor = 'var(--card-bg-color)';
        }
        
        // 日期标题
        const dateHeader = document.createElement('div');
        dateHeader.className = 'cell-date-header';
        dateHeader.textContent = `${date.getMonth() + 1}月${date.getDate()}日`;
        dateHeader.style.padding = '2px 4px';
        dateHeader.style.textAlign = 'right';
        dateHeader.style.fontSize = '12px';
        dateHeader.style.width = '100%';
        dateHeader.style.borderBottom = '1px solid var(--border-color)';
        dateHeader.style.position = 'relative';
        
        // 如果是今天，添加特殊标记
        if (date.getTime() === today.getTime()) {
            dateHeader.style.backgroundColor = 'var(--primary-color)';
            dateHeader.style.color = 'white';
            dateHeader.style.fontWeight = 'bold';
            dateHeader.style.fontSize = '16px';
            dateHeader.style.borderBottom = '3px solid var(--primary-color)';
            dateHeader.style.textAlign = 'center';
            dateHeader.style.padding = '4px';
            dateHeader.style.textShadow = '0 1px 2px rgba(0,0,0,0.2)';
        }
        
        // 事件容器
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'cell-events-container';
        eventsContainer.style.padding = '2px';
        eventsContainer.style.overflowY = 'auto';
        eventsContainer.style.height = 'calc(100% - 24px)';
        eventsContainer.style.width = '100%';
        eventsContainer.style.position = 'relative';
        
        // 如果是今天，添加特殊背景
        if (date.getTime() === today.getTime()) {
            eventsContainer.style.backgroundColor = 'rgba(66, 133, 244, 0.15)';
            eventsContainer.style.border = '2px solid rgba(66, 133, 244, 0.3)';
            eventsContainer.style.borderRadius = '4px';
        }
        
        cell.appendChild(dateHeader);
        cell.appendChild(eventsContainer);
        
        return cell;
    },
    
    /**
     * 创建事件元素
     * @param {Object} event 事件对象
     * @returns {HTMLElement} 事件元素
     */
    createEventElement(event) {
        const eventContainer = document.createElement('div');
        eventContainer.className = 'calendar-event-container';
        eventContainer.style.position = 'relative';
        eventContainer.style.display = 'flex';
        eventContainer.style.alignItems = 'center';
        eventContainer.dataset.id = event.id;
        
        // 添加时间戳属性，用于排序
        if (event.startTime) {
            const eventDate = new Date(event.startTime);
            eventContainer.dataset.timestamp = eventDate.getTime();
        } else {
            eventContainer.dataset.timestamp = "0";
        }
        
        // 批量选择复选框（默认隐藏）
        const batchCheckbox = document.createElement('input');
        batchCheckbox.type = 'checkbox';
        batchCheckbox.className = 'batch-checkbox';
        batchCheckbox.style.display = this.batchDeleteMode ? 'block' : 'none';
        batchCheckbox.style.marginRight = '4px';
        batchCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
            // 如果有TaskManager，则使用其updateBatchDeleteButton方法
            if (window.TaskManager) {
                TaskManager.updateBatchDeleteButton();
            }
        });
        
        eventContainer.appendChild(batchCheckbox);
        
        const eventElement = document.createElement('div');
        // 为不同类型的事件添加特殊类名
        let className = 'calendar_default_event';
        if (event.completed) className += ' completed-event';
        if (event.isCountdown) className += ' countdown-event';
        if (event.isTodoItem) className += ' todo-item-event';
        eventElement.className = className;
        
        eventElement.style.margin = '1px 0';
        eventElement.style.padding = '2px 4px';
        eventElement.style.borderRadius = '2px';
        eventElement.style.backgroundColor = event.color || '#4285f4';
        eventElement.style.color = 'white';
        eventElement.style.fontSize = '11px';
        eventElement.style.cursor = 'pointer';
        eventElement.style.overflow = 'hidden';
        eventElement.style.textOverflow = 'ellipsis';
        eventElement.style.whiteSpace = 'nowrap';
        eventElement.style.flex = '1';
        
        let timeText = "";
        let iconHTML = "";
        
        // 对不同类型的事件使用不同的显示逻辑
        if (event.isCountdown) {
            // 倒数日显示自定义图标
            iconHTML = event.icon ? `<span style="margin-right: 4px;">${event.icon}</span>` : '';
            timeText = event.location || ''; // 使用location字段显示"每年重复"或"单次"
        } else if (event.isTodoItem) {
            // 清单项显示勾选状态
            iconHTML = event.completed ? 
                `<span style="margin-right: 4px; color: #4CAF50;">✓</span>` : 
                `<span style="margin-right: 4px;">□</span>`;
            timeText = event.location || ''; // 使用location显示清单名称和状态
        } else if (event.startTime) {
            // 普通事件显示时间
            const eventDate = new Date(event.startTime);
            // 在年视图中显示日期和时间，其他视图只显示时间
            if (this.currentView === '年') {
                timeText = `${eventDate.getMonth() + 1}/${eventDate.getDate()} ${eventDate.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                })}`;
            } else {
                // 使用24小时制显示时间，更清晰明确
                const hours = eventDate.getHours().toString().padStart(2, '0');
                const minutes = eventDate.getMinutes().toString().padStart(2, '0');
                timeText = `${hours}:${minutes}`;
            }
            
            // 添加时钟图标表示时间
            iconHTML = `<span style="margin-right: 4px;"><i class="fas fa-clock"></i></span>`;
        } else {
            timeText = "全天";
            iconHTML = `<span style="margin-right: 4px;"><i class="fas fa-sun"></i></span>`;
        }
        
        const eventInner = document.createElement('div');
        eventInner.className = 'calendar_default_event_inner';
        
        // 为倒数日使用不同的HTML结构
        if (event.isCountdown) {
            eventInner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 4px;">
                    ${iconHTML}
                    <span>${event.name}</span>
                    <span style="margin-left: auto; font-size: 10px; opacity: 0.8;">${timeText}</span>
                </div>
                ${event.notes ? `<div style="font-size: 10px; opacity: 0.8;">${event.notes}</div>` : ''}
            `;
        } else if (event.isTodoItem) {
            // 清单待办项使用特殊的HTML结构
            eventInner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 4px;">
                    ${iconHTML}
                    <span>${event.name}</span>
                    <span style="margin-left: auto; font-size: 10px; opacity: 0.8;">${timeText}</span>
                </div>
            `;
        } else {
            eventInner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-weight: bold;">${timeText}</span>
                    <span>${event.name}</span>
                    ${event.completed ? '<span style="color: #4CAF50;">✓</span>' : ''}
                </div>
                ${event.location ? `<div style="font-size: 10px; opacity: 0.8;">${event.location}</div>` : ''}
            `;
        }
        
        eventElement.appendChild(eventInner);
        
        // 处理点击事件
        if (event.isCountdown) {
            // 倒数日点击时显示详情或编辑
            eventElement.addEventListener('click', () => {
                // 从id中提取倒数日ID
                const countdownId = event.id.substring(3); // 移除前缀'cd_'
                // 如果存在CountdownManager，则调用其显示模态框方法
                if (window.CountdownManager) {
                    // 获取对应的倒数日数据
                    const data = StorageManager.getData();
                    const countdown = data.countdowns.find(c => c.id === countdownId);
                    if (countdown) {
                        CountdownManager.showModal(countdown);
                    }
                }
            });
        } else if (event.isTodoItem) {
            // 清单待办项点击时跳转到对应清单并高亮显示
            eventElement.addEventListener('click', () => {
                // 从id中提取待办项ID
                const todoItemId = event.id.substring(5); // 移除前缀'todo_'
                
                // 如果存在TodoListManager，则调用其选择清单方法并滚动到对应项目
                if (window.TodoListManager) {
                    // 先切换到清单视图
                    if (window.UIManager) {
                        UIManager.switchView('lists');
                    }
                    
                    // 选择对应的清单
                    TodoListManager.selectList(event.listId);
                    
                    // 滚动到对应项目并高亮显示
                    setTimeout(() => {
                        const itemElement = document.querySelector(`[data-item-id="${todoItemId}"]`);
                        if (itemElement) {
                            itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // 添加临时高亮效果
                            itemElement.classList.add('highlighted');
                            setTimeout(() => {
                                itemElement.classList.remove('highlighted');
                            }, 2000);
                        }
                    }, 300);
                }
            });
        } else {
            // 在严格模式下，只允许查看当前时间的事件
            if (this.isStrictMode() && event.startTime) {
                const now = new Date();
                const eventDate = new Date(event.startTime);
                if (eventDate > now) {
                    eventElement.style.opacity = '0.5';
                    eventElement.style.cursor = 'not-allowed';
                    eventElement.title = '严格模式下无法查看未来事件';
                } else {
                    eventElement.addEventListener('click', () => UIManager.openEventDetails(event));
                }
            } else {
                eventElement.addEventListener('click', () => UIManager.openEventDetails(event));
            }
        }
        
        eventContainer.appendChild(eventElement);
        
        return eventContainer;
    },
    
    /**
     * 创建日视图
     * @param {HTMLElement} container 容器元素
     */
    createDayView(container) {
        // 创建时间表头
        const timeHeader = document.createElement('div');
        timeHeader.className = 'calendar_default_colheader';
        timeHeader.textContent = new Date(this.currentDate).toLocaleDateString('zh-CN');
        
        // 添加日期单元格
        const cell = this.createDateCell(new Date(this.currentDate));
        
        container.style.gridTemplateColumns = this.viewConfig['日'].gridTemplate;
        container.style.gridTemplateRows = this.viewConfig['日'].rows;
        container.style.maxWidth = this.viewConfig['日'].maxWidth;
        container.style.margin = this.viewConfig['日'].margin;
        
        container.appendChild(timeHeader);
        container.appendChild(cell);
    },
    
    /**
     * 创建周视图
     * @param {HTMLElement} container 容器元素
     */
    createWeekView(container) {
        container.style.gridTemplateColumns = this.viewConfig['周'].gridTemplate;
        container.style.gridTemplateRows = this.viewConfig['周'].rows;
        
        // 获取本周的起始日期（周一）
        const startDate = new Date(this.currentDate);
        const day = startDate.getDay() || 7; // 获取星期几，星期日返回0，转为7
        startDate.setDate(startDate.getDate() - day + 1);
        
        // 创建星期表头
        const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
        weekdays.forEach(weekday => {
            const header = document.createElement('div');
            header.className = 'calendar_default_colheader';
            header.textContent = `星期${weekday}`;
            container.appendChild(header);
        });
        
        // 创建日期单元格
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const cell = this.createDateCell(currentDate);
            container.appendChild(cell);
        }
    },
    
    /**
     * 创建月视图
     * @param {HTMLElement} container 容器元素
     */
    createMonthView(container) {
        container.style.gridTemplateColumns = this.viewConfig['月'].gridTemplate;
        container.style.gridTemplateRows = this.viewConfig['月'].rows;
        
        // 获取本月的第一天
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        // 获取本月的第一天是星期几
        const firstDayOfWeek = firstDay.getDay() || 7; // 星期日转为7
        // 获取本月的天数
        const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
        
        // 创建星期表头
        const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
        weekdays.forEach(weekday => {
            const header = document.createElement('div');
            header.className = 'calendar_default_colheader';
            header.textContent = `星期${weekday}`;
            container.appendChild(header);
        });
        
        // 创建日期单元格
        // 首先添加上个月的天数
        const prevMonthDays = firstDayOfWeek - 1;
        const prevMonth = new Date(firstDay);
        prevMonth.setDate(0); // 设置为上个月的最后一天
        const prevMonthLastDay = prevMonth.getDate();
        
        for (let i = 0; i < prevMonthDays; i++) {
            const date = new Date(prevMonth);
            date.setDate(prevMonthLastDay - prevMonthDays + i + 1);
            
            const cell = this.createDateCell(date);
            cell.style.opacity = '0.5';
            container.appendChild(cell);
        }
        
        // 添加本月的天数
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(firstDay);
            date.setDate(i);
            
            const cell = this.createDateCell(date);
            container.appendChild(cell);
        }
        
        // 添加下个月的天数填充剩余空间
        const remaining = 35 - (prevMonthDays + daysInMonth);
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(firstDay);
            date.setMonth(date.getMonth() + 1);
            date.setDate(i);
            
            const cell = this.createDateCell(date);
            cell.style.opacity = '0.5';
            container.appendChild(cell);
        }
    },
    
    /**
     * 创建年视图
     * @param {HTMLElement} container 容器元素
     */
    createYearView(container) {
        container.style.gridTemplateColumns = this.viewConfig['年'].gridTemplate;
        container.style.gridTemplateRows = this.viewConfig['年'].rows;
        
        // 创建月份单元格
        for (let month = 1; month <= 12; month++) {
            const cell = document.createElement('div');
            cell.className = 'calendar_default_cell';
            cell.dataset.month = month;
            // 添加年份属性，确保能够正确识别不同年份的月份单元格
            cell.dataset.year = this.currentDate.getFullYear();
            
            // 月份标题
            const monthHeader = document.createElement('div');
            monthHeader.className = 'cell-date-header';
            // 添加年份信息到月份标题
            monthHeader.textContent = `${this.currentDate.getFullYear()}年${month}月`;
            monthHeader.style.padding = '5px';
            monthHeader.style.textAlign = 'center';
            monthHeader.style.fontSize = '16px';
            monthHeader.style.fontWeight = 'bold';
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 如果是当前月份，添加特殊样式
            if (month === today.getMonth() + 1 && this.currentDate.getFullYear() === today.getFullYear()) {
                monthHeader.style.backgroundColor = 'var(--primary-color)';
                monthHeader.style.color = 'white';
                cell.style.border = '2px solid var(--primary-color)';
                cell.style.boxShadow = '0 0 5px rgba(66, 133, 244, 0.3)';
            }
                            
            // 事件容器
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'cell-events-container';
            eventsContainer.style.padding = '5px';
            eventsContainer.style.overflowY = 'auto';
            eventsContainer.style.height = 'calc(100% - 30px)';
            
            // 如果是当前月份，添加特殊背景
            if (month === today.getMonth() + 1 && this.currentDate.getFullYear() === today.getFullYear()) {
                eventsContainer.style.backgroundColor = 'rgba(66, 133, 244, 0.05)';
            }
            
            cell.appendChild(monthHeader);
            cell.appendChild(eventsContainer);
            container.appendChild(cell);
        }
    },
    
    /**
     * 加载事件数据
     */
    loadEvents() {
        // 清除搜索状态
        this.clearSearch();
        
        // 获取所有事件
        const events = StorageManager.getEvents();
        
        // 获取倒数日数据并转换成日历事件格式
        const data = StorageManager.getData();
        const countdowns = data.countdowns || [];
        
        // 将倒数日数据转换为事件格式
        const countdownEvents = countdowns.map(countdown => {
            const days = this.calculateDays(countdown);
            let status = '';
            
            if (days === 0) {
                status = '就是今天';
            } else if (days > 0) {
                status = `还有 ${days} 天`;
            } else {
                status = `已过 ${Math.abs(days)} 天`;
            }
            
            // 创建日期
            const eventDate = new Date(countdown.date);
            
            return {
                id: 'cd_' + countdown.id, // 添加前缀以区分普通事件
                name: countdown.name + ' ' + status,
                startTime: eventDate.toISOString(),
                endTime: eventDate.toISOString(),
                color: countdown.color || '#ff5722',
                location: countdown.type === 'yearly' ? '每年重复' : '单次',
                notes: countdown.notes,
                isCountdown: true, // 标记为倒数日
                icon: countdown.icon
            };
        });
        
        // 获取所有清单
        const lists = data.lists || [];
        
        // 将有截止日期的清单项目转换为事件格式
        const todoListEvents = [];
        lists.forEach(list => {
            if (list.items && list.items.length > 0) {
                // 只处理有截止日期的项目
                const itemsWithDueDate = list.items.filter(item => item.dueDate);
                
                if (itemsWithDueDate.length > 0) {
                    itemsWithDueDate.forEach(item => {
                        // 计算剩余天数
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dueDate = new Date(item.dueDate);
                        dueDate.setHours(0, 0, 0, 0);
                        const diffTime = dueDate - today;
                        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        // 设置状态文本
                        let status = '';
                        let itemColor = item.completed ? '#4CAF50' : '#2196F3';
                        
                        if (item.completed) {
                            status = '已完成';
                        } else if (days < 0) {
                            status = `已逾期 ${Math.abs(days)} 天`;
                            itemColor = '#F44336'; // 红色表示逾期
                        } else if (days === 0) {
                            status = '今天到期';
                            itemColor = '#FF9800'; // 橙色表示今天到期
                        } else if (days <= 3) {
                            status = `还剩 ${days} 天`;
                            itemColor = '#FF9800'; // 橙色表示即将到期
                        } else {
                            status = `还剩 ${days} 天`;
                        }
                        
                        todoListEvents.push({
                            id: 'todo_' + item.id, // 添加前缀以区分
                            name: item.title,
                            startTime: dueDate.toISOString(),
                            endTime: dueDate.toISOString(),
                            color: itemColor,
                            location: `[${list.name}] ${status}`,
                            notes: '',
                            completed: item.completed,
                            isTodoItem: true, // 标记为待办事项
                            listId: list.id,
                            itemId: item.id
                        });
                    });
                }
            }
        });
        
        // 合并所有类型的事件
        const allEvents = [...events, ...countdownEvents, ...todoListEvents];
        
        // 对事件进行排序，按照开始时间升序排列
        allEvents.sort((a, b) => {
            // 如果没有开始时间，将其排在最后
            if (!a.startTime && !b.startTime) return 0;
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            
            // 比较开始时间
            const timeA = new Date(a.startTime).getTime();
            const timeB = new Date(b.startTime).getTime();
            return timeA - timeB;
        });
                        
        // 清空所有事件容器
        const eventContainers = document.querySelectorAll('.cell-events-container');
        eventContainers.forEach(container => {
            container.innerHTML = '';
        });
                        
        // 添加事件到对应日期单元格
        allEvents.forEach((event, index) => {
            // 获取事件日期，如果没有开始时间则使用当前日期
            let eventDate;
            let dateStr;

            if (event.startTime) {
                eventDate = new Date(event.startTime);
                dateStr = eventDate.toISOString().slice(0, 10);
            } else {
                // 没有开始时间的事件放在当前日期显示
                eventDate = new Date();
                dateStr = eventDate.toISOString().slice(0, 10);
            }
            
            // 根据视图类型选择不同的选择器
            let cell;
            if (this.currentView === '年') {
                // 确保只有当前选中年份的事件才会显示
                if (eventDate.getFullYear() === this.currentDate.getFullYear()) {
                    cell = document.querySelector(`.calendar_default_cell[data-month="${eventDate.getMonth() + 1}"][data-year="${eventDate.getFullYear()}"]`);
                }
            } else {
                cell = document.querySelector(`.calendar_default_cell[data-date="${dateStr}"]`);
            }
            
            if (!cell) return;
            
            const eventsContainer = cell.querySelector('.cell-events-container');
            if (!eventsContainer) return;
            
            const eventElement = this.createEventElement(event);
            eventsContainer.appendChild(eventElement);
            eventElement.style.animationDelay = `${index * 0.1}s`;
        });
        
        // 对同一天内的事件进行排序
        document.querySelectorAll('.cell-events-container').forEach(container => {
            // 获取容器中的所有事件元素
            const events = Array.from(container.querySelectorAll('.calendar-event-container'));
            
            // 按时间戳排序
            events.sort((a, b) => {
                const timeA = parseInt(a.dataset.timestamp) || 0;
                const timeB = parseInt(b.dataset.timestamp) || 0;
                return timeA - timeB;
            });
            
            // 重新按排序后的顺序添加到容器中
            events.forEach(event => {
                container.appendChild(event);
            });
        });
        
        // 如果处于批量删除模式，显示所有复选框
        if (this.batchDeleteMode) {
            this.showBatchSelectMode();
        }
    },
    
    /**
     * 显示批量选择模式
     */
    showBatchSelectMode() {
        this.batchDeleteMode = true;
        
        // 准备取消批量删除按钮
        // 先移除现有按钮（如果有）
        const existingCancelBtn = document.querySelector('.calendar-cancel-batch-btn');
        if (existingCancelBtn) {
            existingCancelBtn.remove();
        }
        
        // 创建新按钮并直接添加到视图控件区域
        const viewControls = document.querySelector('.view-controls');
        if (viewControls) {
            const newCancelBtn = document.createElement('button');
            newCancelBtn.textContent = '取消批量删除';
            newCancelBtn.className = 'calendar-cancel-batch-btn danger-btn';
            newCancelBtn.style.backgroundColor = '#6c757d';
            newCancelBtn.style.color = 'white';
            newCancelBtn.style.fontWeight = 'bold';
            newCancelBtn.style.border = 'none';
            newCancelBtn.style.borderRadius = '4px';
            newCancelBtn.style.padding = '8px 15px';
            newCancelBtn.style.margin = '0 5px';
            newCancelBtn.style.cursor = 'pointer';
            newCancelBtn.style.display = 'inline-block';
            
            newCancelBtn.addEventListener('click', () => this.cancelBatchDelete());
            viewControls.appendChild(newCancelBtn);
        }
        
        // 确保批量删除按钮处于激活状态
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        if (batchDeleteBtn) {
            batchDeleteBtn.classList.add('active');
        }
        
        // 显示所有批量选择复选框
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        batchCheckboxes.forEach(checkbox => {
            checkbox.style.display = 'block';
        });
        
        // 显示全选/全不选/取消选择按钮
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        const cancelSelectBtn = document.getElementById('cancel-select-btn');
        if (selectAllBtn) selectAllBtn.style.display = 'block';
        if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        if (cancelSelectBtn) cancelSelectBtn.style.display = 'block';
        
        // 确保刷新完成后，依然显示取消批量删除按钮和复选框
        setTimeout(() => {
            const checkAgain = document.querySelector('.calendar-cancel-batch-btn');
            if (!checkAgain && this.batchDeleteMode) {
                // 如果按钮不存在但仍在批量模式，重新创建
                this.showBatchSelectMode();
            }
            // 再次确保所有复选框都显示
            const checkboxes = document.querySelectorAll('.batch-checkbox');
            checkboxes.forEach(cb => {
                cb.style.display = 'block';
            });
        }, 100);
        
        // 通知用户
        if (window.UIManager) {
            UIManager.showNotification('已进入批量删除模式，请选择要删除的事件');
        }
    },
    
    /**
     * 检查是否处于严格模式
     * @returns {boolean} 是否处于严格模式
     */
    isStrictMode() {
        const settings = StorageManager.getSettings();
        return settings.focusMode && settings.strictMode;
    },
    
    /**
     * 切换到今天
     */
    goToToday() {
        // 在严格模式下，如果当前日期不是今天，则不允许切换
        if (this.isStrictMode()) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
            const currentDate = new Date(this.currentDate);
            currentDate.setHours(0, 0, 0, 0);
            
            if (currentDate.getTime() !== today.getTime()) {
                return;
            }
        }
        
        this.currentDate = new Date();
        this.clearSearch(); // 清除搜索状态
        this.refreshCalendar();
    },
    
    /**
     * 切换视图
     * @param {String} view 视图类型 (日/周/月/年)
     */
    switchView(view) {
        // 在严格模式下，只允许查看当前视图
        if (this.isStrictMode() && view !== this.currentView) {
            return;
        }
        
        // 在移动设备上，禁止切换到月视图和年视图
        if (window.innerWidth <= 768 && (view === '月' || view === '年')) {
            UIManager.showNotification('移动设备上不支持月视图和年视图，请使用日视图或周视图');
            return;
        }
        
        this.currentView = view;
        this.clearSearch(); // 清除搜索状态
        this.refreshCalendar();
    },
    
    /**
     * 在日历中导航
     * @param {Number} direction 导航方向，-1表示向前，1表示向后
     */
    navigate(direction) {
        // 在严格模式下，不允许导航
        if (this.isStrictMode()) {
            UIManager.showNotification('专注模式下不允许导航');
            return;
        }
        
        const currentDate = new Date(this.currentDate);
        
        switch (this.currentView) {
            case '日':
                currentDate.setDate(currentDate.getDate() + direction);
                break;
            case '周':
                currentDate.setDate(currentDate.getDate() + (7 * direction));
                break;
            case '月':
                currentDate.setMonth(currentDate.getMonth() + direction);
                break;
            case '年':
                currentDate.setFullYear(currentDate.getFullYear() + direction);
                break;
        }
        
        this.currentDate = currentDate;
        this.refreshCalendar();
    },
    
    /**
     * 格式化日期范围
     * @param {Date} date 日期对象
     * @returns {String} 格式化后的日期范围字符串
     */
    formatDateRange(date) {
        switch (this.currentView) {
            case '日':
                return date.toLocaleDateString('zh-CN');
            case '周':
                const startDate = new Date(date);
                startDate.setDate(startDate.getDate() - startDate.getDay());
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);
                return `${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`;
            case '月':
                return `${date.getFullYear()}年${date.getMonth() + 1}月`;
            case '年':
                return `${date.getFullYear()}年`;
        }
    },
    
    /**
     * 刷新日历视图
     */
    refreshCalendar() {
        this.initCalendar();
        
        // 从localStorage重新加载事件
        this.loadEvents();
        
        // 通知用户
        const modes = {'日': '日', '周': '周', '月': '月', '年': '年'};
        console.log(`日历已刷新 (${modes[this.currentView]}视图)`);
    },
    
    /**
     * 全选所有事件
     */
    selectAllEvents() {
        if (!this.batchDeleteMode) return;
        
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        batchCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // 如果有TaskManager，使用其updateBatchDeleteButton方法
        if (window.TaskManager) {
            TaskManager.updateBatchDeleteButton();
        }
        
        // 显示取消全选按钮，隐藏全选按钮
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        if (selectAllBtn) selectAllBtn.style.display = 'none';
        if (deselectAllBtn) deselectAllBtn.style.display = 'block';
    },
    
    /**
     * 取消全选事件
     */
    deselectAllEvents() {
        if (!this.batchDeleteMode) return;
        
        const batchCheckboxes = document.querySelectorAll('.batch-checkbox');
        batchCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // 如果有TaskManager，使用其updateBatchDeleteButton方法
        if (window.TaskManager) {
            TaskManager.updateBatchDeleteButton();
        }
        
        // 显示全选按钮，隐藏取消全选按钮
        const selectAllBtn = document.getElementById('select-all-btn');
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        if (selectAllBtn) selectAllBtn.style.display = 'block';
        if (deselectAllBtn) deselectAllBtn.style.display = 'none';
    },
    
    /**
     * 批量删除选中的事件
     */
    batchDeleteEvents() {
        const checkedBoxes = document.querySelectorAll('.batch-checkbox:checked');
        if (checkedBoxes.length === 0) {
            UIManager.showNotification('请先选择要删除的事件');
            return;
        }
        
        if (confirm(`确定要删除选中的 ${checkedBoxes.length} 个事件吗？`)) {
            // 收集所有要删除的事件ID
            const eventIds = [];
            
            checkedBoxes.forEach(checkbox => {
                const eventContainer = checkbox.closest('.calendar-event-container');
                if (eventContainer && eventContainer.dataset.id) {
                    eventIds.push(eventContainer.dataset.id);
                }
            });
            
            // 执行删除操作
            if (eventIds.length > 0) {
                eventIds.forEach(eventId => {
                    if (window.TaskManager) {
                        TaskManager.deleteEvent(eventId);
                    } else {
                        StorageManager.deleteEvent(eventId);
                    }
                });
                
                // 取消批量删除模式
                this.cancelBatchDelete();
                
                // 刷新日历视图
                this.refreshCalendar();
                
                // 显示通知
                if (window.UIManager) {
                    UIManager.showNotification(`已删除 ${eventIds.length} 个事件`);
                }
            } else {
                UIManager.showNotification('无法获取事件ID，删除失败');
            }
        }
    },
    
    /**
     * 绑定事件处理函数
     */
    bindEvents() {
        // 批量删除按钮
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', () => {
                if (batchDeleteBtn.classList.contains('active')) {
                    // 如果按钮处于激活状态，执行删除操作
                    this.batchDeleteEvents();
                } else {
                    // 如果按钮未激活，进入批量选择模式
                    this.batchDeleteMode = true; // 先设置模式
                    batchDeleteBtn.classList.add('active');
                    
                    // 重新加载事件以显示复选框，但不重置状态
                    this.showBatchSelectMode();
                }
            });
        }
        
        // 全选按钮
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllEvents();
            });
        }
        
        // 取消全选按钮
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                this.deselectAllEvents();
            });
        }
        
        // 取消选择按钮
        const cancelSelectBtn = document.getElementById('cancel-select-btn');
        if (cancelSelectBtn) {
            cancelSelectBtn.addEventListener('click', () => {
                this.cancelBatchDelete();
            });
        }
        
        // 搜索按钮 - 添加点击搜索功能
        const searchButton = document.createElement('button');
        searchButton.className = 'calendar-search-button';
        searchButton.innerHTML = '<i class="fas fa-search"></i>';
        searchButton.style.background = 'var(--primary-color)';
        searchButton.style.border = 'none';
        searchButton.style.borderRadius = '20px';
        searchButton.style.color = 'white';
        searchButton.style.cursor = 'pointer';
        searchButton.style.padding = '8px 15px';
        searchButton.style.marginLeft = '10px';
        
        const searchInput = document.querySelector('.calendar-search-input');
        if (searchInput) {
            // 在搜索框旁边添加搜索按钮
            const searchContainer = searchInput.parentElement;
            if (searchContainer) {
                searchContainer.appendChild(searchButton);
            }
            
            // 点击搜索按钮进行搜索
            searchButton.addEventListener('click', () => {
                this.searchEvents(searchInput.value);
            });
        }
        
        // 监听窗口大小变化，自适应屏幕
        window.addEventListener('resize', () => {
            // 如果是移动设备且当前视图是月视图或年视图，切换到周视图
            const isMobile = window.innerWidth <= 768;
            if (isMobile && (this.currentView === '月' || this.currentView === '年')) {
                this.currentView = '周';
                this.refreshCalendar();
            }
            
            // 调整日历容器高度
            const dp = document.getElementById('dp');
            if (dp) {
                if (isMobile) {
                    dp.style.height = window.innerWidth <= 480 ? '400px' : '500px';
                } else {
                    dp.style.height = '700px';
                }
            }
        });
    },
    
    /**
     * 查找特定日期的单元格
     * @param {Date} date 要查找的日期
     * @param {boolean} createIfMissing 如果找不到是否创建一个临时单元格
     * @returns {HTMLElement|null} 找到的单元格或null
     */
    findDateCell(date, createIfMissing = false) {
        if (!date) return null;
        
        const dateStr = date.toISOString().slice(0, 10);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 首先尝试通过完整日期查找
        let cell = document.querySelector(`.calendar_default_cell[data-date="${dateStr}"]`);
        
        // 如果没找到，根据当前视图类型尝试不同的查找策略
        if (!cell) {
            switch (this.currentView) {
                case '年':
                    // 在年视图中，查找对应月份的单元格
                    cell = document.querySelector(`.calendar_default_cell[data-month="${month}"][data-year="${year}"]`);
                    if (!cell) {
                        // 如果年份不匹配，可能需要导航到正确的年份
                        cell = document.querySelector(`.calendar_default_cell[data-month="${month}"]`);
                    }
                    break;
                    
                case '月':
                case '周':
                    // 尝试通过年、月、日的组合查找
                    cell = document.querySelector(`.calendar_default_cell[data-year="${year}"][data-month="${month}"][data-day="${day}"]`);
                    
                    // 如果找不到，可能是月份或周不在当前视图范围内
                    if (!cell) {
                        // 尝试只通过日查找（适用于当月的情况）
                        const cells = document.querySelectorAll(`.calendar_default_cell[data-day="${day}"]`);
                        // 选择第一个不透明的单元格（当前月份的）
                        for (let i = 0; i < cells.length; i++) {
                            if (cells[i].style.opacity !== '0.5') {
                                cell = cells[i];
                                break;
                            }
                        }
                    }
                    break;
                    
                case '日':
                    // 日视图只有一个单元格
                    cell = document.querySelector('.calendar_default_cell');
                    break;
            }
        }
        
        // 如果仍然找不到但需要创建临时单元格
        if (!cell && createIfMissing) {
            cell = this.createDateCell(date);
            // 这个临时单元格不会被添加到DOM，仅用于返回一个有效引用
        }
        
        return cell;
    },
    
    /**
     * 搜索事件
     * @param {String} query 搜索关键词
     */
    searchEvents(query) {
        query = query.toLowerCase().trim();
        
        // 如果搜索框为空，显示所有事件
        if (!query) {
            this.loadEvents();
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
        
        // 清空所有事件容器
        const eventContainers = document.querySelectorAll('.cell-events-container');
        eventContainers.forEach(container => {
            container.innerHTML = '';
        });
        
        // 如果没有找到匹配的事件，显示提示
        if (matchedEvents.length === 0) {
            if (window.UIManager) {
                UIManager.showNotification(`未找到匹配 "${query}" 的事件`);
            }
            
            // 显示一个空状态提示
            const calendarBody = document.querySelector('.calendar-body-container');
            if (calendarBody) {
                const emptyState = document.createElement('div');
                emptyState.className = 'calendar-search-empty-state';
                emptyState.style.position = 'absolute';
                emptyState.style.top = '50%';
                emptyState.style.left = '50%';
                emptyState.style.transform = 'translate(-50%, -50%)';
                emptyState.style.textAlign = 'center';
                emptyState.style.padding = '20px';
                emptyState.style.borderRadius = '8px';
                emptyState.style.backgroundColor = 'var(--card-bg-color)';
                emptyState.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                emptyState.style.zIndex = '100';
                
                emptyState.innerHTML = `
                    <div><i class="fas fa-search" style="font-size: 48px; color: var(--text-color-light); margin-bottom: 15px;"></i></div>
                    <div style="font-size: 18px; margin-bottom: 10px;">未找到匹配的事件</div>
                    <div style="color: var(--text-color-light);">没有找到包含"${query}"的事件</div>
                `;
                
                // 添加一个返回按钮
                const backButton = document.createElement('button');
                backButton.textContent = '返回所有事件';
                backButton.style.marginTop = '15px';
                backButton.style.padding = '8px 16px';
                backButton.style.border = 'none';
                backButton.style.borderRadius = '4px';
                backButton.style.backgroundColor = 'var(--primary-color)';
                backButton.style.color = 'white';
                backButton.style.cursor = 'pointer';
                
                backButton.addEventListener('click', () => {
                    emptyState.remove();
                    this.loadEvents();
                    
                    // 清空搜索框
                    const searchInput = document.querySelector('.calendar-search-input');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                });
                
                emptyState.appendChild(backButton);
                calendarBody.appendChild(emptyState);
            }
            
            return;
        }
        
        // 显示搜索结果摘要
        const searchResultSummary = document.createElement('div');
        searchResultSummary.className = 'calendar-search-summary';
        searchResultSummary.style.position = 'absolute';
        searchResultSummary.style.top = '70px';
        searchResultSummary.style.left = '50%';
        searchResultSummary.style.transform = 'translateX(-50%)';
        searchResultSummary.style.padding = '8px 16px';
        searchResultSummary.style.backgroundColor = 'var(--primary-color)';
        searchResultSummary.style.color = 'white';
        searchResultSummary.style.borderRadius = '20px';
        searchResultSummary.style.zIndex = '1002';
        searchResultSummary.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        searchResultSummary.style.display = 'flex';
        searchResultSummary.style.alignItems = 'center';
        searchResultSummary.style.gap = '10px';
        
        searchResultSummary.innerHTML = `
            <span><i class="fas fa-search"></i></span>
            <span>找到 ${matchedEvents.length} 个匹配"${query}"的事件</span>
            <button class="search-view-toggle-btn" style="background: none; border: none; color: white; cursor: pointer; margin: 0 5px;">
                <i class="fas fa-list"></i> 列表视图
            </button>
            <button class="search-view-next-btn" style="background: none; border: none; color: white; cursor: pointer; margin: 0 5px;">
                <i class="fas fa-arrow-down"></i> 下一个
            </button>
            <button class="clear-search-btn" style="background: none; border: none; color: white; cursor: pointer; margin-left: 5px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // 添加清除搜索按钮事件
        searchResultSummary.querySelector('.clear-search-btn').addEventListener('click', () => {
            searchResultSummary.remove();
            // 移除搜索结果列表
            const resultsList = document.querySelector('.calendar-search-results-list');
            if (resultsList) {
                resultsList.remove();
            }
            this.loadEvents();
            
            // 清空搜索框
            const searchInput = document.querySelector('.calendar-search-input');
            if (searchInput) {
                searchInput.value = '';
                const clearBtn = searchInput.parentElement.querySelector('.clear-search-btn');
                if (clearBtn) clearBtn.remove();
            }
        });
        
        // 创建一个搜索结果列表视图
        const searchResultsList = document.createElement('div');
        searchResultsList.className = 'calendar-search-results-list';
        searchResultsList.style.position = 'absolute';
        searchResultsList.style.top = '120px';
        searchResultsList.style.right = '20px';
        searchResultsList.style.width = '350px';
        searchResultsList.style.maxHeight = 'calc(100vh - 150px)';
        searchResultsList.style.overflowY = 'auto';
        searchResultsList.style.backgroundColor = 'var(--card-bg-color)';
        searchResultsList.style.borderRadius = '8px';
        searchResultsList.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        searchResultsList.style.zIndex = '1003';
        searchResultsList.style.padding = '12px';
        searchResultsList.style.display = 'none'; // 默认隐藏
        
        // 创建标题
        const resultsTitle = document.createElement('div');
        resultsTitle.style.fontWeight = 'bold';
        resultsTitle.style.fontSize = '16px';
        resultsTitle.style.marginBottom = '10px';
        resultsTitle.style.padding = '5px 0';
        resultsTitle.style.borderBottom = '1px solid var(--border-color)';
        resultsTitle.innerHTML = `<i class="fas fa-search"></i> 搜索结果 (${matchedEvents.length})`;
        searchResultsList.appendChild(resultsTitle);
        
        // 添加事件到结果列表
        matchedEvents.forEach((event, eventIndex) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.index = eventIndex;
            resultItem.style.padding = '10px';
            resultItem.style.marginBottom = '8px';
            resultItem.style.borderRadius = '6px';
            resultItem.style.backgroundColor = 'var(--bg-color)';
            resultItem.style.border = '1px solid var(--border-color)';
            resultItem.style.transition = 'all 0.2s';
            resultItem.style.cursor = 'pointer';
            
            // 鼠标悬停效果
            resultItem.addEventListener('mouseover', () => {
                resultItem.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                resultItem.style.transform = 'translateY(-2px)';
            });
            
            resultItem.addEventListener('mouseout', () => {
                resultItem.style.boxShadow = 'none';
                resultItem.style.transform = 'translateY(0)';
            });
            
            // 格式化事件日期
            let dateStr = '全天';
            let dateObj = null;
            if (event.startTime) {
                dateObj = new Date(event.startTime);
                dateStr = dateObj.toLocaleDateString('zh-CN') + ' ' + 
                         dateObj.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'});
            }
            
            // 高亮显示匹配的文本
            let highlightedName = event.name;
            if (event.name && event.name.toLowerCase().includes(query)) {
                highlightedName = highlightText(event.name, query);
            }
            
            resultItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <div style="font-weight: bold; color: var(--primary-color);">${highlightedName}</div>
                    <div style="color: var(--text-color-light); font-size: 12px; font-weight: bold;">${dateStr}</div>
                </div>
                ${event.location ? `<div style="font-size: 13px; margin-top: 5px;"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>` : ''}
                ${event.description ? `<div style="font-size: 13px; margin-top: 5px; color: var(--text-color-light);">${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}</div>` : ''}
            `;
            
            // 点击事件跳转到对应日期单元格并高亮显示
            resultItem.addEventListener('click', () => {
                // 去除所有之前的高亮
                document.querySelectorAll('.search-result-item.active').forEach(item => {
                    item.classList.remove('active');
                    item.style.backgroundColor = 'var(--bg-color)';
                });
                
                // 高亮当前选中的结果项
                resultItem.classList.add('active');
                resultItem.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
                
                // 跳转到对应的事件位置
                navigateToEvent(event, eventIndex);
            });
            
            searchResultsList.appendChild(resultItem);
        });
        
        // 添加列表/日历视图切换按钮事件
        searchResultSummary.querySelector('.search-view-toggle-btn').addEventListener('click', (e) => {
            const resultsList = document.querySelector('.calendar-search-results-list');
            if (resultsList) {
                // 切换显示/隐藏
                if (resultsList.style.display === 'none') {
                    resultsList.style.display = 'block';
                    e.target.closest('button').innerHTML = '<i class="fas fa-calendar"></i> 日历视图';
                } else {
                    resultsList.style.display = 'none';
                    e.target.closest('button').innerHTML = '<i class="fas fa-list"></i> 列表视图';
                }
            }
        });
        
        // 添加一个日期分组视图按钮
        const dateGroupBtn = document.createElement('button');
        dateGroupBtn.className = 'date-group-btn';
        dateGroupBtn.innerHTML = '<i class="fas fa-calendar-day"></i> 按日期分组';
        dateGroupBtn.style.background = 'none';
        dateGroupBtn.style.border = 'none';
        dateGroupBtn.style.color = 'white';
        dateGroupBtn.style.cursor = 'pointer';
        dateGroupBtn.style.marginLeft = '10px';
        searchResultSummary.appendChild(dateGroupBtn);
        
        // 添加按日期分组的功能
        dateGroupBtn.addEventListener('click', () => {
            const resultsList = document.querySelector('.calendar-search-results-list');
            if (resultsList) {
                // 已经按日期分组显示，则切换回普通显示
                if (resultsList.classList.contains('date-grouped')) {
                    resultsList.classList.remove('date-grouped');
                    dateGroupBtn.innerHTML = '<i class="fas fa-calendar-day"></i> 按日期分组';
                    
                    // 重建搜索结果列表
                    searchResultsList.innerHTML = '';
                    searchResultsList.appendChild(resultsTitle);
                    
                    // 添加事件到结果列表
                    matchedEvents.forEach((event, eventIndex) => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'search-result-item';
                        resultItem.dataset.index = eventIndex;
                        // ... 前面定义的样式和内容 ...
                        searchResultsList.appendChild(resultItem);
                    });
                } else {
                    // 按日期分组显示
                    resultsList.classList.add('date-grouped');
                    dateGroupBtn.innerHTML = '<i class="fas fa-list"></i> 取消按日期分组';
                    
                    // 按日期分组事件
                    const eventsByDate = {};
                    matchedEvents.forEach((event) => {
                        let dateKey = '未知日期';
                        if (event.startTime) {
                            const eventDate = new Date(event.startTime);
                            dateKey = eventDate.toLocaleDateString('zh-CN');
                        }
                        
                        if (!eventsByDate[dateKey]) {
                            eventsByDate[dateKey] = [];
                        }
                        eventsByDate[dateKey].push(event);
                    });
                    
                    // 重建搜索结果列表
                    searchResultsList.innerHTML = '';
                    searchResultsList.appendChild(resultsTitle);
                    
                    // 按日期排序
                    const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
                        // 将未知日期排在最后
                        if (a === '未知日期') return 1;
                        if (b === '未知日期') return -1;
                        
                        // 比较日期
                        const dateA = new Date(a);
                        const dateB = new Date(b);
                        return dateA - dateB;
                    });
                    
                    // 添加分组事件
                    sortedDates.forEach((dateStr) => {
                        const dateGroup = document.createElement('div');
                        dateGroup.className = 'date-group';
                        dateGroup.style.marginBottom = '15px';
                        
                        const dateHeader = document.createElement('div');
                        dateHeader.className = 'date-group-header';
                        dateHeader.style.backgroundColor = 'var(--primary-color-light)';
                        dateHeader.style.color = 'var(--primary-color)';
                        dateHeader.style.padding = '5px 10px';
                        dateHeader.style.fontWeight = 'bold';
                        dateHeader.style.borderRadius = '4px';
                        dateHeader.style.marginBottom = '8px';
                        dateHeader.innerHTML = `<i class="fas fa-calendar-day"></i> ${dateStr} <span style="font-weight: normal; font-size: 12px;">(${eventsByDate[dateStr].length}个事件)</span>`;
                        
                        dateGroup.appendChild(dateHeader);
                        
                        // 添加事件到日期组
                        eventsByDate[dateStr].forEach((event) => {
                            const resultItem = document.createElement('div');
                            resultItem.className = 'search-result-item';
                            resultItem.style.padding = '10px';
                            resultItem.style.marginBottom = '8px';
                            resultItem.style.borderRadius = '6px';
                            resultItem.style.backgroundColor = 'var(--bg-color)';
                            resultItem.style.border = '1px solid var(--border-color)';
                            resultItem.style.transition = 'all 0.2s';
                            resultItem.style.cursor = 'pointer';
                            
                            // 高亮显示匹配的文本
                            let highlightedName = event.name;
                            if (event.name && event.name.toLowerCase().includes(query)) {
                                highlightedName = highlightText(event.name, query);
                            }
                            
                            // 获取事件时间
                            let timeStr = '全天';
                            if (event.startTime) {
                                const eventTime = new Date(event.startTime);
                                timeStr = eventTime.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'});
                            }
                            
                            resultItem.innerHTML = `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <div style="font-weight: bold; color: var(--primary-color);">${highlightedName}</div>
                                    <div style="color: var(--text-color-light); font-size: 12px;">${timeStr}</div>
                                </div>
                                ${event.location ? `<div style="font-size: 13px; margin-top: 5px;"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>` : ''}
                                ${event.description ? `<div style="font-size: 13px; margin-top: 5px; color: var(--text-color-light);">${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}</div>` : ''}
                            `;
                            
                            // 点击事件跳转到对应日期单元格并高亮显示
                            resultItem.addEventListener('click', () => {
                                // 获取事件在matchedEvents中的索引
                                const eventIndex = matchedEvents.indexOf(event);
                                if (eventIndex !== -1) {
                                    navigateToEvent(event, eventIndex);
                                }
                            });
                            
                            dateGroup.appendChild(resultItem);
                        });
                        
                        searchResultsList.appendChild(dateGroup);
                    });
                }
                
                // 显示结果列表
                resultsList.style.display = 'block';
                
                // 更新视图切换按钮
                const viewToggleBtn = searchResultSummary.querySelector('.search-view-toggle-btn');
                if (viewToggleBtn) {
                    viewToggleBtn.innerHTML = '<i class="fas fa-calendar"></i> 日历视图';
                }
            }
        });
        
        // 当前显示的结果索引
        let currentResultIndex = 0;
        
        // 添加下一个结果按钮事件
        searchResultSummary.querySelector('.search-view-next-btn').addEventListener('click', () => {
            // 循环切换到下一个结果
            currentResultIndex = (currentResultIndex + 1) % matchedEvents.length;
            
            // 高亮列表中的当前项
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.classList.remove('active');
                item.style.backgroundColor = 'var(--bg-color)';
            });
            
            const currentItem = document.querySelector(`.search-result-item[data-index="${currentResultIndex}"]`);
            if (currentItem) {
                currentItem.classList.add('active');
                currentItem.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
                
                // 如果列表可见，滚动到当前项
                const resultsList = document.querySelector('.calendar-search-results-list');
                if (resultsList && resultsList.style.display !== 'none') {
                    currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
            
            // 导航到对应事件
            navigateToEvent(matchedEvents[currentResultIndex], currentResultIndex);
        });
        
        document.body.appendChild(searchResultSummary);
        document.body.appendChild(searchResultsList);
        
        // 显示匹配的事件并添加高亮效果
        const eventElements = [];
        const eventCells = [];
        matchedEvents.forEach((event, index) => {
            let eventDate;
            
            if (event.startTime) {
                eventDate = new Date(event.startTime);
            } else {
                // 没有开始时间的事件放在当前日期显示
                eventDate = new Date();
            }
            
            // 使用新的findDateCell方法查找单元格
            let cell = this.findDateCell(eventDate);
            
            if (!cell) {
                console.log(`找不到日期 ${eventDate.toISOString().slice(0, 10)} 的单元格，尝试调整视图`);
                
                // 根据当前视图类型处理
                switch (this.currentView) {
                    case '年':
                        // 对于年视图，尝试找到对应月份的单元格
                    cell = document.querySelector(`.calendar_default_cell[data-month="${eventDate.getMonth() + 1}"][data-year="${eventDate.getFullYear()}"]`);
                        // 如果找不到且年份不同，提示用户需要切换年份视图
                        if (!cell && eventDate.getFullYear() !== this.currentDate.getFullYear()) {
                            console.log(`事件 "${event.name}" 在 ${eventDate.getFullYear()}年，当前显示 ${this.currentDate.getFullYear()}年`);
                        }
                        break;
                        
                    case '月':
                    case '周':
                        // 对于月视图和周视图，如果事件不在当前范围内，记录但不显示
                        console.log(`事件 "${event.name}" (${eventDate.toLocaleDateString()}) 不在当前视图范围内`);
                        break;
                        
                    case '日':
                        // 对于日视图，只有当日期匹配当前日期时才显示
                        if (eventDate.toDateString() === this.currentDate.toDateString()) {
                            cell = document.querySelector('.calendar_default_cell');
                        }
                        break;
                }
            }
            
            if (!cell) {
                // 如果仍然找不到对应的单元格，跳过此事件的处理
                return;
            }
            
            // 存储单元格引用以便后续导航
            eventCells.push(cell);
            
            // 高亮包含搜索结果的日期单元格
            cell.style.boxShadow = '0 0 0 2px var(--primary-color)';
            cell.style.zIndex = '5';
            cell.style.position = 'relative';
            
            // 添加结果计数标记
            const resultBadge = document.createElement('div');
            resultBadge.className = 'search-result-badge';
            resultBadge.style.position = 'absolute';
            resultBadge.style.top = '3px';
            resultBadge.style.right = '3px';
            resultBadge.style.backgroundColor = 'var(--primary-color)';
            resultBadge.style.color = 'white';
            resultBadge.style.borderRadius = '50%';
            resultBadge.style.width = '20px';
            resultBadge.style.height = '20px';
            resultBadge.style.display = 'flex';
            resultBadge.style.alignItems = 'center';
            resultBadge.style.justifyContent = 'center';
            resultBadge.style.fontSize = '12px';
            resultBadge.style.fontWeight = 'bold';
            resultBadge.style.zIndex = '10';
            resultBadge.textContent = index + 1;
            cell.appendChild(resultBadge);
            
            // 添加日期显示标签
            const dateLabel = document.createElement('div');
            dateLabel.className = 'search-date-label';
            dateLabel.style.position = 'absolute';
            dateLabel.style.top = '3px';
            dateLabel.style.left = '3px';
            dateLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            dateLabel.style.color = 'white';
            dateLabel.style.borderRadius = '4px';
            dateLabel.style.padding = '2px 6px';
            dateLabel.style.fontSize = '11px';
            dateLabel.style.fontWeight = 'bold';
            dateLabel.style.zIndex = '10';
            dateLabel.textContent = eventDate.toLocaleDateString('zh-CN');
            
            // 只在非日视图中显示日期标签
            if (this.currentView !== '日') {
                cell.appendChild(dateLabel);
            }
            
            const eventsContainer = cell.querySelector('.cell-events-container');
            if (!eventsContainer) return;
            
            const eventElement = this.createEventElement(event);
            
            // 存储事件元素引用以便后续导航
            eventElements.push(eventElement);
            eventElement.dataset.index = index;
            
            // 添加日期信息到事件元素
            const dateInfo = document.createElement('div');
            dateInfo.className = 'event-date-info';
            dateInfo.style.fontSize = '11px';
            dateInfo.style.fontWeight = 'bold';
            dateInfo.style.color = 'var(--primary-color)';
            dateInfo.style.marginTop = '2px';
            dateInfo.style.textAlign = 'right';
            if (event.startTime) {
                const eventDateTime = new Date(event.startTime);
                dateInfo.textContent = eventDateTime.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
            }
            eventElement.appendChild(dateInfo);
            
            // 高亮显示匹配的事件
            eventElement.style.boxShadow = '0 0 8px var(--primary-color)';
            eventElement.style.border = '1px solid var(--primary-color)';
            eventElement.style.transform = 'scale(1.03)';
            eventElement.style.zIndex = '10';
            eventElement.style.transition = 'all 0.3s';
            eventElement.style.animation = 'pulse 1.5s infinite alternate';
            
            // 添加搜索高亮动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { box-shadow: 0 0 5px var(--primary-color); }
                    100% { box-shadow: 0 0 12px var(--primary-color); }
                }
            `;
            document.head.appendChild(style);
            
            // 突出显示匹配的文本
            if (event.name && event.name.toLowerCase().includes(query)) {
                const eventInner = eventElement.querySelector('.calendar_default_event_inner');
                if (eventInner) {
                    const nameSpan = eventInner.querySelector('span:nth-child(2)');
                    if (nameSpan) {
                        nameSpan.innerHTML = highlightText(event.name, query);
                    }
                }
            }
            
            eventsContainer.appendChild(eventElement);
            eventElement.style.animationDelay = `${index * 0.1}s`;
        });
        
        // 自动滚动到第一个结果
        if (eventCells.length > 0) {
            setTimeout(() => {
                navigateToEvent(matchedEvents[0], 0);
            }, 100);
        }
        
        // 在日历中导航到特定事件的辅助函数
        function navigateToEvent(event, index) {
            const cell = eventCells[index];
            const eventElement = eventElements[index];
            
            if (!cell) {
                console.log('无法找到对应的日期单元格');
                
                // 尝试重新查找或切换视图
                if (event.startTime) {
                    const eventDate = new Date(event.startTime);
                    
                    // 切换到包含此事件的月份
                    if (confirm(`要切换到 ${eventDate.getFullYear()}年${eventDate.getMonth() + 1}月 以查看此事件吗？`)) {
                        CalendarManager.currentDate = new Date(eventDate);
                        CalendarManager.currentView = '月';
                        CalendarManager.refreshCalendar();
                        
                        // 保存搜索词，以便在新视图中重新搜索
                        const searchQuery = document.querySelector('.calendar-search-input').value;
                        setTimeout(() => {
                            CalendarManager.searchEvents(searchQuery);
                        }, 300);
                    }
                }
                return;
            }
            
            // 移除所有闪烁动画
            document.querySelectorAll('.search-pulse-animation').forEach(el => el.remove());
            
            // 确保当前单元格在视图中可见
            const calendarBody = document.querySelector('.calendar-body-container');
            if (calendarBody) {
                // 记录滚动前的位置
                const originalScrollTop = calendarBody.scrollTop;
                
                // 使单元格滚动到视图中
                try {
                    // 确保日期单元格在视图可见区域中居中
                    if (document.body.contains(cell)) {
                        // 计算单元格相对于容器的位置
                        const cellRect = cell.getBoundingClientRect();
                        const containerRect = calendarBody.getBoundingClientRect();
                        
                        // 计算需要滚动的距离，使单元格居中
                        const scrollNeeded = cellRect.top - containerRect.top - (containerRect.height / 2) + (cellRect.height / 2);
                        
                        // 平滑滚动
                        calendarBody.scrollBy({
                            top: scrollNeeded,
                            behavior: 'smooth'
                        });
        } else {
                        // 如果元素不在DOM中，直接使用scrollIntoView
                        cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } catch (error) {
                    console.error('滚动到单元格失败，尝试备用方法', error);
                    try {
                        // 备用方法
                        cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } catch (e) {
                        console.error('备用滚动方法也失败', e);
                    }
                }
                
                // 添加突出显示动画
                setTimeout(() => {
                    try {
                        // 创建一个突出显示的动画效果
                        const pulseAnimation = document.createElement('div');
                        pulseAnimation.className = 'search-pulse-animation';
                        pulseAnimation.style.position = 'absolute';
                        pulseAnimation.style.top = '0';
                        pulseAnimation.style.left = '0';
                        pulseAnimation.style.right = '0';
                        pulseAnimation.style.bottom = '0';
                        pulseAnimation.style.border = '3px solid var(--primary-color)';
                        pulseAnimation.style.borderRadius = '4px';
                        pulseAnimation.style.animation = 'searchPulse 1.5s 3';
                        pulseAnimation.style.pointerEvents = 'none';
                        pulseAnimation.style.zIndex = '11';
                        
                        // 添加动画关键帧
                        if (!document.querySelector('style[data-animation="searchPulse"]')) {
                            const style = document.createElement('style');
                            style.dataset.animation = 'searchPulse';
                            style.textContent = `
                                @keyframes searchPulse {
                                    0% { opacity: 0; }
                                    50% { opacity: 1; }
                                    100% { opacity: 0; }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        
                        // 添加到单元格
                        if (document.body.contains(cell)) {
                            cell.appendChild(pulseAnimation);
                            
                            // 几秒后移除动画
                            setTimeout(() => {
                                if (pulseAnimation.parentNode) {
                                    pulseAnimation.remove();
                                }
                            }, 5000);
                        }
                    } catch (error) {
                        console.error('创建动画效果失败', error);
                    }
                }, 300); // 等待滚动完成
            }
            
            // 更新当前结果索引显示
            if (window.UIManager) {
                UIManager.showNotification(`显示第 ${index + 1}/${matchedEvents.length} 个搜索结果`);
            }
            
            // 高亮并滚动到事件元素
            if (eventElement && document.body.contains(eventElement)) {
                setTimeout(() => {
                    try {
                        // 移除其他事件元素的特殊高亮
                        eventElements.forEach(el => {
                            if (el !== eventElement && document.body.contains(el)) {
                                el.style.transform = 'scale(1.03)';
                                el.style.boxShadow = '0 0 8px var(--primary-color)';
                            }
                        });
                        
                        // 特别高亮当前事件
                        eventElement.style.transform = 'scale(1.05)';
                        eventElement.style.boxShadow = '0 0 15px var(--primary-color)';
                        eventElement.style.zIndex = '20';
                        
                        // 添加闪烁边框
                        eventElement.style.animation = 'eventHighlight 2s infinite alternate';
                        
                        // 添加事件高亮动画
                        if (!document.querySelector('style[data-animation="eventHighlight"]')) {
                            const style = document.createElement('style');
                            style.dataset.animation = 'eventHighlight';
                            style.textContent = `
                                @keyframes eventHighlight {
                                    0% { box-shadow: 0 0 8px var(--primary-color); }
                                    100% { box-shadow: 0 0 20px var(--primary-color); }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        
                        // 确保事件在视图中可见
                        const eventsContainer = cell.querySelector('.cell-events-container');
                        if (eventsContainer && document.body.contains(eventElement)) {
                            // 确保事件元素可见
                            const eventRect = eventElement.getBoundingClientRect();
                            const containerRect = eventsContainer.getBoundingClientRect();
                            
                            // 如果事件不在容器可见区域内，滚动到它
                            if (eventRect.top < containerRect.top || eventRect.bottom > containerRect.bottom) {
                                eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }
                        
                        // 创建一个指示箭头指向事件
                        const arrow = document.createElement('div');
                        arrow.className = 'event-pointer-arrow';
                        arrow.style.position = 'absolute';
                        arrow.style.left = '-25px';
                        arrow.style.top = '50%';
                        arrow.style.transform = 'translateY(-50%)';
                        arrow.style.color = 'var(--primary-color)';
                        arrow.style.fontSize = '20px';
                        arrow.style.fontWeight = 'bold';
                        arrow.style.animation = 'arrowBounce 1s infinite alternate';
                        arrow.innerHTML = '➡️';
                        
                        // 添加箭头动画
                        if (!document.querySelector('style[data-animation="arrowBounce"]')) {
                            const style = document.createElement('style');
                            style.dataset.animation = 'arrowBounce';
                            style.textContent = `
                                @keyframes arrowBounce {
                                    0% { transform: translateY(-50%) translateX(0); }
                                    100% { transform: translateY(-50%) translateX(5px); }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        
                        // 添加箭头到事件元素
                        if (document.body.contains(eventElement)) {
                            eventElement.style.position = 'relative';
                            eventElement.appendChild(arrow);
                            
                            // 几秒后移除箭头
                            setTimeout(() => {
                                if (arrow.parentNode) {
                                    arrow.remove();
                                }
                            }, 5000);
                        }
                    } catch (error) {
                        console.error('高亮事件元素失败', error);
                    }
                }, 500); // 等待单元格滚动完成后再处理事件元素
            }
        }
        
        // 显示通知
            if (window.UIManager) {
                UIManager.showNotification(`找到 ${matchedEvents.length} 个匹配事件`);
            }
        
        // 高亮搜索匹配文本的辅助函数
        function highlightText(text, query) {
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<span style="background-color: rgba(255, 255, 0, 0.4); border-radius: 2px; padding: 0 2px;">$1</span>');
        }
    },
    
    /**
     * 清除搜索状态
     */
    clearSearch() {
        // 移除搜索结果摘要
        const searchSummary = document.querySelector('.calendar-search-summary');
        if (searchSummary) {
            searchSummary.remove();
        }
        
        // 移除搜索结果列表
        const searchResultsList = document.querySelector('.calendar-search-results-list');
        if (searchResultsList) {
            searchResultsList.remove();
        }
        
        // 移除空状态提示
        const emptyState = document.querySelector('.calendar-search-empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        // 清除日期单元格高亮和动画
        const highlightedCells = document.querySelectorAll('.calendar_default_cell');
        highlightedCells.forEach(cell => {
            cell.style.boxShadow = '';
            cell.style.zIndex = '';
            
            // 移除闪烁动画元素
            const pulseAnimation = cell.querySelector('.search-pulse-animation');
            if (pulseAnimation) {
                pulseAnimation.remove();
            }
            
            // 移除结果序号标记
            const resultBadge = cell.querySelector('.search-result-badge');
            if (resultBadge) {
                resultBadge.remove();
            }
            
            // 移除日期标签
            const dateLabel = cell.querySelector('.search-date-label');
            if (dateLabel) {
                dateLabel.remove();
            }
        });
        
        // 重置事件元素的样式
        const eventElements = document.querySelectorAll('.calendar-event-container');
        eventElements.forEach(el => {
            // 恢复默认样式
            const eventEl = el.querySelector('.calendar_default_event');
            if (eventEl) {
                eventEl.style.boxShadow = '';
                eventEl.style.border = '';
                eventEl.style.transform = '';
                eventEl.style.zIndex = '';
                eventEl.style.animation = '';
                eventEl.style.transition = '';
                
                // 移除箭头指示器
                const arrow = el.querySelector('.event-pointer-arrow');
                if (arrow) {
                    arrow.remove();
                }
                
                // 移除事件日期信息
                const dateInfo = eventEl.querySelector('.event-date-info');
                if (dateInfo) {
                    dateInfo.remove();
                }
                
                // 恢复事件内部文本（移除高亮）
                const eventInner = eventEl.querySelector('.calendar_default_event_inner');
                if (eventInner) {
                    // 查找所有带有样式的span元素，还原为纯文本
                    const highlightedSpans = eventInner.querySelectorAll('span[style*="background-color"]');
                    highlightedSpans.forEach(span => {
                        // 获取内部文本并替换span
                        const text = span.textContent;
                        const textNode = document.createTextNode(text);
                        span.parentNode.replaceChild(textNode, span);
                    });
                }
            }
        });
        
        // 移除动画样式表
        const animationStyles = document.querySelectorAll('style[data-animation]');
        animationStyles.forEach(style => {
            style.remove();
        });
        
        // 清空搜索框
        const searchInput = document.querySelector('.calendar-search-input');
        if (searchInput) {
            searchInput.value = '';
            const clearBtn = searchInput.parentElement.querySelector('.clear-search-btn');
            if (clearBtn) clearBtn.remove();
        }
    },
    
    /**
     * 计算倒数天数（用于倒数日）
     * @param {Object} countdown 倒数日对象
     * @returns {number} 倒数天数
     */
    calculateDays(countdown) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 解析目标日期，确保正确解析格式
        const dateParts = countdown.date.split('-');
        if (dateParts.length !== 3) {
            console.error('日期格式错误:', countdown.date);
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
            console.error('无效的日期:', countdown.date);
            return 0;
        }
        
        if (countdown.type === 'yearly') {
            // 对于每年重复的日期
            const currentYear = today.getFullYear();
            targetDate.setFullYear(currentYear);
            
            // 如果今年的日期已过，计算到明年的天数
            if (targetDate < today) {
                targetDate.setFullYear(currentYear + 1);
            }
        }
        
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 仅当切换到日历视图时才初始化日历
    const calendarViewBtn = document.getElementById('calendar-view-btn');
    if (calendarViewBtn) {
        calendarViewBtn.addEventListener('click', () => {
            CalendarManager.init();
        });
    }
});

// 导出
window.CalendarManager = CalendarManager; 