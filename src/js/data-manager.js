/**
 * 数据管理工具模块
 * 提供数据导入导出、备份和恢复功能
 */

class DataManager {
    constructor() {
        this.version = '1.0.0';
        this.exportFormat = {
            version: this.version,
            timestamp: null,
            data: {
                worldClocks: [],
                alarms: [],
                stopwatches: [],
                timers: [],
                settings: {}
            }
        };
    }

    /**
     * 导出所有数据
     * @returns {string} JSON格式的数据字符串
     */
    exportAllData() {
        try {
            const exportData = {
                ...this.exportFormat,
                timestamp: new Date().toISOString(),
                data: {
                    worldClocks: worldClockStorage.loadWorldClocks(),
                    alarms: alarmStorage.loadAlarms(),
                    stopwatches: stopwatchStorage.loadStopwatches(),
                    timers: timerStorage.loadTimers(),
                    settings: settingsStorage.loadSettings()
                }
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            console.log('数据导出成功');
            return jsonString;
        } catch (error) {
            console.error('数据导出失败:', error);
            throw error;
        }
    }

    /**
     * 导入数据
     * @param {string} jsonString - JSON格式的数据字符串
     * @returns {boolean} 导入是否成功
     */
    importData(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            
            // 验证数据格式
            if (!this.validateImportData(importData)) {
                throw new Error('数据格式无效');
            }

            // 备份当前数据
            this.createBackup();

            // 导入数据
            if (importData.data.worldClocks) {
                worldClockStorage.saveWorldClocks(importData.data.worldClocks);
            }
            if (importData.data.alarms) {
                alarmStorage.saveAlarms(importData.data.alarms);
            }
            if (importData.data.stopwatches) {
                stopwatchStorage.saveStopwatches(importData.data.stopwatches);
            }
            if (importData.data.timers) {
                timerStorage.saveTimers(importData.data.timers);
            }
            if (importData.data.settings) {
                settingsStorage.saveSettings(importData.data.settings);
            }

            console.log('数据导入成功');
            return true;
        } catch (error) {
            console.error('数据导入失败:', error);
            return false;
        }
    }

    /**
     * 验证导入数据格式
     * @param {Object} data - 导入的数据
     * @returns {boolean} 数据格式是否有效
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        if (!data.version || !data.timestamp || !data.data) {
            return false;
        }

        if (typeof data.data !== 'object') {
            return false;
        }

        return true;
    }

    /**
     * 创建数据备份
     * @returns {string} 备份文件名
     */
    createBackup() {
        try {
            const backupData = this.exportAllData();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupKey = `backup_${timestamp}`;
            
            localStorage.setItem(backupKey, backupData);
            
            // 清理旧备份（保留最近5个）
            this.cleanOldBackups();
            
            console.log(`备份已创建: ${backupKey}`);
            return backupKey;
        } catch (error) {
            console.error('创建备份失败:', error);
            throw error;
        }
    }

    /**
     * 清理旧备份
     */
    cleanOldBackups() {
        try {
            const backupKeys = [];
            
            // 获取所有备份键
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('backup_')) {
                    backupKeys.push(key);
                }
            }

            // 按时间排序
            backupKeys.sort().reverse();

