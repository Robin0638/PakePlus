/**
 * Clear Data Dialog Manager
 */

class ClearDialogManager {
    constructor() {
        this.overlay = document.getElementById('clear-dialog-overlay');
        this.step1 = document.getElementById('clear-step-1');
        this.step2 = document.getElementById('clear-step-2');
        this.confirmInput = document.getElementById('clear-confirm-input');
        this.finalBtn = document.getElementById('clear-final-btn');
        this.isVisible = false;
        this.originalBodyStyle = '';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.showStep1();
    }

    bindEvents() {
        // Clear button click event
        const clearBtn = document.getElementById('clear-all-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.show();
            });
        }

        // Close button
        const closeBtn = document.getElementById('clear-dialog-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hide();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('clear-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hide();
            });
        }

        // Confirm clear button
        const confirmBtn = document.getElementById('clear-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showStep2();
            });
        }

        // Back button
        const backBtn = document.getElementById('clear-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showStep1();
            });
        }

        // Final confirm button
        if (this.finalBtn) {
            this.finalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.executeClear();
            });
        }

        // Confirm input field
        if (this.confirmInput) {
            this.confirmInput.addEventListener('input', (e) => {
                this.validateInput(e.target.value);
            });

            this.confirmInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.finalBtn.disabled) {
                    e.preventDefault();
                    this.executeClear();
                }
            });

            // Mobile input optimization
            this.confirmInput.addEventListener('focus', () => {
                // Delay scrolling to input field position
                setTimeout(() => {
                    this.scrollToInput();
                }, 300);
            });
        }

        // Click overlay to close
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });

            // Prevent overlay scrolling
            this.overlay.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Mobile back button handling
        window.addEventListener('popstate', () => {
            if (this.isVisible) {
                this.hide();
            }
        });
    }

    show() {
        if (this.overlay) {
            this.isVisible = true;
            this.overlay.classList.add('show');
            this.preventBodyScroll();
            this.showStep1();
            
            // Mobile optimization: Add history record
            if (window.history && window.history.pushState) {
                window.history.pushState({ dialog: 'clear' }, '');
            }
        }
    }

    hide() {
        if (this.overlay) {
            this.isVisible = false;
            this.overlay.classList.remove('show');
            this.restoreBodyScroll();
            this.reset();
            
            // Mobile optimization: Remove history record
            if (window.history && window.history.state && window.history.state.dialog === 'clear') {
                window.history.back();
            }
        }
    }

    isDialogVisible() {
        return this.isVisible;
    }

    showStep1() {
        if (this.step1 && this.step2) {
            this.step1.classList.add('show');
            this.step2.classList.remove('show');
        }
    }

    showStep2() {
        if (this.step1 && this.step2) {
            this.step1.classList.remove('show');
            this.step2.classList.add('show');
            
            // Focus on input field
            if (this.confirmInput) {
                setTimeout(() => {
                    this.confirmInput.focus();
                }, 300);
            }
        }
    }

    validateInput(value) {
        const expectedText = 'Clear All Content';
        const isValid = value.trim() === expectedText;
        
        if (this.finalBtn) {
            this.finalBtn.disabled = !isValid;
        }
        
        if (this.confirmInput) {
            if (isValid) {
                this.confirmInput.classList.remove('error');
            } else {
                this.confirmInput.classList.add('error');
            }
        }
    }

    reset() {
        // Reset input field
        if (this.confirmInput) {
            this.confirmInput.value = '';
            this.confirmInput.classList.remove('error');
        }
        
        // Reset button state
        if (this.finalBtn) {
            this.finalBtn.disabled = true;
        }
        
        // Return to step 1
        this.showStep1();
    }

    // Prevent body scrolling
    preventBodyScroll() {
        this.originalBodyStyle = document.body.style.cssText;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
    }

    // Restore body scrolling
    restoreBodyScroll() {
        document.body.style.cssText = this.originalBodyStyle;
    }

    // Scroll to input field position (mobile optimization)
    scrollToInput() {
        if (this.confirmInput && this.isMobile()) {
            const rect = this.confirmInput.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const inputHeight = rect.height;
            const inputTop = rect.top;
            
            // If input field is in the lower half of the screen, scroll to a suitable position
            if (inputTop > windowHeight * 0.6) {
                const scrollY = inputTop - windowHeight * 0.3;
                window.scrollTo({
                    top: window.scrollY + scrollY,
                    behavior: 'smooth'
                });
            }
        }
    }

    // Check if it's a mobile device
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    async executeClear() {
        try {
            // Disable button, show loading state
            if (this.finalBtn) {
                this.finalBtn.disabled = true;
                this.finalBtn.innerHTML = '<span class="clear-loading"></span>Clearing...';
            }

            // Set confirmation flag
            sessionStorage.setItem('clearDataConfirmed', 'true');
            
            // Delay to let the user see the loading state
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirect to clear page
            window.location.href = 'clear.html';
            
        } catch (error) {
            console.error('Failed to clear data:', error);
            
            // Restore button state
            if (this.finalBtn) {
                this.finalBtn.disabled = false;
                this.finalBtn.innerHTML = '<i class="fas fa-trash"></i>Final Confirm';
            }
            
            // Show error notification
            if (window.UIManager && typeof UIManager.showNotification === 'function') {
                UIManager.showNotification('Failed to clear data, please try again', 'error');
            }
        }
    }
}

// Global clear data function (for backward compatibility)
function clearAllData() {
    if (window.clearDialogManager) {
        clearDialogManager.show();
    } else {
        // If dialog manager is not initialized, redirect directly to clear page
        sessionStorage.setItem('clearDataConfirmed', 'true');
        window.location.href = 'clear.html';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.clearDialogManager = new ClearDialogManager();
});

// Export
window.ClearDialogManager = ClearDialogManager;
window.clearAllData = clearAllData;