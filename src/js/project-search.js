/**
 * ItemSearch模块
 * 负责大Item视图的Search功能实现
 */

const ProjectSearch = {
    /**
     * 初始化Search功能
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
                <input type="text" class="project-search-input" placeholder="Search Item">
                <button class="project-search-clear">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // 获取Item容器
        this.projectsContainer = document.getElementById('projects-container');
        
        // 将Search框插入到Item容器之前
        this.projectsContainer.parentNode.insertBefore(this.searchContainer, this.projectsContainer);
        
        // 缓存Search相关元素
        this.searchInput = this.searchContainer.querySelector('.project-search-input');
        this.clearButton = this.searchContainer.querySelector('.project-search-clear');
    },

    /**
     * 绑定Things
     */
    bindEvents() {
        // Search输入Things
        this.searchInput.addEventListener('input', () => this.handleSearch());
        
        // Purge按钮点击Things
        this.clearButton.addEventListener('click', () => this.clearSearch());
        
        // 键盘Things
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    },

    /**
     * 处理Search
     */
    handleSearch() {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        
        // 显示/隐藏Purge按钮
        this.clearButton.classList.toggle('visible', searchTerm.length > 0);
        
        // 获取所有Item卡片
        const projectCards = this.projectsContainer.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            // 获取Item名称（在h3Labelmedium）
            const projectName = card.querySelector('h3')?.textContent.toLowerCase() || '';
            
            // 获取ItemStats
            const projectStats = Array.from(card.querySelectorAll('.project-stats span'))
                .map(stat => stat.textContent.toLowerCase());
            
            // 获取Item日期信息
            const projectDates = Array.from(card.querySelectorAll('.project-dates div'))
                .map(date => date.textContent.toLowerCase());
            
            // 检查是否匹配Search条件
            const isMatch = searchTerm === '' || 
                projectName.includes(searchTerm) ||
                projectStats.some(stat => stat.includes(searchTerm)) ||
                projectDates.some(date => date.includes(searchTerm));
            
            // 显示/隐藏Item卡片
            card.style.display = isMatch ? 'flex' : 'none';
        });
    },

    /**
     * PurgeSearch
     */
    clearSearch() {
        this.searchInput.value = '';
        this.clearButton.classList.remove('visible');
        this.handleSearch();
    }
};

// 在页面加载Completed后初始化Search功能
document.addEventListener('DOMContentLoaded', () => {
    ProjectSearch.init();
}); 