            // 删除多余的备份（保留最近5个）
            if (backupKeys.length > 5) {
                const keysToDelete = backupKeys.slice(5);
                keysToDelete.forEach(key => {
                    localStorage.removeItem(key);
                    console.log(`已删除旧备份: ${key}`);
                });
            }
        } catch (error) {
            console.error('清理旧备份失败:', error);
        }
    }

    /**
     * 获取所有备份
     * @returns {Array} 备份列表
     */
    getBackups() {
        try {
            const backups = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('backup_')) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            const parsedData = JSON.parse(data);
                            backups.push({
                                key: key,
                                timestamp: parsedData.timestamp,
                                date: new Date(parsedData.timestamp)
                            });
                        } catch (e) {
                            console.warn(`解析备份数据失败: ${key}`);
                        }
                    }
                }
            }

            // 按时间排序（最新的在前）
            return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('获取备份列表失败:', error);
            return [];
        }
    }

    /**
     * 从备份恢复数据
     * @param {string} backupKey - 备份键名
     * @returns {boolean} 恢复是否成功
     */
    restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('备份不存在');
            }

            return this.importData(backupData);
        } catch (error) {
            console.error('从备份恢复失败:', error);
            return false;
        }
    }

    /**
     * 删除备份
     * @param {string} backupKey - 备份键名
     * @returns {boolean} 删除是否成功
     */
    deleteBackup(backupKey) {
        try {
            localStorage.removeItem(backupKey);
            console.log(`备份已删除: ${backupKey}`);
            return true;
        } catch (error) {
            console.error('删除备份失败:', error);
            return false;
        }
    }

    /**
     * 下载数据文件
     * @param {string} filename - 文件名
     * @param {string} data - 数据内容
     */
    downloadFile(filename, data) {
        try {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('下载文件失败:', error);
            throw error;
        }
    }

    /**
     * 导出数据到文件
     */
    exportToFile() {
        try {
            const data = this.exportAllData();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const filename = `clock-app-backup-${timestamp}.json`;
            
            this.downloadFile(filename, data);
            console.log('数据已导出到文件');
        } catch (error) {
            console.error('导出到文件失败:', error);
            throw error;
        }
    }

    /**
     * 从文件导入数据
     * @param {File} file - 文件对象
     * @returns {Promise<boolean>} 导入是否成功
     */
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const jsonString = e.target.result;
                        const success = this.importData(jsonString);
                        
                        if (success) {
                            // 重新加载数据并刷新界面
                            loadStoredData();
                            renderWorldClocks();
                            renderAlarms();
                            renderStopwatches();
                            renderTimers();
                        }
                        
                        resolve(success);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('文件读取失败'));
                };
                
                reader.readAsText(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 清空所有数据
     * @returns {boolean} 清空是否成功
     */
    clearAllData() {
        try {
            // 创建备份
            this.createBackup();
            
            // 清空所有数据
            storageManager.clearAll();
            
            // 重置全局变量
            worldClocks = [];
            alarms = [];
            stopwatches = [];
            timers = [];
            
            // 刷新界面
            renderWorldClocks();
            renderAlarms();
            renderStopwatches();
            renderTimers();
            
            console.log('所有数据已清空');
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 获取数据统计信息
     * @returns {Object} 统计信息
     */
    getDataStats() {
        try {
            const timers = timerStorage.loadTimers();
            const totalCompletedCount = timers.reduce((total, timer) => {
                return total + (timer.completedCount || 0);
            }, 0);
            
            const totalCompletedTime = timers.reduce((total, timer) => {
                return total + (timer.totalCompletedTime || 0);
            }, 0);
            
            const stats = {
                worldClocks: worldClockStorage.loadWorldClocks().length,
                alarms: alarmStorage.loadAlarms().length,
                stopwatches: stopwatchStorage.loadStopwatches().length,
                timers: timers.length,
                timerCompletions: totalCompletedCount, // 添加计时器完成次数统计
                totalTimerCompletedTime: totalCompletedTime, // 添加累计完成时长统计
                backups: this.getBackups().length
            };

            return stats;
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return null;
        }
    }
}

// 创建全局数据管理器实例
const dataManager = new DataManager();

// 导出数据管理器供其他模块使用
window.dataManager = dataManager;

// 全局函数，供HTML调用
window.exportData = function() {
    try {
        dataManager.exportToFile();
        alert('数据导出成功！');
    } catch (error) {
        alert('数据导出失败：' + error.message);
    }
};

window.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            dataManager.importFromFile(file)
                .then(success => {
                    if (success) {
                        // 重新加载数据并刷新界面
                        loadStoredData();
                        renderWorldClocks();
                        renderAlarms();
                        renderStopwatches();
                        renderTimers();
                        renderSettings();
                        // 更新统计信息
                        renderStats();
                        alert('数据导入成功！');
                    } else {
                        alert('数据导入失败！');
                    }
                })
                .catch(error => {
                    alert('数据导入失败：' + error.message);
                });
        }
    };
    input.click();
};

window.createBackup = function() {
    try {
        const backupKey = dataManager.createBackup();
        // 更新统计信息
        renderStats();
        alert('备份创建成功！');
    } catch (error) {
        alert('备份创建失败：' + error.message);
    }
};

window.clearAllData = function() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        const success = dataManager.clearAllData();
        if (success) {
            // 更新统计信息
            renderStats();
            alert('所有数据已清空！');
        } else {
            alert('清空数据失败！');
        }
    }
}; 