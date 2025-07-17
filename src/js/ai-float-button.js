/**
 * AI悬浮球按钮管理器
 * 在最近要做视图的右下角显示AI新建悬浮球
 */
const AIFloatButtonManager = {
    // 悬浮球按钮元素
    floatButton: null,
    
    // AI新建模态框元素
    modal: null,
    
    // 当前是否显示悬浮球
    isVisible: false,

    /**
     * 初始化AI悬浮球
     */
    init() {
        console.log('初始化AI悬浮球...');
        
        // 检查用户是否已登录
        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname) {
            console.log('用户未登录，不显示AI悬浮球');
            return;
        }
        
        try {
            this.createFloatButton();
            this.createModal();
            this.bindEvents();
            this.showFloatButton();
            
            console.log('AI悬浮球初始化完成');
        } catch (error) {
            console.error('AI悬浮球初始化失败:', error);
        }
    },

    /**
     * 创建悬浮球按钮
     */
    createFloatButton() {
        // 检查是否已经存在悬浮球
        if (document.querySelector('.ai-float-button')) {
            console.log('AI悬浮球已存在，跳过创建');
            return;
        }

        // 创建悬浮球按钮
        this.floatButton = document.createElement('button');
        this.floatButton.className = 'ai-float-button';
        this.floatButton.innerHTML = '<i class="fas fa-robot ai-icon"></i>';
        this.floatButton.title = 'AI新建';
        
        // 添加到页面
        document.body.appendChild(this.floatButton);
        
        console.log('AI悬浮球按钮创建完成');
    },

    /**
     * 创建AI新建模态框
     */
    createModal() {
        // 检查是否已经存在模态框
        if (document.querySelector('.ai-create-modal')) {
            console.log('AI新建模态框已存在，跳过创建');
            return;
        }

        // 创建模态框
        this.modal = document.createElement('div');
        this.modal.className = 'ai-create-modal';
        this.modal.innerHTML = `
            <div class="ai-create-content">
                <div class="ai-create-header">
                    <h3><i class="fas fa-robot"></i> AI智能助手</h3>
                    <button class="ai-create-close" title="关闭">&times;</button>
                </div>
                <div class="ai-create-body" style="padding:12px 10px 10px 10px;">
                    <!-- AI助手内容区域 -->
                    <div class="ai-frame-container" style="display: flex; flex-direction: row; align-items: flex-start; justify-content: center; gap: 24px; flex-wrap: wrap;">
                        <div class="ai-tip-page">
                            <h2>九天AI助手</h2>
                            <p>点击链接可直接在浏览器打开</p>
                            <div class="ai-url-box" id="jiutian-ai-url-box" style="cursor:pointer;user-select:all;">https://jiutian.10086.cn/largemodel/cmstore/#/cmstore/chatPage?appId=6857cd074c78b04e5a689722&appName=%E6%97%A5%E7%A8%8B%E5%88%86%E6%9E%90%E7%AE%A1%E7%90%86%E5%8A%A9%E6%89%8B&tab=[object+Object]&unread-message=%2Fportal%2Fcommon-components%23%2F</div>
                            <button class="primary-btn copy-btn" id="jiutian-copy-ai-url"><i class='fas fa-copy'></i> 复制网址</button>
                            <p style="margin-top:16px;color:#888;font-size:14px;">如无法点击，请手动复制上方网址到浏览器打开</p>
                        </div>
                        <div class="ai-tip-page">
                            <h2>讯飞星火</h2>
                            <p>点击链接可直接在浏览器打开</p>
                            <div class="ai-url-box" id="xinghuo-ai-url-box" style="cursor:pointer;user-select:all;">https://xinghuo.xfyun.cn/botShare?shareKey=0409199b5c13d5b193c96fc353a4ad98&type=bot</div>
                            <button class="primary-btn copy-btn" id="xinghuo-copy-ai-url"><i class='fas fa-copy'></i> 复制网址</button>
                            <p style="margin-top:16px;color:#888;font-size:14px;">如无法点击，请手动复制上方网址到浏览器打开</p>
                        </div>
                    </div>
                </div>
                <!-- 使用说明 -->
                <div class="ai-instructions" style="position:sticky;position:-webkit-sticky;bottom:0;left:0;right:0;z-index:10;background:inherit;box-shadow:0 -2px 8px rgba(0,0,0,0.04);border-radius:0 0 16px 16px;">
                    <div class="instructions-header">
                        <h3>提示词</h3>
                        <button class="copy-prompt-btn" id="copy-prompt-btn">
                            <i class="fas fa-copy"></i>
                            复制提示词
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(this.modal);
        
        console.log('AI新建模态框创建完成');
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 悬浮球点击事件
        if (this.floatButton) {
            this.floatButton.addEventListener('click', () => {
                this.openModal();
            });
        }

        // 模态框关闭事件
        if (this.modal) {
            // 关闭按钮点击
            const closeBtn = this.modal.querySelector('.ai-create-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal();
                });
            }

            // 九天AI 复制网址按钮点击
            const jiutianCopyBtn = this.modal.querySelector('#jiutian-copy-ai-url');
            if (jiutianCopyBtn) {
                jiutianCopyBtn.replaceWith(jiutianCopyBtn.cloneNode(true));
                const newJiutianCopyBtn = this.modal.querySelector('#jiutian-copy-ai-url');
                newJiutianCopyBtn.addEventListener('click', () => {
                    this.copyAIUrl('jiutian');
                });
            }
            // 九天AI 网址点击跳转
            const jiutianUrlBox = this.modal.querySelector('#jiutian-ai-url-box');
            if (jiutianUrlBox) {
                jiutianUrlBox.replaceWith(jiutianUrlBox.cloneNode(true));
                const newJiutianUrlBox = this.modal.querySelector('#jiutian-ai-url-box');
                newJiutianUrlBox.addEventListener('click', () => {
                    const url = newJiutianUrlBox.textContent;
                    if (window.plus && plus.runtime && plus.runtime.openURL) {
                        plus.runtime.openURL(url);
                    } else {
                        window.open(url, '_blank');
                    }
                });
            }
            // 讯飞星火 复制网址按钮点击
            const xinghuoCopyBtn = this.modal.querySelector('#xinghuo-copy-ai-url');
            if (xinghuoCopyBtn) {
                xinghuoCopyBtn.replaceWith(xinghuoCopyBtn.cloneNode(true));
                const newXinghuoCopyBtn = this.modal.querySelector('#xinghuo-copy-ai-url');
                newXinghuoCopyBtn.addEventListener('click', () => {
                    this.copyAIUrl('xinghuo');
                });
            }
            // 讯飞星火 网址点击跳转
            const xinghuoUrlBox = this.modal.querySelector('#xinghuo-ai-url-box');
            if (xinghuoUrlBox) {
                xinghuoUrlBox.replaceWith(xinghuoUrlBox.cloneNode(true));
                const newXinghuoUrlBox = this.modal.querySelector('#xinghuo-ai-url-box');
                newXinghuoUrlBox.addEventListener('click', () => {
                    const url = newXinghuoUrlBox.textContent;
                    if (window.plus && plus.runtime && plus.runtime.openURL) {
                        plus.runtime.openURL(url);
                    } else {
                        window.open(url, '_blank');
                    }
                });
            }

            // 复制提示词按钮点击
            const copyPromptBtn = this.modal.querySelector('#copy-prompt-btn');
            if (copyPromptBtn) {
                copyPromptBtn.addEventListener('click', () => {
                    this.copyPrompt();
                });
            }

            // 点击模态框背景关闭
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });

            // ESC键关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                    this.closeModal();
                }
            });
        }
    },

    /**
     * 显示悬浮球
     */
    showFloatButton() {
        if (this.floatButton) {
            this.floatButton.style.display = 'flex';
            this.isVisible = true;
            
            // 添加脉冲动画
            setTimeout(() => {
                this.floatButton.classList.add('pulse');
            }, 1000);
        }
    },

    /**
     * 隐藏悬浮球
     */
    hideFloatButton() {
        if (this.floatButton) {
            this.floatButton.style.display = 'none';
            this.isVisible = false;
            this.floatButton.classList.remove('pulse');
        }
    },

    /**
     * 打开模态框
     */
    openModal() {
        if (this.modal) {
            this.modal.classList.add('show');
            
            // 隐藏悬浮球
            this.hideFloatButton();
        }
    },

    /**
     * 关闭模态框
     */
    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            
            // 显示悬浮球
            setTimeout(() => {
                this.showFloatButton();
            }, 300);
        }
    },

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ai-message-${type}`;
        messageEl.textContent = message;
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 显示动画
        setTimeout(() => {
            messageEl.classList.add('show');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    },

    /**
     * 根据视图切换显示/隐藏悬浮球
     */
    toggleByView(viewName) {
        // 在以下页面显示AI浮动球：事件、项目、清单、倒数日
        const showInViews = ['recent', 'projects', 'todolist', 'countdown'];
        
        if (showInViews.includes(viewName)) {
            this.showFloatButton();
        } else {
            this.hideFloatButton();
        }
    },

    /**
     * 销毁组件
     */
    destroy() {
        if (this.floatButton && this.floatButton.parentNode) {
            this.floatButton.parentNode.removeChild(this.floatButton);
        }
        
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        this.floatButton = null;
        this.modal = null;
        this.isVisible = false;
    },

    /**
     * 复制AI网址
     */
    copyAIUrl(type = 'jiutian') {
        let urlBox, copyBtn;
        if (type === 'jiutian') {
            urlBox = this.modal.querySelector('#jiutian-ai-url-box');
            copyBtn = this.modal.querySelector('#jiutian-copy-ai-url');
        } else {
            urlBox = this.modal.querySelector('#xinghuo-ai-url-box');
            copyBtn = this.modal.querySelector('#xinghuo-copy-ai-url');
        }
        if (urlBox && copyBtn) {
            const url = urlBox.textContent;
            navigator.clipboard.writeText(url).then(() => {
                this.showMessage('网址已复制到剪贴板', 'success');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '已复制';
                copyBtn.style.background = 'var(--success-color, #34a853)';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showMessage('网址已复制到剪贴板', 'success');
            });
        }
    },

    /**
     * 复制提示词
     */
    copyPrompt() {
        const copyBtn = this.modal.querySelector('#copy-prompt-btn');
        
        if (copyBtn) {
            // 完整的提示词内容
            const promptText = `我有个日程软件，需要请您把用户输入的所有内容严格的按照以下逻辑转换成有清单功能、倒数日功能、还有事件新建，生成markdown时表头和内容要分成两个markdown文档生成，提示用户表头不用复制，表头的显示仅为提示用户，多谢

1、清单
生成规则清单中添加的内容是持续时间不超过半小时的事件作为清单按照清单格式生成
格式如下
清单名称 | 事项内容 | 截止日期 | 优先级 | 标签
例如：
购物清单 | 买牛奶 | 2024-03-20 | 高 | 日常,生活
购物清单 | 买面包 | 2024-03-20 | 中 | 日常,生活
工作清单 | 完成报告 | 2024-03-25 | 高 | 工作,紧急
工作清单 | 预约会议 | 2024-03-22 | 中 | 工作,会议
用markdown生成、生成后提示用户在清单中的":"中点击文本导入然后再对话框输入即可

2、倒数日
生成规则：倒数日是用户认为重要的日子，如竞标日、面试日、生日、结婚纪念日、恋爱开始的日子、学习毕业的日子等类型的一日作为倒数日文本标准进行处理生成，要判断该日子是否会重复在进行生成
格式如下
纪念日名称 | 日期 | 类型 | 图标 | 颜色 | 备注
例如：
结婚纪念日 | 2020-05-20 | yearly | 💑 | #ff4081 | 我们的结婚纪念日
生日 | 1990-01-01 | yearly | 🎂 | #4caf50 | 我的生日
毕业纪念日 | 2015-06-30 | yearly | 🎓 | #2196f3 | 大学毕业纪念日
用markdown生成、生成后提示用户在倒数日中的":"中点击文本导入然后再对话框输入即可

3、事项
生成规则:添加、持续时间超过20分钟的事件作为事项去生成，如用户提及上班或者上学或者要重复的事件需要根据用户提供的内容设置对应的重复逻辑
格式如下
事件名称 | 开始时间 | 结束时间 | 地点 | 参与人员 | 标签 | 所属项目 | 重复设置
例如：
产品评审会 | 2024-03-20 14:00 | 2024-03-20 16:00 | 会议室A | 张三、李四 | 重要,会议 | 产品迭代 | daily,2024-04-20,10
周会 | 2024-03-21 10:00 | 2024-03-21 11:30 | 线上 | 产品组 | 例会,产品 | 日常工作 | weekly,2024-06-21
月报会议 | 2024-03-25 15:00 | 2024-03-25 16:00 | 会议室B | 全体 | 会议,月度 | 日常工作 | monthly,2024-12-25,12
年会 | 2024-12-31 09:00 | 2024-12-31 18:00 | 总部 | 全体员工 | 重要,年会 | 公司活动 | yearly,2025-12-31
用markdown生成、生成后提示用户在新建中的外部导入中文本导入对话框输入即可

以下是用户输入内容的部分`;
            
            // 复制到剪贴板
            navigator.clipboard.writeText(promptText).then(() => {
                // 显示成功消息
                this.showMessage('提示词已复制到剪贴板', 'success');
                
                // 按钮状态变化
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                copyBtn.style.background = 'var(--success-color, #34a853)';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            }).catch(() => {
                // 降级处理：手动复制
                const textArea = document.createElement('textarea');
                textArea.value = promptText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.showMessage('提示词已复制到剪贴板', 'success');
            });
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户是否已登录
    const userNickname = localStorage.getItem('userNickname');
    if (!userNickname) {
        console.log('用户未登录，不初始化AI浮球');
        return;
    }
    
    // 等待其他管理器初始化完成
    setTimeout(() => {
        AIFloatButtonManager.init();
        
        // 监听视图切换事件
        if (window.UIManager) {
            // 重写UIManager的switchView方法以支持悬浮球显示/隐藏
            const originalSwitchView = UIManager.switchView;
            UIManager.switchView = function(viewName) {
                originalSwitchView.call(this, viewName);
                AIFloatButtonManager.toggleByView(viewName);
            };
            
            // 初始化时根据当前视图显示/隐藏悬浮球
            const currentView = document.querySelector('.view-section.active');
            if (currentView) {
                const showInViews = ['recent-tasks', 'projects', 'todolist', 'countdown'];
                if (showInViews.includes(currentView.id)) {
                    AIFloatButtonManager.showFloatButton();
                } else {
                    AIFloatButtonManager.hideFloatButton();
                }
            }
        }
    }, 1000);
});

// 导出到全局作用域
window.AIFloatButtonManager = AIFloatButtonManager; 

// 移动端设置菜单显示时自动隐藏AI悬浮球，关闭时恢复

document.addEventListener('DOMContentLoaded', function() {
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal || !window.AIFloatButtonManager) return;

    function isMobile() {
        return window.innerWidth <= 900;
    }

    // 监听设置弹窗属性变化
    const observer = new MutationObserver(() => {
        if (isMobile()) {
            if (settingsModal.classList.contains('show') || settingsModal.style.display === 'block') {
                AIFloatButtonManager.hideFloatButton();
            } else {
                // 只在允许显示的视图下恢复
                if (AIFloatButtonManager.isVisible === false) {
                    const currentView = document.querySelector('.view-section.active');
                    const showInViews = ['recent-tasks', 'projects', 'todolist', 'countdown'];
                    if (currentView && showInViews.includes(currentView.id)) {
                        AIFloatButtonManager.showFloatButton();
                    }
                }
            }
        }
    });
    observer.observe(settingsModal, { attributes: true, attributeFilter: ['class', 'style'] });

    // 屏幕尺寸变化时也要同步
    window.addEventListener('resize', () => {
        if (!isMobile()) {
            // PC端直接恢复
            AIFloatButtonManager.showFloatButton();
        } else if (settingsModal.classList.contains('show') || settingsModal.style.display === 'block') {
            AIFloatButtonManager.hideFloatButton();
        }
    });
}); 