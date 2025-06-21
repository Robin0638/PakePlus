const AIManager = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // 打开AI模态框
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

        // 关闭AI模态框
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

        // 点击模态框外部关闭
        if (aiModal) {
            aiModal.addEventListener('click', (e) => {
                if (e.target === aiModal) {
                    aiModal.style.display = 'none';
                }
            });
        }
    }
};

// 初始化AI管理器
document.addEventListener('DOMContentLoaded', () => {
    AIManager.init();
}); 