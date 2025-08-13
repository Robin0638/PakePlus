// 删除管理器
class DeleteManager {
    constructor() {
        this.deleteConfirmModal = null;
        this.currentAlarmId = null;
    }

    // 初始化删除功能
    initializeDeleteFeature() {
        // 创建删除确认对话框
        this.createDeleteConfirmModal();
        
        // 添加ESC键关闭对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.deleteConfirmModal.classList.contains('show')) {
                this.hideDeleteConfirmModal();
            }
        });
    }

    // 创建删除确认对话框
    createDeleteConfirmModal() {
        this.deleteConfirmModal = document.createElement('div');
        this.deleteConfirmModal.className = 'delete-confirm-modal';
        this.deleteConfirmModal.innerHTML = `
            <div class="delete-confirm-content">
                <div class="delete-confirm-title">
                    <i data-lucide="alert-triangle"></i>
                    确认删除
                </div>
                <div class="delete-confirm-message">
                    确定要删除这个闹钟吗？此操作不可撤销。
                </div>
                <div class="delete-confirm-actions">
                    <button class="delete-cancel-btn" onclick="deleteManager.hideDeleteConfirmModal()">
                        取消
                    </button>
                    <button class="delete-confirm-btn" onclick="deleteManager.confirmDelete()">
                        确认删除
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(this.deleteConfirmModal);

        // 点击背景关闭对话框
        this.deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === this.deleteConfirmModal) {
                this.hideDeleteConfirmModal();
            }
        });

        // 重新创建图标
        lucide.createIcons();
    }

    // 显示删除确认对话框
    showDeleteConfirmModal(alarmId, alarmName) {
        this.currentAlarmId = alarmId;
        
        // 更新对话框内容
        const messageEl = this.deleteConfirmModal.querySelector('.delete-confirm-message');
        messageEl.textContent = `确定要删除闹钟"${alarmName}"吗？此操作不可撤销。`;
        
        // 显示对话框
        this.deleteConfirmModal.classList.add('show');
        
        // 重新创建图标
        lucide.createIcons();
    }

    // 隐藏删除确认对话框
    hideDeleteConfirmModal() {
        this.deleteConfirmModal.classList.remove('show');
        this.currentAlarmId = null;
    }

    // 确认删除
    confirmDelete() {
        if (!this.currentAlarmId) return;

        // 从闹钟数组中删除
        const alarmIndex = alarms.findIndex(a => a.id === this.currentAlarmId);
        if (alarmIndex > -1) {
            const deletedAlarm = alarms[alarmIndex];
            alarms.splice(alarmIndex, 1);
            
            // 保存到存储
            alarmStorage.saveAlarms(alarms);
            
            // 重新应用过滤以更新显示
            applyAlarmFilters();
            
            // 显示成功反馈
            this.showDeleteFeedback(`闹钟"${deletedAlarm.name}"已删除`);
            
            // 更新统计信息
            if (typeof renderStats === 'function') {
                renderStats();
            }
            
            // 更新收藏统计
            if (window.updateFavoriteStats) {
                window.updateFavoriteStats();
            }
        }

        // 隐藏对话框
        this.hideDeleteConfirmModal();
    }

    // 显示删除反馈
    showDeleteFeedback(message) {
        // 移除现有的反馈
        const existingFeedback = document.querySelector('.delete-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // 创建新的反馈
        const feedback = document.createElement('div');
        feedback.className = 'delete-feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);

        // 3秒后自动移除
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 3000);
    }

    // 删除闹钟（直接删除，不显示确认对话框）
    deleteAlarmDirect(alarmId) {
        const alarmIndex = alarms.findIndex(a => a.id === alarmId);
        if (alarmIndex > -1) {
            const deletedAlarm = alarms[alarmIndex];
            alarms.splice(alarmIndex, 1);
            
            // 保存到存储
            alarmStorage.saveAlarms(alarms);
            
            // 重新应用过滤以更新显示
            applyAlarmFilters();
            
            // 显示成功反馈
            this.showDeleteFeedback(`闹钟"${deletedAlarm.name}"已删除`);
            
            // 更新统计信息
            if (typeof renderStats === 'function') {
                renderStats();
            }
            
            // 更新收藏统计
            if (window.updateFavoriteStats) {
                window.updateFavoriteStats();
            }
        }
    }
}

// 创建全局删除管理器实例
const deleteManager = new DeleteManager();

// 全局函数：显示删除确认对话框
function showDeleteConfirm(alarmId, alarmName) {
    deleteManager.showDeleteConfirmModal(alarmId, alarmName);
}

// 全局函数：直接删除闹钟
function deleteAlarm(alarmId) {
    deleteManager.deleteAlarmDirect(alarmId);
}

// 初始化删除功能
function initializeDeleteFeature() {
    deleteManager.initializeDeleteFeature();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDeleteFeature);
} else {
    initializeDeleteFeature();
} 