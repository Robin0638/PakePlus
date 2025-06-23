/**
 * 应用主模块
 * 负责初始化和管理应用的主要功能
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化存储管理器
    StorageManager.init();

    // 备份数据按钮点击事件
    const backupDataBtn = document.getElementById('backup-data');
    if (backupDataBtn) {
        backupDataBtn.addEventListener('click', () => {
            try {
                StorageManager.exportData();
                showToast('数据备份成功！');
            } catch (error) {
                console.error('备份数据失败:', error);
                showToast('备份数据失败，请重试', 'error');
            }
        });
    }

    // 导入数据按钮点击事件
    const importDataBtn = document.getElementById('import-data-btn');
    const importDataInput = document.getElementById('import-data');
    if (importDataBtn && importDataInput) {
        importDataBtn.addEventListener('click', () => {
            importDataInput.click();
        });

        importDataInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                // 显示确认对话框
                if (!confirm('导入数据将覆盖当前所有数据，是否继续？')) {
                    return;
                }

                await StorageManager.importDataFromFile(file);
                showToast('数据导入成功！');
                
                // 刷新页面以应用新数据
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('导入数据失败:', error);
                showToast(`导入数据失败：${error.message}`, 'error');
            } finally {
                // 清除文件输入，允许重复选择同一文件
                event.target.value = '';
            }
        });
    }

    // 清除数据按钮点击事件
    const clearDataBtn = document.getElementById('clear-all-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            // 直接使用新的对话框管理器
            if (window.clearDialogManager) {
                clearDialogManager.show();
            } else {
                // 如果对话框管理器未初始化，直接跳转到清除页面
                sessionStorage.setItem('clearDataConfirmed', 'true');
                window.location.href = 'clear.html';
            }
        });
    }
});

/**
 * 显示提示消息
 * @param {string} message 消息内容
 * @param {string} type 消息类型（success/error）
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 添加显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 3秒后移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
} 