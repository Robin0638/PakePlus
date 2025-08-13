// 秒表删除管理器
class StopwatchDeleteManager {
    constructor() {
        this.modal = null;
        this.feedback = null;
        this.currentStopwatchId = null;
        this.init();
    }

    init() {
        this.createDeleteModal();
        this.setupEventListeners();
    }

    // 创建删除确认模态框
    createDeleteModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'stopwatch-delete-modal';
        this.modal.innerHTML = `
            <div class="stopwatch-delete-content">
                <h3 class="stopwatch-delete-title">
                    <i data-lucide="alert-triangle"></i>
                    删除秒表
                </h3>
                <p class="stopwatch-delete-message">
                    确定要删除这个秒表吗？此操作不可撤销。
                </p>
                <div class="stopwatch-delete-actions">
                    <button class="stopwatch-delete-cancel-btn" id="stopwatchDeleteCancelBtn">取消</button>
                    <button class="stopwatch-delete-confirm-btn" id="stopwatchDeleteConfirmBtn">删除</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 取消按钮事件
        document.getElementById('stopwatchDeleteCancelBtn')?.addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // 确认按钮事件
        document.getElementById('stopwatchDeleteConfirmBtn')?.addEventListener('click', () => {
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
    showDeleteModal(stopwatchId, stopwatchName) {
        this.currentStopwatchId = stopwatchId;
        
        // 更新模态框内容
        const messageElement = this.modal.querySelector('.stopwatch-delete-message');
        if (messageElement) {
            messageElement.textContent = `确定要删除"${stopwatchName}"吗？此操作不可撤销。`;
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
        this.currentStopwatchId = null;
    }

    // 确认删除
    confirmDelete() {
        if (this.currentStopwatchId) {
            this.deleteStopwatch(this.currentStopwatchId);
            this.hideDeleteModal();
        }
    }

    // 删除秒表
    deleteStopwatch(stopwatchId) {
        try {
            // 从数组中移除秒表
            const index = stopwatches.findIndex(sw => sw.id === stopwatchId);
            if (index !== -1) {
                stopwatches.splice(index, 1);
                
                // 保存到存储
                stopwatchStorage.saveStopwatches(stopwatches);
                
                // 重新渲染秒表
                renderStopwatches();
                
                // 显示反馈提示
                this.showDeleteFeedback();
                
                console.log('秒表已删除:', stopwatchId);
            }
        } catch (error) {
            console.error('删除秒表失败:', error);
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

    // 创建反馈提示
    createFeedback() {
        // 如果已存在反馈元素，先移除
        if (this.feedback && this.feedback.parentNode) {
            this.feedback.parentNode.removeChild(this.feedback);
        }
        
        this.feedback = document.createElement('div');
        this.feedback.className = 'stopwatch-delete-feedback';
        this.feedback.innerHTML = `
            <i data-lucide="check"></i>
            秒表已删除
        `;
        document.body.appendChild(this.feedback);
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
}

// 全局实例
let stopwatchDeleteManager = null;

// 初始化秒表删除功能
function initializeStopwatchDeleteFeature() {
    if (!stopwatchDeleteManager) {
        stopwatchDeleteManager = new StopwatchDeleteManager();
    }
    
    console.log('秒表删除功能已初始化');
}

// 全局删除函数（供HTML调用）
window.showStopwatchDeleteConfirm = function(stopwatchId, stopwatchName) {
    if (stopwatchDeleteManager) {
        stopwatchDeleteManager.showDeleteModal(stopwatchId, stopwatchName);
    }
}; 