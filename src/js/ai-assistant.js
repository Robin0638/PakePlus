// AI助手页面JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const backBtn = document.getElementById('back-btn');
    const toggleInstructionsBtn = document.getElementById('toggle-instructions');
    const instructionsContent = document.getElementById('instructions-content');
    const toggleText = document.querySelector('.toggle-text');
    const toggleIcon = document.querySelector('.toggle-icon');
    const aiIframe = document.querySelector('.ai-iframe');

    // 返回按钮功能
    backBtn.addEventListener('click', function() {
        // 检查是否可以返回上一页
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            // 如果没有上一页记录，直接跳转到主页
            window.location.href = 'index.html';
        }
    });

    // 键盘快捷键支持
    document.addEventListener('keydown', function(event) {
        // ESC键返回
        if (event.key === 'Escape') {
            backBtn.click();
        }
        
        // Ctrl/Cmd + I 切换说明显示
        if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
            event.preventDefault();
            toggleInstructionsBtn.click();
        }
    });

    // 说明折叠功能
    let isInstructionsCollapsed = false;
    
    toggleInstructionsBtn.addEventListener('click', function() {
        isInstructionsCollapsed = !isInstructionsCollapsed;
        
        if (isInstructionsCollapsed) {
            instructionsContent.classList.add('collapsed');
            toggleText.textContent = '展开';
            toggleIcon.classList.add('rotated');
        } else {
            instructionsContent.classList.remove('collapsed');
            toggleText.textContent = '收起';
            toggleIcon.classList.remove('rotated');
        }
        
        // 保存状态到localStorage
        localStorage.setItem('aiInstructionsCollapsed', isInstructionsCollapsed);
    });

    // 恢复说明折叠状态
    const savedCollapsedState = localStorage.getItem('aiInstructionsCollapsed');
    if (savedCollapsedState === 'true') {
        isInstructionsCollapsed = true;
        instructionsContent.classList.add('collapsed');
        toggleText.textContent = '展开';
        toggleIcon.classList.add('rotated');
    }

    // iframe加载处理
    if (aiIframe) {
        aiIframe.addEventListener('load', function() {
            // 移除加载提示
            aiIframe.classList.add('loaded');
            
            // 同时给容器添加loaded类
            const frameContainer = aiIframe.closest('.ai-frame-container');
            if (frameContainer) {
                frameContainer.classList.add('loaded');
            }
            
            // 添加加载完成动画
            aiIframe.style.opacity = '0';
            setTimeout(() => {
                aiIframe.style.transition = 'opacity 0.3s ease';
                aiIframe.style.opacity = '1';
                
                // 显示登录提示
                setTimeout(() => {
                    showSuccessMessage('AI助手加载成功！\n如需使用完整功能，请登录讯飞账号。');
                }, 500);
            }, 100);
        });

        // 处理iframe加载错误
        aiIframe.addEventListener('error', function() {
            console.error('AI助手iframe加载失败');
            showErrorMessage('AI助手加载失败，请检查网络连接后刷新页面');
            
            // 即使加载失败也要隐藏加载提示
            aiIframe.classList.add('loaded');
            const frameContainer = aiIframe.closest('.ai-frame-container');
            if (frameContainer) {
                frameContainer.classList.add('loaded');
            }
        });
    }

    // 显示错误消息
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 0.7rem 1.2rem;
            border-radius: 6px;
            box-shadow: 0 3px 15px rgba(220, 53, 69, 0.3);
            z-index: 1000;
            max-width: 280px;
            font-size: 0.85rem;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            errorDiv.style.transition = 'opacity 0.3s ease';
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 300);
        }, 3000);
    }

    // 显示成功消息
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        successDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${isDarkMode ? '#28a745' : '#28a745'};
            color: white;
            padding: 0.7rem 1.2rem;
            border-radius: 6px;
            box-shadow: 0 3px 15px ${isDarkMode ? 'rgba(40, 167, 69, 0.4)' : 'rgba(40, 167, 69, 0.3)'};
            z-index: 1000;
            max-width: 320px;
            font-size: 0.85rem;
            line-height: 1.3;
            white-space: pre-line;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // 5.5秒后自动移除（成功消息显示时间稍长）
        setTimeout(() => {
            successDiv.style.transition = 'opacity 0.3s ease';
            successDiv.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                }
            }, 300);
        }, 5500);
    }

    // 监听主题变化事件
    document.addEventListener('aiThemeChanged', (event) => {
        console.log('AI助手主题已切换为:', event.detail.theme);
        // 可以在这里添加主题变化时的额外处理逻辑
    });

    // 页面可见性变化处理
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // 页面重新可见时，可以刷新iframe
            // 这里可以根据需要决定是否刷新
        }
    });

    // 窗口大小变化处理
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // 重新计算iframe高度等
            if (aiIframe) {
                // 触发iframe重新布局
                aiIframe.style.height = aiIframe.offsetHeight + 'px';
                setTimeout(() => {
                    aiIframe.style.height = '';
                }, 10);
            }
        }, 250);
    });

    // 添加页面加载动画
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // 添加触摸设备支持
    if ('ontouchstart' in window) {
        // 为触摸设备优化交互
        backBtn.style.minHeight = '44px'; // iOS推荐的最小触摸目标
        toggleInstructionsBtn.style.minHeight = '44px';
        
        // 添加触摸反馈
        backBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        backBtn.addEventListener('touchend', function() {
            this.style.transform = '';
        });
        
        toggleInstructionsBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        toggleInstructionsBtn.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    }

    // 性能监控
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('AI助手页面加载时间:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }

    // 错误处理
    window.addEventListener('error', function(event) {
        console.error('页面错误:', event.error);
    });

    // 未处理的Promise拒绝
    window.addEventListener('unhandledrejection', function(event) {
        console.error('未处理的Promise拒绝:', event.reason);
    });
}); 