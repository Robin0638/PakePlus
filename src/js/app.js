/**
 * Application Main Module
 * Responsible for initializing and managing the main functions of the application
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize storage manager
    StorageManager.init();

    // Backup data button click event
    const backupDataBtn = document.getElementById('backup-data');
    if (backupDataBtn) {
        backupDataBtn.addEventListener('click', () => {
            try {
                StorageManager.exportData();
                showToast('Data backup successful!');
            } catch (error) {
                console.error('Data backup failed:', error);
                showToast('Data backup failed, please try again', 'error');
            }
        });
    }

    // Import Data/File button click event
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
                // Dialog to ask whether to merge or overwrite
                const keepOld = confirm('Do you want to keep existing content?\nSelect“确定”将合并数据，Select“取消”将覆盖原有数规划（电脑版）据。');
                await StorageManager.importDataFromFile(file, keepOld);
                showToast('Data import successful!');
                // Refresh page to apply new data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('Import Data/File failed:', error);
                showToast(`Import Data/File failed: ${error.message}`, 'error');
            } finally {
                // Clear file input to allow selecting the same file again
                event.target.value = '';
            }
        });
    }

    // Clear data button click event
    const clearDataBtn = document.getElementById('clear-all-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            // Directly use the new dialog manager
            if (window.clearDialogManager) {
                clearDialogManager.show();
            } else {
                // If dialog manager is not initialized, redirect to clear page
                sessionStorage.setItem('clearDataConfirmed', 'true');
                window.location.href = 'clear.html';
            }
        });
    }
});

/**
 * Display toast message
 * @param {string} message Message content
 * @param {string} type Message type (success/error)
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Add show animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
} 