/**
 * AI Floating Button Manager
 * Displays AINew floating button in the bottom right corner of the Soon view
 */
const AIFloatButtonManager = {
    // Floating button element
    floatButton: null,
    
    // AINew modal element
    modal: null,
    
    // Whether the floating button is currently visible
    isVisible: false,

    /**
     * Initialize AI floating button
     */
    init() {
        console.log('Initializing AI floating button...');
        
        // Check if user is logged in
        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname) {
            console.log('User not logged in, AI floating button will not be displayed');
            return;
        }
        
        try {
            this.createFloatButton();
            this.createModal();
            this.bindEvents();
            this.showFloatButton();
            
            console.log('AI floating button initialization complete');
        } catch (error) {
            console.error('AI floating button initialization failed:', error);
        }
    },

    /**
     * Create floating button
     */
    createFloatButton() {
        // Check if floating button already exists
        if (document.querySelector('.ai-float-button')) {
            console.log('AI floating button already exists, skipping creation');
            return;
        }

        // Create floating button
        this.floatButton = document.createElement('button');
        this.floatButton.className = 'ai-float-button';
        this.floatButton.innerHTML = '<i class="fas fa-robot ai-icon"></i>';
        this.floatButton.title = 'AINew';
        
        // Add to page
        document.body.appendChild(this.floatButton);
        
        console.log('AI floating button created successfully');
    },

    /**
     * Create AINew modal
     */
    createModal() {
        // Check if modal already exists
        if (document.querySelector('.ai-create-modal')) {
            console.log('AINew modal already exists, skipping creation');
            return;
        }

        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'ai-create-modal';
        this.modal.innerHTML = `
            <div class="ai-create-content">
                <div class="ai-create-header">
                    <h3><i class="fas fa-robot"></i> AI Intelligent Assistant</h3>
                    <button class="ai-create-close" title="Close">&times;</button>
                </div>
                <div class="ai-create-body" style="padding:12px 10px 10px 10px;">
                    <!-- AI Assistant content area -->
                    <div class="ai-frame-container" style="display: flex; flex-direction: row; align-items: flex-start; justify-content: center; gap: 24px; flex-wrap: wrap;">
                        <div class="ai-tip-page">
                            <h2>Jiutian AI Assistant</h2>
                            <p>Click the link to open directly in browser</p>
                            <div class="ai-url-box" id="jiutian-ai-url-box" style="cursor:pointer;user-select:all;">https://jiutian.10086.cn/largemodel/cmstore/#/cmstore/chatPage?appId=6857cd074c78b04e5a689722&appName=%E6%97%A5%E7%A8%8B%E5%88%86%E6%9E%90%E7%AE%A1%E7%90%86%E5%8A%A9%E6%89%8B&tab=[object+Object]&unread-message=%2Fportal%2Fcommon-components%23%2F</div>
                            <button class="primary-btn copy-btn" id="jiutian-copy-ai-url"><i class='fas fa-copy'></i> Copy URL</button>
                            <p style="margin-top:16px;color:#888;font-size:14px;">If clicking doesn't work, please manually copy the URL above to your browser</p>
                        </div>
                        <div class="ai-tip-page">
                            <h2>iFLYTEK Spark</h2>
                            <p>Click the link to open directly in browser</p>
                            <div class="ai-url-box" id="xinghuo-ai-url-box" style="cursor:pointer;user-select:all;">https://xinghuo.xfyun.cn/botShare?shareKey=0409199b5c13d5b193c96fc353a4ad98&type=bot</div>
                            <button class="primary-btn copy-btn" id="xinghuo-copy-ai-url"><i class='fas fa-copy'></i> Copy URL</button>
                            <p style="margin-top:16px;color:#888;font-size:14px;">If clicking doesn't work, please manually copy the URL above to your browser</p>
                        </div>
                    </div>
                </div>
                <!-- Instructions -->
                <div class="ai-instructions" style="position:sticky;position:-webkit-sticky;bottom:0;left:0;right:0;z-index:10;background:inherit;box-shadow:0 -2px 8px rgba(0,0,0,0.04);border-radius:0 0 16px 16px;">
                    <div class="instructions-header">
                        <h3>Prompts</h3>
                        <button class="copy-prompt-btn" id="copy-prompt-btn">
                            <i class="fas fa-copy"></i>
                            Copy Prompts
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(this.modal);
        
        console.log('AINew modal created successfully');
    },

    /**
     * Bind Events
     */
    bindEvents() {
        // Floating button click event
        if (this.floatButton) {
            this.floatButton.addEventListener('click', () => {
                this.openModal();
            });
        }

        // Modal close events
        if (this.modal) {
            // Close button click
            const closeBtn = this.modal.querySelector('.ai-create-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal();
                });
            }

            // Jiutian AI copy URL button click
            const jiutianCopyBtn = this.modal.querySelector('#jiutian-copy-ai-url');
            if (jiutianCopyBtn) {
                jiutianCopyBtn.replaceWith(jiutianCopyBtn.cloneNode(true));
                const newJiutianCopyBtn = this.modal.querySelector('#jiutian-copy-ai-url');
                newJiutianCopyBtn.addEventListener('click', () => {
                    this.copyAIUrl('jiutian');
                });
            }
            // Jiutian AI URL click redirect
            const jiutianUrlBox = this.modal.querySelector('#jiutian-ai-url-box');
            if (jiutianUrlBox) {
                jiutianUrlBox.replaceWith(jiutianUrlBox.cloneNode(true));
                const newJiutianUrlBox = this.modal.querySelector('#jiutian-ai-url-box');
                newJiutianUrlBox.addEventListener('click', () => {
                    const url = newJiutianUrlBox.textContent;
                    window.open(url, '_blank', 'width=1000,height=800,noopener,noreferrer');
                });
            }
            // iFLYTEK Spark copy URL button click
            const xinghuoCopyBtn = this.modal.querySelector('#xinghuo-copy-ai-url');
            if (xinghuoCopyBtn) {
                xinghuoCopyBtn.replaceWith(xinghuoCopyBtn.cloneNode(true));
                const newXinghuoCopyBtn = this.modal.querySelector('#xinghuo-copy-ai-url');
                newXinghuoCopyBtn.addEventListener('click', () => {
                    this.copyAIUrl('xinghuo');
                });
            }
            // iFLYTEK Spark URL click redirect
            const xinghuoUrlBox = this.modal.querySelector('#xinghuo-ai-url-box');
            if (xinghuoUrlBox) {
                xinghuoUrlBox.replaceWith(xinghuoUrlBox.cloneNode(true));
                const newXinghuoUrlBox = this.modal.querySelector('#xinghuo-ai-url-box');
                newXinghuoUrlBox.addEventListener('click', () => {
                    const url = newXinghuoUrlBox.textContent;
                    window.open(url, '_blank', 'width=1000,height=800,noopener,noreferrer');
                });
            }

            // Copy prompts button click
            const copyPromptBtn = this.modal.querySelector('#copy-prompt-btn');
            if (copyPromptBtn) {
                copyPromptBtn.addEventListener('click', () => {
                    this.copyPrompt();
                });
            }

            // Close modal when clicking on background
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });

            // Close with ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                    this.closeModal();
                }
            });
        }
    },

    /**
     * Show floating button
     */
    showFloatButton() {
        if (this.floatButton) {
            this.floatButton.style.display = 'flex';
            this.isVisible = true;
            
            // Add pulse animation
            setTimeout(() => {
                this.floatButton.classList.add('pulse');
            }, 1000);
        }
    },

    /**
     * Hide floating button
     */
    hideFloatButton() {
        if (this.floatButton) {
            this.floatButton.style.display = 'none';
            this.isVisible = false;
            this.floatButton.classList.remove('pulse');
        }
    },

    /**
     * Open modal
     */
    openModal() {
        if (this.modal) {
            this.modal.classList.add('show');
            
            // Hide floating button
            this.hideFloatButton();
        }
    },

    /**
     * Close modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            
            // Show floating button
            setTimeout(() => {
                this.showFloatButton();
            }, 300);
        }
    },

    /**
     * Show message
     */
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ai-message-${type}`;
        messageEl.textContent = message;
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Show animation
        setTimeout(() => {
            messageEl.classList.add('show');
        }, 100);
        
        // Auto hide
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
     * Toggle floating button visibility based on view
     */
    toggleByView(viewName) {
        // Show AI floating button in these pages: Things, Item, List, Countdown Day
        const showInViews = ['recent', 'projects', 'todoList', 'countdown'];
        
        if (showInViews.includes(viewName)) {
            this.showFloatButton();
        } else {
            this.hideFloatButton();
        }
    },

    /**
     * Destroy component
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
     * Copy AI URL
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
                this.showMessage('URL copied to clipboard', 'success');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied';
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
                this.showMessage('URL copied to clipboard', 'success');
            });
        }
    },

    /**
     * Copy prompts
     */
    copyPrompt() {
        const copyBtn = this.modal.querySelector('#copy-prompt-btn');
        
        if (copyBtn) {
            // Complete prompt content
            const promptText = `I have a schedule software. You need to strictly convert all the content entered by the user into a List function, a Countdown Day function, and a ThingsNew in accordance with the following logic. When generating markdown, the header and content should be divided into two markdown documents to generate, prompting the user that the header does not need to be copied, the display of the header is only to prompt the user, thank you

1. List
Generation rule The content added by Listmedium is things that last no more than half an hour as a list and are generated in the List format
The format is as follows
List name | Item content | Deadline | Priority | Label
For example：
Shopping List | Buy milk | 2024-03-20 / high | daily life, life
Shopping List | Buy bread | 2024-03-20 | medium | daily life, life
Work List | Completed Report | 2024-03-25 / high | work, urgent
Work List | Appointment meeting | 2024-03-22 | medium | Work, meeting
Use markdown to generate, and after generation, prompt the user to click on the text import in the ":" medium of Listmedium, and then enter it in the dialog box.

2. Countdown Day
Generation rules: Countdown Day is a day that the user considers important, such as bidding day, interview day, birthday, wedding anniversary, the day when the relationship begins, the day when the study graduates, and other types of days are processed and generated as the Countdown Day text standard. It is necessary to determine whether the day will be repeated in the generation.
The format is as follows
Anniversary name | Date | Type | icon | color | Remark
For example：
Wedding anniversary | 2020-05-20 | yearly | 💑 / #ff4081 / Our wedding anniversary
Birthday | 1990-01-01 | yearly | 🎂 / #4caf50 | My birthday
Graduation anniversary | 2015-06-30 | yearly | 🎓 / #2196f3 | University graduation Anniversary
Use markdown to generate, and after the generation, the user is prompted to click on the text import in the ":" medium of Countdown Daymedium and then enter it in the dialog box.

3. Matters
Generation rules: Add and generate things that last for more than 20 minutes as matters. For example, if the user mentions going to work or school or things to be repeated, the corresponding repetition logic needs to be set according to the content provided by the user.
The format is as follows
Name | Start time | end time | place | Participants | Label | Item to which it belongs | Repeat Set
For example：
Product review meeting | 2024-03-20 14:00 | 2024-03-20 16:00 | Conference room A / Zhang San, Li Si | Important, Conference | Product iteration | daily, 2024-04-20, 10
Weekly meeting | 2024-03-21 10:00 | 2024-03-21 11:30 | Online | Product group | Regular meeting, Product | daily work | weekly, 2024-06-21
Monthly report meeting | 2024-03-25 15:00 | 2024-03-25 16:00 | Meeting room B / All / Meeting, monthly / daily work | monthly, 2024-12-25, 12
Annual meeting | 2024-12-31 09:00 | 2024-12-31 18:00 | Headquarters | All employees | important, annual meeting | company activities | yearly, 2025-12-31
Use markdown to generate and prompt the user to enter in the external import medium text import dialog box of Newmedium after generation.

The following is the part of the user input content`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(promptText).then(() => {
                // Show success message
                this.showMessage('Prompts copied to clipboard', 'success');
                
                // Button state change
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
                copyBtn.style.background = 'var(--success-color, #34a853)';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            }).catch(() => {
                // Fallback: manual copy
                const textArea = document.createElement('textarea');
                textArea.value = promptText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.showMessage('Prompts copied to clipboard', 'success');
            });
        }
    }
};

