// 秒表重命名管理器
class StopwatchRenameManager {
    constructor() {
        this.renamedNames = new Map();
        this.loadRenamedNames();
    }

    // 从localStorage加载重命名的秒表名称
    loadRenamedNames() {
        try {
            const stored = localStorage.getItem('stopwatchRenamedNames');
            if (stored) {
                this.renamedNames = new Map(JSON.parse(stored));
            }
        } catch (error) {
            console.error('加载秒表重命名数据失败:', error);
            this.renamedNames = new Map();
        }
    }

    // 保存重命名的秒表名称到localStorage
    saveRenamedNames() {
        try {
            localStorage.setItem('stopwatchRenamedNames', JSON.stringify([...this.renamedNames]));
        } catch (error) {
            console.error('保存秒表重命名数据失败:', error);
        }
    }

    // 获取秒表的显示名称
    getDisplayName(stopwatchId, originalName) {
        return this.renamedNames.get(stopwatchId) || originalName;
    }

    // 显示重命名输入框
    showRenameInput(stopwatchId, currentName, titleElement) {
        // 创建输入框容器
        const inputContainer = document.createElement('div');
        inputContainer.className = 'stopwatch-rename-input-container';
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'stopwatch-rename-input';
        input.value = currentName;
        input.placeholder = '输入新名称';
        input.maxLength = 20;
        
        // 设置输入框事件
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.saveRename(stopwatchId, input.value.trim(), titleElement, inputContainer);
            } else if (e.key === 'Escape') {
                this.cancelRename(titleElement, inputContainer);
            }
        };
        
        input.onblur = () => {
            this.saveRename(stopwatchId, input.value.trim(), titleElement, inputContainer);
        };
        
        // 替换标题元素内容，但保留重命名按钮
        const renameButton = titleElement.querySelector('.stopwatch-rename-button');
        titleElement.innerHTML = '';
        inputContainer.appendChild(input);
        titleElement.appendChild(inputContainer);
        
        // 如果有重命名按钮，重新添加它
        if (renameButton) {
            titleElement.appendChild(renameButton);
        }
        
        // 聚焦输入框并选中文本
        input.focus();
        input.select();
    }

    // 保存重命名
    saveRename(stopwatchId, newName, titleElement, inputContainer) {
        if (newName && newName.trim() !== '') {
            // 检查名称长度
            if (newName.length > 20) {
                alert('名称不能超过20个字符');
                return;
            }
            
            // 检查是否与其他秒表重名
            const existingNames = stopwatches.map(sw => {
                if (sw.id === stopwatchId) return null;
                return this.getDisplayName(sw.id, sw.name);
            }).filter(name => name !== null);
            
            if (existingNames.includes(newName)) {
                alert('该名称已被使用，请选择其他名称');
                return;
            }
            
            // 保存新名称
            this.renamedNames.set(stopwatchId, newName);
            this.saveRenamedNames();
            
            // 更新秒表数据
            const stopwatch = stopwatches.find(sw => sw.id === stopwatchId);
            if (stopwatch) {
                stopwatch.name = newName;
                stopwatchStorage.saveStopwatches(stopwatches);
            }
            
            // 恢复标题显示
            this.restoreTitle(titleElement, newName);
            
            console.log('秒表重命名成功:', stopwatchId, newName);
        } else {
            // 如果名称为空，恢复原名称
            this.cancelRename(titleElement, inputContainer);
        }
    }

    // 取消重命名
    cancelRename(titleElement, inputContainer) {
        const stopwatchId = parseInt(titleElement.closest('.card').getAttribute('data-stopwatch-id'));
        const originalName = stopwatches.find(sw => sw.id === stopwatchId)?.name || '秒表';
        const displayName = this.getDisplayName(stopwatchId, originalName);
        this.restoreTitle(titleElement, displayName);
    }

    // 恢复标题显示
    restoreTitle(titleElement, name) {
        titleElement.innerHTML = name;
        
        // 重新添加重命名按钮
        const stopwatchId = parseInt(titleElement.closest('.card').getAttribute('data-stopwatch-id'));
        const stopwatch = stopwatches.find(sw => sw.id === stopwatchId);
        if (stopwatch) {
            this.addRenameButtonToCard(titleElement.closest('.card'), stopwatchId, stopwatch.name);
        }
    }

    // 为卡片添加重命名按钮
    addRenameButtonToCard(card, stopwatchId, originalName) {
        const titleElement = card.querySelector('.card-title');
        if (!titleElement) return;
        
        // 检查是否已存在重命名按钮
        let renameButton = titleElement.querySelector('.stopwatch-rename-button');
        
        if (!renameButton) {
            renameButton = document.createElement('button');
            renameButton.className = 'stopwatch-rename-button';
            renameButton.innerHTML = `
                <i data-lucide="edit-3"></i>
                重命名
            `;
            renameButton.title = '重命名秒表';
            renameButton.onclick = (e) => {
                e.stopPropagation();
                const currentName = this.getDisplayName(stopwatchId, originalName);
                this.showRenameInput(stopwatchId, currentName, titleElement);
            };
            titleElement.appendChild(renameButton);
        } else {
            // 如果按钮已存在，更新其点击事件
            renameButton.onclick = (e) => {
                e.stopPropagation();
                const currentName = this.getDisplayName(stopwatchId, originalName);
                this.showRenameInput(stopwatchId, currentName, titleElement);
            };
        }
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    // 初始化所有卡片
    initializeAllCards() {
        const cards = document.querySelectorAll('.card[data-stopwatch-id]');
        cards.forEach(card => {
            const stopwatchId = parseInt(card.getAttribute('data-stopwatch-id'));
            const stopwatch = stopwatches.find(sw => sw.id === stopwatchId);
            if (stopwatch) {
                this.addRenameButtonToCard(card, stopwatchId, stopwatch.name);
            }
        });
    }
}

// 全局实例
let stopwatchRenameManager = null;

// 初始化秒表重命名功能
function initializeStopwatchRenameFeature() {
    if (!stopwatchRenameManager) {
        stopwatchRenameManager = new StopwatchRenameManager();
    }
    
    // 重写renderStopwatches函数以支持重命名
    const originalRenderStopwatches = window.renderStopwatches;
    window.renderStopwatches = function() {
        // 调用原始渲染函数
        originalRenderStopwatches();
        
        // 初始化所有卡片的重命名按钮
        if (stopwatchRenameManager) {
            stopwatchRenameManager.initializeAllCards();
        }
    };
    
    // 确保在页面加载完成后立即应用重命名状态
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (stopwatchRenameManager) {
                    stopwatchRenameManager.initializeAllCards();
                }
            }, 100);
        });
    } else {
        setTimeout(() => {
            if (stopwatchRenameManager) {
                stopwatchRenameManager.initializeAllCards();
            }
        }, 100);
    }
    
    console.log('秒表重命名功能已初始化');
} 