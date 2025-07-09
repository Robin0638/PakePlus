/**
 * 统一筛选卡片功能
 */

class UnifiedFilterManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTagCount();
        this.initDefaultCollapseState();
    }

    bindEvents() {
        // 选项卡切换
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.filter-tab'));
            });
        });

        // 折叠/展开功能
        const toggleBtn = document.getElementById('unified-filter-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleCollapse();
            });
        }

        // 清除所有筛选
        const clearAllBtn = document.getElementById('clear-all-filters-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // 监听标签筛选变化，更新计数
        this.observeTagFilterChanges();
    }

    switchTab(clickedTab) {
        // 移除所有活动状态
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.filter-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // 激活点击的选项卡
        clickedTab.classList.add('active');
        const targetPanel = document.getElementById(clickedTab.dataset.tab + '-panel');
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    }

    toggleCollapse() {
        const content = document.getElementById('unified-filter-content');
        const toggleBtn = document.getElementById('unified-filter-toggle');
        const icon = toggleBtn.querySelector('i');

        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.className = 'fas fa-chevron-down';
            toggleBtn.title = '折叠';
            // 保存展开状态
            this.saveCollapseState(false);
        } else {
            content.classList.add('collapsed');
            icon.className = 'fas fa-chevron-up';
            toggleBtn.title = '展开';
            // 保存折叠状态
            this.saveCollapseState(true);
        }
    }

    clearAllFilters() {
        // 使用防抖，避免重复调用
        if (this._clearing) return;
        this._clearing = true;

        // 性能监控
        const startTime = performance.now();

        try {
            // 添加视觉反馈
            const clearBtn = document.getElementById('clear-all-filters-btn');
            const container = document.getElementById('unified-filter-container');
            
            if (clearBtn) clearBtn.classList.add('clearing');
            if (container) container.classList.add('clearing');

            // 批量清除所有筛选条件 - 使用更高效的方式
            const clearOperations = [
                // 1. 清除标签筛选 - 使用类列表批量操作
                () => {
                    const selectedButtons = document.querySelectorAll('.tag-filter-btn.selected');
                    if (selectedButtons.length > 0) {
                        selectedButtons.forEach(btn => btn.classList.remove('selected'));
                    }
                },
                
                // 2. 清除项目筛选
                () => {
                    const projectSelect = document.getElementById('project-filter-select');
                    if (projectSelect && projectSelect.value !== '') {
                        projectSelect.value = '';
                    }
                },
                
                // 3. 清除日期筛选
                () => {
                    const startDate = document.getElementById('start-date');
                    const endDate = document.getElementById('end-date');
                    if (startDate && startDate.value !== '') startDate.value = '';
                    if (endDate && endDate.value !== '') endDate.value = '';
                },
                
                // 4. 清除快捷日期按钮状态
                () => {
                    const activeQuickDateButtons = document.querySelectorAll('.quick-date-btn.active');
                    if (activeQuickDateButtons.length > 0) {
                        activeQuickDateButtons.forEach(btn => btn.classList.remove('active'));
                    }
                },
                
                // 5. 清除搜索框
                () => {
                    const searchInput = document.getElementById('list-search-input');
                    if (searchInput && searchInput.value !== '') {
                        searchInput.value = '';
                    }
                    
                    // 隐藏清除搜索按钮
                    const clearSearchBtn = document.getElementById('clear-search-btn');
                    if (clearSearchBtn) {
                        clearSearchBtn.style.display = 'none';
                    }
                },
                
                // 6. 隐藏所有状态指示器
                () => {
                    const statusElements = document.querySelectorAll('.filter-status, #project-filter-status, #date-filter-status');
                    statusElements.forEach(status => {
                        if (status.style.display !== 'none') {
                            status.style.display = 'none';
                        }
                    });
                },
                
                // 7. 隐藏清除按钮
                () => {
                    const clearAllBtn = document.getElementById('clear-all-filters-btn');
                    if (clearAllBtn) {
                        clearAllBtn.style.display = 'none';
                    }
                }
            ];

            // 执行所有清除操作
            clearOperations.forEach(operation => operation());

            // 更新标签计数
            this.updateTagCount();

            // 触发筛选更新事件 - 使用更高效的方式
            this.triggerFilterUpdate();

            // 通知TaskManager重新加载任务
            if (window.TaskManager) {
                // 使用requestAnimationFrame确保DOM更新完成
                requestAnimationFrame(() => {
                    window.TaskManager.loadTasks(true);
                });
            }

            // 移除视觉反馈
            setTimeout(() => {
                if (clearBtn) clearBtn.classList.remove('clearing');
                if (container) {
                    container.classList.remove('clearing');
                    container.classList.add('clearing-complete');
                    setTimeout(() => {
                        container.classList.remove('clearing-complete');
                    }, 300);
                }
            }, 150);

            // 性能监控输出
            const endTime = performance.now();
            const duration = endTime - startTime;
            if (duration > 50) { // 只在性能较慢时输出警告
                console.warn(`清除筛选操作耗时: ${duration.toFixed(2)}ms`);
            }

        } catch (error) {
            console.error('清除筛选时发生错误:', error);
        } finally {
            // 重置防抖标志
            setTimeout(() => {
                this._clearing = false;
            }, 100);
        }
    }

    updateTagCount() {
        // 使用更高效的方式更新标签计数
        const countElement = document.getElementById('tag-count');
        if (countElement) {
            // 使用更快的选择器
            const tagCount = document.querySelectorAll('.tag-filter-btn').length;
            const currentCount = countElement.textContent;
            
            // 只在需要更新时才更新DOM
            if (currentCount !== tagCount.toString()) {
                countElement.textContent = tagCount;
            }
        }
    }

    observeTagFilterChanges() {
        // 使用防抖优化事件监听
        let tagUpdateTimeout, projectUpdateTimeout, dateUpdateTimeout, quickDateUpdateTimeout;
        
        // 监听标签按钮的点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-filter-btn')) {
                if (tagUpdateTimeout) clearTimeout(tagUpdateTimeout);
                tagUpdateTimeout = setTimeout(() => {
                    this.updateTagCount();
                    this.checkFilterStatus();
                }, 30); // 减少延迟到30ms
            }
        });

        // 监听项目选择变化
        const projectSelect = document.getElementById('project-filter-select');
        if (projectSelect) {
            projectSelect.addEventListener('change', () => {
                if (projectUpdateTimeout) clearTimeout(projectUpdateTimeout);
                projectUpdateTimeout = setTimeout(() => {
                    this.checkFilterStatus();
                }, 30); // 减少延迟到30ms
            });
        }

        // 监听日期输入变化
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        if (startDate) {
            startDate.addEventListener('change', () => {
                if (dateUpdateTimeout) clearTimeout(dateUpdateTimeout);
                dateUpdateTimeout = setTimeout(() => {
                    this.checkFilterStatus();
                }, 30); // 减少延迟到30ms
            });
        }
        if (endDate) {
            endDate.addEventListener('change', () => {
                if (dateUpdateTimeout) clearTimeout(dateUpdateTimeout);
                dateUpdateTimeout = setTimeout(() => {
                    this.checkFilterStatus();
                }, 30); // 减少延迟到30ms
            });
        }

        // 监听快捷日期按钮点击
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-date-btn')) {
                if (quickDateUpdateTimeout) clearTimeout(quickDateUpdateTimeout);
                quickDateUpdateTimeout = setTimeout(() => {
                    this.checkFilterStatus();
                }, 30); // 减少延迟到30ms
            }
        });
    }

    checkFilterStatus() {
        // 使用更高效的方式检查筛选状态
        const hasActiveFilters = (
            // 检查标签筛选 - 使用更快的选择器
            document.querySelector('.tag-filter-btn.selected') !== null ||
            
            // 检查项目筛选
            (() => {
                const projectSelect = document.getElementById('project-filter-select');
                return projectSelect && projectSelect.value !== '';
            })() ||
            
            // 检查日期筛选
            (() => {
                const startDate = document.getElementById('start-date');
                const endDate = document.getElementById('end-date');
                return (startDate && startDate.value !== '') || (endDate && endDate.value !== '');
            })() ||
            
            // 检查快捷日期按钮
            document.querySelector('.quick-date-btn.active') !== null ||
            
            // 检查搜索框
            (() => {
                const searchInput = document.getElementById('list-search-input');
                return searchInput && searchInput.value.trim() !== '';
            })()
        );

        // 显示/隐藏清除按钮
        const clearAllBtn = document.getElementById('clear-all-filters-btn');
        if (clearAllBtn) {
            const currentDisplay = clearAllBtn.style.display;
            const newDisplay = hasActiveFilters ? 'flex' : 'none';
            
            // 只在需要改变时才更新DOM
            if (currentDisplay !== newDisplay) {
                clearAllBtn.style.display = newDisplay;
            }
        }
    }

    triggerFilterUpdate() {
        // 使用防抖，避免频繁触发事件
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
        }
        
        this._updateTimeout = setTimeout(() => {
            // 触发自定义事件，通知其他模块筛选已更新
            const event = new CustomEvent('filtersUpdated', {
                detail: {
                    source: 'unified-filter',
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(event);
        }, 50); // 50ms防抖延迟
    }

    // 公共方法：获取当前筛选状态
    getFilterState() {
        const state = {
            tags: [],
            project: '',
            dateRange: {
                start: '',
                end: ''
            },
            quickDate: ''
        };

        // 获取选中的标签
        document.querySelectorAll('.tag-filter-btn.selected').forEach(btn => {
            state.tags.push(btn.textContent.trim());
        });

        // 获取选中的项目
        const projectSelect = document.getElementById('project-filter-select');
        if (projectSelect) {
            state.project = projectSelect.value;
        }

        // 获取日期范围
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        if (startDate) state.dateRange.start = startDate.value;
        if (endDate) state.dateRange.end = endDate.value;

        // 获取快捷日期
        const activeQuickDate = document.querySelector('.quick-date-btn.active');
        if (activeQuickDate) {
            state.quickDate = activeQuickDate.dataset.type;
        }

        return state;
    }

    // 公共方法：应用筛选状态
    applyFilterState(state) {
        // 应用标签筛选
        document.querySelectorAll('.tag-filter-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (state.tags.includes(btn.textContent.trim())) {
                btn.classList.add('selected');
            }
        });

        // 应用项目筛选
        const projectSelect = document.getElementById('project-filter-select');
        if (projectSelect) {
            projectSelect.value = state.project;
        }

        // 应用日期筛选
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        if (startDate) startDate.value = state.dateRange.start;
        if (endDate) endDate.value = state.dateRange.end;

        // 应用快捷日期
        document.querySelectorAll('.quick-date-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === state.quickDate) {
                btn.classList.add('active');
            }
        });

        // 更新状态
        this.updateTagCount();
        this.checkFilterStatus();
    }

    initDefaultCollapseState() {
        const content = document.getElementById('unified-filter-content');
        const toggleBtn = document.getElementById('unified-filter-toggle');
        
        if (content && toggleBtn) {
            // 检查本地存储中的折叠状态
            const savedCollapsed = this.getCollapseState();
            const shouldCollapse = savedCollapsed !== null ? savedCollapsed : true; // 默认折叠
            
            if (shouldCollapse) {
                // 设置为折叠状态
                content.classList.add('collapsed');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-chevron-up';
                }
                toggleBtn.title = '展开';
            } else {
                // 设置为展开状态
                content.classList.remove('collapsed');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-chevron-down';
                }
                toggleBtn.title = '折叠';
            }
        }
    }

    /**
     * 保存折叠状态到本地存储
     * @param {boolean} collapsed - 是否折叠
     */
    saveCollapseState(collapsed) {
        try {
            localStorage.setItem('unified_filter_collapsed', collapsed.toString());
        } catch (error) {
            console.warn('保存折叠状态失败:', error);
        }
    }

    /**
     * 从本地存储获取折叠状态
     * @returns {boolean|null} 是否折叠，null表示使用默认状态
     */
    getCollapseState() {
        try {
            const value = localStorage.getItem('unified_filter_collapsed');
            return value === null ? null : value === 'true';
        } catch (error) {
            console.warn('获取折叠状态失败:', error);
            return null;
        }
    }
}

// 初始化统一筛选管理器
document.addEventListener('DOMContentLoaded', function() {
    window.unifiedFilterManager = new UnifiedFilterManager();
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedFilterManager;
} 