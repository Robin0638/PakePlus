// 计时器删除管理器
class TimerDeleteManager {
    constructor() {
        this.modal = null;
        this.feedback = null;
        this.currentTimerId = null;
        this.currentTimerName = '';
    }

    // 显示删除确认模态框
    showDeleteConfirm(timerId, timerName) {
        this.currentTimerId = timerId;
        this.currentTimerName = timerName;
        
        this.createModal();
        this.modal.classList.add('show');
        
        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
    }

    // 创建模态框
    createModal() {
        // 如果已存在模态框，先移除
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        this.modal = document.createElement('div');
        this.modal.className = 'timer-delete-modal';
        this.modal.innerHTML = `
            <div class="timer-delete-modal-content">
                <div class="timer-delete-modal-title">删除计时器</div>
                <div class="timer-delete-modal-message">
                    确定要删除计时器"${this.currentTimerName}"吗？<br>
                    此操作不可撤销。
                </div>
                <div class="timer-delete-modal-buttons">
                    <button class="timer-delete-modal-btn timer-delete-modal-cancel" onclick="timerDeleteManager.cancelDelete()">
                        取消
                    </button>
                    <button class="timer-delete-modal-btn timer-delete-modal-confirm" onclick="timerDeleteManager.confirmDelete()">
                        删除
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // 点击背景关闭模态框
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.cancelDelete();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.cancelDelete();
            }
        });
    }

    // 取消删除
    cancelDelete() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
            }, 300);
        }
        
        // 恢复背景滚动
        document.body.style.overflow = '';
        
        this.currentTimerId = null;
        this.currentTimerName = '';
    }

    // 确认删除
    confirmDelete() {
        if (this.currentTimerId !== null) {
            this.deleteTimer(this.currentTimerId);
            this.cancelDelete();
        }
    }

    // 删除计时器
    deleteTimer(timerId) {
        // 找到计时器索引
        const timerIndex = timers.findIndex(t => t.id === timerId);
        
        if (timerIndex === -1) {
            console.error('未找到计时器:', timerId);
            return;
        }
        
        // 删除计时器
        timers.splice(timerIndex, 1);
        
        // 保存数据
        timerStorage.saveTimers(timers);
        
        // 重新应用过滤
        applyTimerFilters();
        
        // 显示删除成功反馈
        this.showDeleteFeedback();
        
        // 更新统计信息
        renderStats();
        
        console.log(`已删除计时器 ${timerId}`);
    }

    // 显示删除成功反馈
    showDeleteFeedback() {
        this.createFeedback();
        this.feedback.classList.add('show');
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 2秒后自动隐藏
        setTimeout(() => {
            this.hideFeedback();
        }, 2000);
    }

    // 创建反馈提示
    createFeedback() {
        // 如果已存在反馈元素，先移除
        if (this.feedback && this.feedback.parentNode) {
            this.feedback.parentNode.removeChild(this.feedback);
        }
        
        this.feedback = document.createElement('div');
        this.feedback.className = 'timer-delete-feedback';
        this.feedback.innerHTML = `
            <i data-lucide="check"></i>
            计时器已删除
        `;
        document.body.appendChild(this.feedback);
    }

    // 隐藏反馈
    hideFeedback() {
        this.feedback.classList.add('hide');
        this.feedback.classList.remove('show');
        
        // 动画完成后移除元素
        setTimeout(() => {
            if (this.feedback && this.feedback.parentNode) {
                this.feedback.parentNode.removeChild(this.feedback);
            }
        }, 300); // 与CSS动画时长一致
    }

    // 初始化所有卡片（现在删除按钮已经集成在HTML中）
    initializeAllCards() {
        // 删除按钮现在直接集成在renderTimers的HTML中
        // 只需要确保图标正确创建
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
}

// 全局实例
let timerDeleteManager = null;

// 初始化计时器删除功能
function initializeTimerDeleteFeature() {
    if (!timerDeleteManager) {
        timerDeleteManager = new TimerDeleteManager();
    }
    
    // 重写renderTimers函数以支持删除按钮
    const originalRenderTimers = window.renderTimers;
    window.renderTimers = function() {
        // 调用原始渲染函数
        originalRenderTimers();
        
        // 初始化所有卡片的删除按钮
        timerDeleteManager.initializeAllCards();
    };
    
    // 确保在页面加载完成后立即应用删除按钮
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (timerDeleteManager) {
                    timerDeleteManager.initializeAllCards();
                }
            }, 100);
        });
    } else {
        setTimeout(() => {
            if (timerDeleteManager) {
                timerDeleteManager.initializeAllCards();
            }
        }, 100);
    }
    
    console.log('计时器删除功能已初始化');
}

// 全局函数，供HTML调用
function showTimerDeleteConfirm(timerId, timerName) {
    if (timerDeleteManager) {
        timerDeleteManager.showDeleteConfirm(timerId, timerName);
    }
} 