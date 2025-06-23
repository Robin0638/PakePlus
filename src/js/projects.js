/**
 * 项目管理模块
 * 负责大项目视图的功能实现
 */

const ProjectManager = {
    /**
     * 初始化项目管理器
     */
    init() {
        console.log('初始化项目管理器');
        
        // 缓存DOM元素
        this.cacheElements();
        
        // 绑定事件
        this.bindEvents();
        
        // 加载项目列表
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
     * 绑定事件
     */
    bindEvents() {
        // 绑定导航按钮
        const navProjectsBtn = document.getElementById('nav-projects');
        if (navProjectsBtn) {
            navProjectsBtn.addEventListener('click', () => {
                UIManager.switchView('projects');
                this.loadProjects(); // 切换到项目视图时重新加载项目
            });
        }
    },
    
    /**
     * 加载项目列表
     */
    loadProjects() {
        if (!this.elements.projectsContainer) return;
        
        // 清空项目容器
        this.elements.projectsContainer.innerHTML = '';
        
        // 获取所有项目
        const projects = StorageManager.getProjects();
        
        // 如果没有项目，显示提示信息
        if (!projects || projects.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-projects-message';
            emptyMessage.innerHTML = `
                <div class="empty-icon">📋</div>
                <h3>还没有大项目</h3>
                <p>创建一个大项目来管理相关的任务和目标</p>
                <button class="create-project-btn">创建大项目</button>
            `;
            
            this.elements.projectsContainer.appendChild(emptyMessage);
            
            // 绑定创建项目按钮事件
            const createProjectBtn = emptyMessage.querySelector('.create-project-btn');
            if (createProjectBtn) {
                createProjectBtn.addEventListener('click', () => {
                    this.showCreateProjectDialog();
                });
            }
            
            return;
        }
        
        // 创建项目卡片
        projects.forEach(project => {
            const projectCard = this.createProjectCard(project);
            this.elements.projectsContainer.appendChild(projectCard);
        });
    },
    
    /**
     * 创建项目卡片
     * @param {Object} project 项目对象
     * @returns {HTMLElement} 项目卡片元素
     */
    createProjectCard(project) {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.id = project.id;
        
        // 项目头部
        const projectHeader = document.createElement('div');
        projectHeader.className = 'project-header';
        
        // 项目标题
        const projectTitle = document.createElement('h3');
        projectTitle.textContent = project.name;
        
        // 项目操作按钮容器
        const projectActions = document.createElement('div');
        projectActions.className = 'project-actions';
        
        // 组装项目头部
        projectHeader.appendChild(projectTitle);
        projectHeader.appendChild(projectActions);
        
        // 项目日期信息
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
            
            // 创建倒计时标签
            const countdownEl = document.createElement('span');
            countdownEl.className = 'deadline-countdown';
            
            // 根据剩余时间设置状态
            if (daysLeft < 0) {
                countdownEl.classList.add('overdue');
                countdownEl.textContent = `已逾期${Math.abs(daysLeft)}天`;
            } else if (daysLeft <= 3) {
                countdownEl.classList.add('urgent');
                countdownEl.textContent = daysLeft === 0 ? '今天截止' : `剩余${daysLeft}天`;
            } else {
                countdownEl.textContent = `剩余${daysLeft}天`;
            }
            
            deadlineEl.appendChild(countdownEl);
            projectDates.appendChild(deadlineEl);
        }
        
        // 项目进度
        const projectProgress = document.createElement('div');
        projectProgress.className = 'project-progress';
        
        // 获取项目的最新统计信息
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
        progressText.textContent = `${progressPercent}% 完成`;
        
        // 组装进度部分
        projectProgress.appendChild(progressBar);
        projectProgress.appendChild(progressText);
        
        // 项目统计
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
        
        // 项目按钮容器
        const projectButtons = document.createElement('div');
        projectButtons.className = 'project-buttons';
        
        // 添加任务按钮
        const addTaskBtn = document.createElement('button');
        addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>添加任务';
        addTaskBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            this.showAddTaskDialog(project.id);
        });
        
        // 删除项目按钮
        const deleteProjectBtn = document.createElement('button');
        deleteProjectBtn.innerHTML = '<i class="fas fa-trash"></i>删除';
        deleteProjectBtn.className = 'delete-btn';
        deleteProjectBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
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
            case 3: return '高';
            case 2: return '中';
            case 1: return '低';
            default: return '中';
        }
    },
    
    /**
     * 计算项目进度
     * @param {Object} project 项目对象
     * @returns {Number} 进度百分比
     */
    calculateProgress(project) {
        if (!project.tasks || project.tasks.length === 0) return 0;
        
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(task => task.completed).length;
        
        return Math.round((completedTasks / totalTasks) * 100);
    },
    
    /**
     * 显示创建项目对话框
     */
    showCreateProjectDialog() {
        // 这里可以实现创建项目的对话框
        alert('创建项目功能还在开发中');
    },
    
    /**
     * 显示添加任务对话框
     * @param {String} projectId 项目ID
     */
    showAddTaskDialog(projectId) {
        // 这里可以实现添加任务的对话框
        alert(`添加任务功能还在开发中\n\n项目ID: ${projectId}`);
    },
    
    /**
     * 编辑项目
     * @param {String} projectId 项目ID
     */
    editProject(projectId) {
        // 功能已关闭
        console.log('项目编辑功能已关闭');
    },
    
    /**
     * 删除项目
     * @param {String} projectId 项目ID
     */
    deleteProject(projectId) {
        // 防止重复调用
        if (this._isDeletingProject) {
            return;
        }
        
        this._isDeletingProject = true;
        
        if (!confirm('确定要删除这个项目吗？所有相关任务也会被删除。')) {
            this._isDeletingProject = false;
            return;
        }
        
        // 使用StorageManager的方法删除项目
        const success = StorageManager.deleteProject(projectId);
        
        if (success) {
            // 重新加载项目列表
            this.loadProjects();
            
            // 显示通知
            UIManager.showNotification('项目已删除');
        } else {
            UIManager.showNotification('删除项目失败', 'error');
        }
        
        // 重置状态
        this._isDeletingProject = false;
    },

    getOrCreateProject(projectName) {
        // 直接调用StorageManager的方法，确保项目管理逻辑的一致性
        return StorageManager.getOrCreateProject(projectName);
    }
};

// 导出模块
window.ProjectManager = ProjectManager; 