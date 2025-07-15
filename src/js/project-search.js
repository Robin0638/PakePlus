/**
 * 项目搜索模块
 * 负责大项目视图的搜索功能实现
 */

const ProjectSearch = {
    /**
     * 初始化搜索功能
     */
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.searchContainer = document.createElement('div');
        this.searchContainer.className = 'project-search-container';
        this.searchContainer.innerHTML = `
            <div class="project-search-box">
                <input type="text" class="project-search-input" placeholder="搜索项目名称">
                <button class="project-search-clear">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // 获取项目容器
        this.projectsContainer = document.getElementById('projects-container');
        
        // 将搜索框插入到项目容器之前
        this.projectsContainer.parentNode.insertBefore(this.searchContainer, this.projectsContainer);
        
        // 缓存搜索相关元素
        this.searchInput = this.searchContainer.querySelector('.project-search-input');
        this.clearButton = this.searchContainer.querySelector('.project-search-clear');
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索输入事件
        this.searchInput.addEventListener('input', () => this.handleSearch());
        
        // 清除按钮点击事件
        this.clearButton.addEventListener('click', () => this.clearSearch());
        
        // 键盘事件
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    },

    /**
     * 处理搜索
     */
    handleSearch() {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        
        // 显示/隐藏清除按钮
        this.clearButton.classList.toggle('visible', searchTerm.length > 0);
        
        // 获取所有项目卡片
        const projectCards = this.projectsContainer.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            // 获取项目名称（在h3标签中）
            const projectName = card.querySelector('h3')?.textContent.toLowerCase() || '';
            
            // 获取项目统计信息
            const projectStats = Array.from(card.querySelectorAll('.project-stats span'))
                .map(stat => stat.textContent.toLowerCase());
            
            // 获取项目日期信息
            const projectDates = Array.from(card.querySelectorAll('.project-dates div'))
                .map(date => date.textContent.toLowerCase());
            
            // 检查是否匹配搜索条件
            const isMatch = searchTerm === '' || 
                projectName.includes(searchTerm) ||
                projectStats.some(stat => stat.includes(searchTerm)) ||
                projectDates.some(date => date.includes(searchTerm));
            
            // 显示/隐藏项目卡片
            card.style.display = isMatch ? 'flex' : 'none';
        });
    },

    /**
     * 清除搜索
     */
    clearSearch() {
        this.searchInput.value = '';
        this.clearButton.classList.remove('visible');
        this.handleSearch();
    }
};

// 在页面加载完成后初始化搜索功能
document.addEventListener('DOMContentLoaded', () => {
    ProjectSearch.init();
}); 