// Initialize after page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const userNickname = localStorage.getItem('userNickname');
    if (!userNickname) {
        console.log('User not logged in, AI floating button will not be initialized');
        return;
    }
    
    // Wait for other managers to initialize
    setTimeout(() => {
        AIFloatButtonManager.init();
        
        // Listen for view switching events
        if (window.UIManager) {
            // Override UIManager's switchView method to support floating button display/hide
            const originalSwitchView = UIManager.switchView;
            UIManager.switchView = function(viewName) {
                originalSwitchView.call(this, viewName);
                AIFloatButtonManager.toggleByView(viewName);
            };
            
            // Show/hide floating button based on current view at initialization
            const currentView = document.querySelector('.view-section.active');
            if (currentView) {
                const showInViews = ['recent-tasks', 'projects', 'todoList', 'countdown'];
                if (showInViews.includes(currentView.id)) {
                    AIFloatButtonManager.showFloatButton();
                } else {
                    AIFloatButtonManager.hideFloatButton();
                }
            }
        }
    }, 1000);
});

// Export to global scope
window.AIFloatButtonManager = AIFloatButtonManager; 

// Automatically hide AI floating button when mobile settings menu is shown, restore when closed

document.addEventListener('DOMContentLoaded', function() {
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal || !window.AIFloatButtonManager) return;

    function isMobile() {
        return window.innerWidth <= 900;
    }

    // Monitor settings modal attribute changes
    const observer = new MutationObserver(() => {
        if (isMobile()) {
            if (settingsModal.classList.contains('show') || settingsModal.style.display === 'block') {
                AIFloatButtonManager.hideFloatButton();
            } else {
                // Only restore in views where display is allowed
                if (AIFloatButtonManager.isVisible === false) {
                    const currentView = document.querySelector('.view-section.active');
                    const showInViews = ['recent-tasks', 'projects', 'todoList', 'countdown'];
                    if (currentView && showInViews.includes(currentView.id)) {
                        AIFloatButtonManager.showFloatButton();
                    }
                }
            }
        }
    });
    observer.observe(settingsModal, { attributes: true, attributeFilter: ['class', 'style'] });

    // Synchronize when screen size changes
    window.addEventListener('resize', () => {
        if (!isMobile()) {
            // Directly restore on PC
            AIFloatButtonManager.showFloatButton();
        } else if (settingsModal.classList.contains('show') || settingsModal.style.display === 'block') {
            AIFloatButtonManager.hideFloatButton();
        }
    });
}); 