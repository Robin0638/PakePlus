const AIManager = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Open AI modal
        const openAIModalBtn = document.getElementById('open-ai-modal');
        const aiModal = document.getElementById('ai-modal');
        const closeAIModalBtn = document.getElementById('close-ai-modal');
        const cancelAIModalBtn = document.getElementById('cancel-ai-modal');
        const applyAIResultBtn = document.getElementById('apply-ai-result');

        if (openAIModalBtn) {
            openAIModalBtn.addEventListener('click', () => {
                if (aiModal) {
                    aiModal.style.display = 'block';
                }
            });
        }

        // Close AI modal
        if (closeAIModalBtn) {
            closeAIModalBtn.addEventListener('click', () => {
                if (aiModal) {
                    aiModal.style.display = 'none';
                }
            });
        }

        if (cancelAIModalBtn) {
            cancelAIModalBtn.addEventListener('click', () => {
                if (aiModal) {
                    aiModal.style.display = 'none';
                }
            });
        }

        // Close when clicking outside the modal
        if (aiModal) {
            aiModal.addEventListener('click', (e) => {
                if (e.target === aiModal) {
                    aiModal.style.display = 'none';
                }
            });
        }
    }
};

// Initialize AI manager
document.addEventListener('DOMContentLoaded', () => {
    AIManager.init();
}); 