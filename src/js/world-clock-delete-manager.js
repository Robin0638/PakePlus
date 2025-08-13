// 世界时钟删除管理器
class WorldClockDeleteManager {
    constructor() {
        this.modal = null;
        this.feedback = null;
        this.currentClockId = null;
        this.init();
    }

    init() {
        this.createDeleteModal();
        this.setupEventListeners();
    }

    // 创建删除确认模态框
    createDeleteModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'world-clock-delete-modal';
        this.modal.innerHTML = `
            <div class="world-clock-delete-content">
                <h3 class="world-clock-delete-title">
                    <i data-lucide="alert-triangle"></i>
                    删除世界时钟
                </h3>
                <p class="world-clock-delete-message">
                    确定要删除这个世界时钟吗？此操作不可撤销。
                </p>
                <div class="world-clock-delete-actions">
                    <button class="world-clock-delete-cancel-btn" id="worldClockDeleteCancelBtn">取消</button>
                    <button class="world-clock-delete-confirm-btn" id="worldClockDeleteConfirmBtn">删除</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    // 创建反馈提示
    createFeedback() {
        // 如果已存在反馈元素，先移除
        if (this.feedback && this.feedback.parentNode) {
            this.feedback.parentNode.removeChild(this.feedback);
        }
        
        this.feedback = document.createElement('div');
        this.feedback.className = 'world-clock-delete-feedback';
        this.feedback.innerHTML = `
            <i data-lucide="check"></i>
            世界时钟已删除
        `;
        document.body.appendChild(this.feedback);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 取消按钮事件
        document.getElementById('worldClockDeleteCancelBtn')?.addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // 确认按钮事件
        document.getElementById('worldClockDeleteConfirmBtn')?.addEventListener('click', () => {
            this.confirmDelete();
        });

        // 点击背景关闭模态框
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideDeleteModal();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('show')) {
                e.preventDefault();
                this.hideDeleteModal();
            }
        });
    }

    // 显示删除确认模态框
    showDeleteModal(clockId, clockName) {
        this.currentClockId = clockId;
        
        // 更新模态框内容
        const messageElement = this.modal.querySelector('.world-clock-delete-message');
        if (messageElement) {
            messageElement.textContent = `确定要删除"${clockName}"吗？此操作不可撤销。`;
        }

        // 显示模态框
        this.modal.classList.add('show');
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    // 隐藏删除确认模态框
    hideDeleteModal() {
        this.modal?.classList.remove('show');
        this.currentClockId = null;
    }

    // 确认删除
    confirmDelete() {
        if (this.currentClockId) {
            this.deleteWorldClock(this.currentClockId);
            this.hideDeleteModal();
        }
    }

    // 删除世界时钟
    deleteWorldClock(clockId) {
        try {
            // 从数组中移除时钟
            const index = worldClocks.findIndex(clock => clock.id === clockId);
            if (index !== -1) {
                worldClocks.splice(index, 1);
                
                // 保存到存储
                worldClockStorage.saveWorldClocks(worldClocks);
                
                // 重新渲染世界时钟
                renderWorldClocks();
                
                // 显示反馈提示
                this.showDeleteFeedback();
                
                console.log('世界时钟已删除:', clockId);
            }
        } catch (error) {
            console.error('删除世界时钟失败:', error);
        }
    }

    // 显示删除反馈
    showDeleteFeedback() {
        // 创建新的反馈元素
        this.createFeedback();
        
        this.feedback.classList.add('show');
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 3秒后自动隐藏
        setTimeout(() => {
            this.hideDeleteFeedback();
        }, 3000);
    }

    // 隐藏删除反馈
    hideDeleteFeedback() {
        this.feedback.classList.add('hide');
        this.feedback.classList.remove('show');
        
        // 动画完成后移除元素
        setTimeout(() => {
            if (this.feedback && this.feedback.parentNode) {
                this.feedback.parentNode.removeChild(this.feedback);
            }
        }, 300); // 与CSS动画时长一致
    }

    // 添加删除按钮到世界时钟卡片
    addDeleteButtonToCard(cardElement, clockId, clockName) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'world-clock-delete-button';
        deleteButton.title = '删除世界时钟';
        deleteButton.innerHTML = `
            <i data-lucide="trash-2"></i>
            删除
        `;
        
        deleteButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showDeleteModal(clockId, clockName);
        });
        
        cardElement.appendChild(deleteButton);
    }
}

// 全局实例
let worldClockDeleteManager = null;

// 初始化世界时钟删除功能
function initializeWorldClockDeleteFeature() {
    if (!worldClockDeleteManager) {
        worldClockDeleteManager = new WorldClockDeleteManager();
    }
    
    console.log('世界时钟删除功能已初始化');
}

// 全局删除函数（供HTML调用）
window.showWorldClockDeleteConfirm = function(clockId, clockName) {
    if (worldClockDeleteManager) {
        worldClockDeleteManager.showDeleteModal(clockId, clockName);
    }
}; 









