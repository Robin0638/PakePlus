/**
 * Item管理模块
 * 负责大Item视图的功能实现
 */

const ProjectManager = {
    /**
     * 初始化Item管理器
     */
    init() {
        console.log('初始化Item管理器');
        
        // 缓存DOM元素
        this.cacheElements();
        
        // 绑定Things
        this.bindEvents();
        
        // 加载Item列表
        this.loadProjects();
    },
    
    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            projectsContainer: document.getElementById('projects-container'),
            projectsView: document.getElementById('projects')
        };
    },
    
    /**
     * 绑定Things
     */
    bindEvents() {
        // 绑定导航按钮
        const navProjectsBtn = document.getElementById('nav-projects');
        if (navProjectsBtn) {
            navProjectsBtn.addEventListener('click', () => {
                UIManager.switchView('projects');
                this.loadProjects(); // 切换到Item视图时重新加载Item
            });
        }
    },
    
    /**
     * 加载Item列表
     */
    loadProjects() {
        if (!this.elements.projectsContainer) return;
        
        // 清空Item容器
        this.elements.projectsContainer.innerHTML = '';
        
        // 获取所有Item
        const projects = StorageManager.getProjects();
        
        // 如果没有Item，显示提示信息
        if (!projects || projects.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-projects-message';
            emptyMessage.innerHTML = `
                <div class="empty-icon">📋</div>
                <h3>还没有大Item</h3>
                <p>创建一个大Item来管理相关的任务和目标</p>
                <button class="create-project-btn">创建大Item</button>
            `;
            
            this.elements.projectsContainer.appendChild(emptyMessage);
            
            // 绑定创建Item按钮Things
            const createProjectBtn = emptyMessage.querySelector('.create-project-btn');
            if (createProjectBtn) {
                createProjectBtn.addEventListener('click', () => {
                    this.showCreateProjectDialog();
                });
            }
            
            return;
        }
        
        // 创建Item卡片
        projects.forEach(project => {
            const projectCard = this.createProjectCard(project);
            this.elements.projectsContainer.appendChild(projectCard);
        });
    },
    
    /**
     * 创建Item卡片
     * @param {Object} project Item对象
     * @returns {HTMLElement} Item卡片元素
     */
    createProjectCard(project) {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.id = project.id;
        
        // Item头部
        const projectHeader = document.createElement('div');
        projectHeader.className = 'project-header';
        
        // ItemTitle
        const projectTitle = document.createElement('h3');
        projectTitle.textContent = project.name;
        
        // Item操作按钮容器
        const projectActions = document.createElement('div');
        projectActions.className = 'project-actions';
        
        // 组装Item头部
        projectHeader.appendChild(projectTitle);
        projectHeader.appendChild(projectActions);
        
        // Item日期信息
        const projectDates = document.createElement('div');
        projectDates.className = 'project-dates';
        
        // 开始日期
        if (project.startDate) {
            const startDate = new Date(project.startDate);
            const startDateStr = startDate.toLocaleDateString();
            const startDateEl = document.createElement('div');
            startDateEl.innerHTML = `<i class="far fa-calendar-plus"></i> 开始：${startDateStr}`;
            projectDates.appendChild(startDateEl);
        }
        
        // 截止日期
        if (project.deadline) {
            const deadline = new Date(project.deadline);
            const deadlineStr = deadline.toLocaleDateString();
            const deadlineEl = document.createElement('div');
            deadlineEl.innerHTML = `<i class="far fa-calendar-check"></i> 截止：${deadlineStr}`;
            
            // 计算剩余天数
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            
            // 创建倒计时Label
            const countdownEl = document.createElement('span');
            countdownEl.className = 'deadline-countdown';
            
            // 根据剩余timeSet状态
            if (daysLeft < 0) {
                countdownEl.classList.add('overdue');
                countdownEl.textContent = `Until today' : '${daysLeft} days remaining`;
            } else if (daysLeft <= 3) {
                countdownEl.classList.add('urgent');
                countdownEl.textContent = daysLeft === 0 ? 'Deadline today' : `${daysLeft} days remaining`;
            } else {
                countdownEl.textContent = `${daysLeft} days remaining`;
            }
            
            deadlineEl.appendChild(countdownEl);
            projectDates.appendChild(deadlineEl);
        }
        
        // Item进度
        const projectProgress = document.createElement('div');
        projectProgress.className = 'project-progress';
        
        // 获取Item的最新Stats
        const projectStats = StorageManager.getProjectStats(project.id);
        const totalTasks = projectStats.total || 0;
        const completedTasks = projectStats.completed || 0;
        const progressPercent = projectStats.progress || 0;
        
        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = `${progressPercent}%`;
        progressBar.appendChild(progressFill);
        
        // 进度文本
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.textContent = `${progressPercent}% Completed`;
        
        // 组装进度部分
        projectProgress.appendChild(progressBar);
        projectProgress.appendChild(progressText);
        
        // Item统计
        const projectStatsEl = document.createElement('div');
        projectStatsEl.className = 'project-stats';
        
        // 任务统计
        const tasksStats = document.createElement('div');
        tasksStats.textContent = `任务：${completedTasks}/${totalTasks}`;
        
        // 优先级
        const priorityStats = document.createElement('div');
        priorityStats.textContent = `优先级：${this.getPriorityText(project.priority)}`;
        
        // 组装统计部分
        projectStatsEl.appendChild(tasksStats);
        projectStatsEl.appendChild(priorityStats);
        
        // Item按钮容器
        const projectButtons = document.createElement('div');
        projectButtons.className = 'project-buttons';
        
        // 添加任务按钮
        const addTaskBtn = document.createElement('button');
        addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>添加任务';
        addTaskBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止Things冒泡
            this.showAddTaskDialog(project.id);
        });
        
        // DeletItem按钮
        const deleteProjectBtn = document.createElement('button');
        deleteProjectBtn.innerHTML = '<i class="fas fa-trash"></i>Delet';
        deleteProjectBtn.className = 'delete-btn';
        deleteProjectBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止Things冒泡
            this.deleteProject(project.id);
        });
        
        // 组装按钮容器
        projectButtons.appendChild(addTaskBtn);
        projectButtons.appendChild(deleteProjectBtn);
        
        // 组装整个卡片
        projectCard.appendChild(projectHeader);
        projectCard.appendChild(projectDates);
        projectCard.appendChild(projectProgress);
        projectCard.appendChild(projectStatsEl);
        projectCard.appendChild(projectButtons);
        
        return projectCard;
    },
    
    /**
     * 获取优先级文本
     * @param {Number} priority 优先级数值
     * @returns {String} 优先级文本
     */
    getPriorityText(priority) {
        switch (priority) {
            case 3: return 'high';
            case 2: return 'medium';
            case 1: return '低';
            default: return 'medium';
        }
    },
    
    /**
     * 计算Item进度
     * @param {Object} project Item对象
     * @returns {Number} 进度百分比
     */
    calculateProgress(project) {
        if (!project.tasks || project.tasks.length === 0) return 0;
        
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(task => task.completed).length;
        
        return Math.round((completedTasks / totalTasks) * 100);
    },
    
    /**
     * 显示创建Item对话框
     */
    showCreateProjectDialog() {
        // 这里可以实现创建Item的对话框
        alert('创建Item功能还在开发medium');
    },
    
    /**
     * 显示添加任务对话框
     * @param {String} projectId ItemID
     */
    showAddTaskDialog(projectId) {
        // 这里可以实现添加任务的对话框
        alert(`添加任务功能还在开发medium\n\nItemID: ${projectId}`);
    },
    
    /**
     * EditItem
     * @param {String} projectId ItemID
     */
    editProject(projectId) {
        // 功能已Close
        console.log('ItemEdit功能已Close');
    },
    
    /**
     * DeletItem
     * @param {String} projectId ItemID
     */
    deleteProject(projectId) {
        // 防止重复调用
        if (this._isDeletingProject) {
            return;
        }
        
        this._isDeletingProject = true;
        
        if (!confirm('确定要Delet这个Item吗？所有相关任务也会被Delet。')) {
            this._isDeletingProject = false;
            return;
        }
        
        // 使用StorageManager的方法DeletItem
        const success = StorageManager.deleteProject(projectId);
        
        if (success) {
            // 重新加载Item列表
            this.loadProjects();
            
            // 显示通知
            UIManager.showNotification('Item已Delet');
        } else {
            UIManager.showNotification('DeletItem失败', 'error');
        }
        
        // 重置状态
        this._isDeletingProject = false;
    },

    getOrCreateProject(projectName) {
        // 直接调用StorageManager的方法，确保Item管理逻辑的一致性
        return StorageManager.getOrCreateProject(projectName);
    }
};

// 导出模块
window.ProjectManager = ProjectManager; 