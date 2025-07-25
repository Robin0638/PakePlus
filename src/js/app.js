// 全局变量
let questions = [];
let chapters = {};
let currentChapter = '';
let currentQuestionIndex = 0;
let currentQuestions = [];
let userAnswers = [];
let wrongQuestions = [];
let practiceRecords = [];
let startTime = 0;
let timerInterval = null;

// 初始化应用
function initApp() {
    loadData();
    renderChapters();
    updateStats();
    bindEvents();
    
    // 生成示例数据（首次使用）
    if (questions.length === 0) {
        generateSampleData();
    }
}

// 生成示例数据
function generateSampleData() {
    const sampleQuestions = [
        {
            chapter: "第一章 基础知识",
            question: "HTML的全称是什么？",
            options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "HyperText Modern Language"],
            answer: 0,
            explanation: "HTML是HyperText Markup Language的缩写，即超文本标记语言。"
        },
        {
            chapter: "第一章 基础知识",
            question: "CSS用于什么？",
            options: ["页面结构", "页面样式", "页面逻辑", "数据存储"],
            answer: 1,
            explanation: "CSS（Cascading Style Sheets）用于控制网页的样式和布局。"
        },
        {
            chapter: "第二章 JavaScript基础",
            question: "JavaScript是什么时候被发明的？",
            options: ["1993年", "1995年", "1997年", "1999年"],
            answer: 1,
            explanation: "JavaScript由Brendan Eich在1995年发明。"
        },
        {
            chapter: "第二章 JavaScript基础",
            question: "以下哪个不是JavaScript的数据类型？",
            options: ["string", "number", "boolean", "float"],
            answer: 3,
            explanation: "JavaScript中没有float类型，数字统一为number类型。"
        }
    ];
    
    questions = sampleQuestions;
    organizeChapters();
    saveData();
    renderChapters();
    updateStats();
}

// 整理章节数据
function organizeChapters() {
    chapters = {};
    questions.forEach(q => {
        if (!chapters[q.chapter]) {
            chapters[q.chapter] = [];
        }
        chapters[q.chapter].push(q);
    });
}

// 页面切换
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    document.getElementById(pageId + '-page').classList.add('active');
    
    // 更新导航状态
    updateNavigation(pageId);
    
    // 特殊页面处理
    if (pageId === 'wrong-questions') {
        renderWrongQuestions();
    } else if (pageId === 'records') {
        renderRecords();
    } else if (pageId === 'quiz' || pageId === 'chapter-complete') {
        // 隐藏导航栏
        if (window.innerWidth > 768) {
            document.querySelector('.desktop-header').style.display = 'none';
        } else {
            document.querySelector('.mobile-bottom-nav').style.display = 'none';
        }
    } else {
        // 显示导航栏
        if (window.innerWidth > 768) {
            document.querySelector('.desktop-header').style.display = 'block';
        } else {
            document.querySelector('.mobile-bottom-nav').style.display = 'block';
        }
    }
}

// 更新导航状态
function updateNavigation(activePageId) {
    // 桌面端导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === activePageId) {
            item.classList.add('active');
        }
    });
    
    // 移动端导航
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === activePageId) {
            item.classList.add('active');
        }
    });
}

// 绑定事件
function bindEvents() {
    // 桌面端导航点击
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            showPage(item.dataset.page);
        });
    });
    
    // 移动端导航点击
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            showPage(item.dataset.page);
        });
    });
    
    // 文件拖拽
    const importSection = document.getElementById('import-section');
    
    importSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        importSection.classList.add('dragover');
    });
    
    importSection.addEventListener('dragleave', () => {
        importSection.classList.remove('dragover');
    });
    
    importSection.addEventListener('drop', (e) => {
        e.preventDefault();
        importSection.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.roi')) {
                // 加密题库文件
                if (typeof handleFileSelect === 'function') {
                    // 构造一个模拟的event对象
                    handleFileSelect({ target: { files: [file] } });
                } else {
                    alert('当前环境不支持加密题库导入');
                }
            } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                readTextFile(file);
        } else {
                alert('请拖拽 .txt 或 .roi 格式的文件');
            }
        }
    });
}

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);

// 响应式导航栏显示/隐藏
window.addEventListener('resize', function() {
    // 判断当前是否在练习界面
    const quizPageActive = document.getElementById('quiz-page')?.classList.contains('active');
    const chapterCompletePageActive = document.getElementById('chapter-complete-page')?.classList.contains('active');
    var desktopHeader = document.querySelector('.desktop-header');
    var mobileNav = document.querySelector('.mobile-bottom-nav');
    if (quizPageActive || chapterCompletePageActive) {
        // 练习/完成页面，始终隐藏顶部栏
        if (desktopHeader) desktopHeader.style.display = 'none';
        if (mobileNav) mobileNav.style.display = 'none';
        return;
    }
    if (window.innerWidth > 768) {
        // 电脑端
        if (desktopHeader) desktopHeader.style.display = 'block';
        if (mobileNav) mobileNav.style.display = 'none';
    } else {
        // 移动端
        if (desktopHeader) desktopHeader.style.display = 'none';
        if (mobileNav) mobileNav.style.display = 'block';
    }
}); 

function toggleFormatDesc() {
    var content = document.getElementById('format-desc-content');
    var btn = document.getElementById('format-desc-toggle-btn');
    if (!content || !btn) return;
    if (content.style.maxHeight === '0px') {
        content.style.maxHeight = '2000px';
        btn.innerHTML = '收起 ▲';
    } else {
        content.style.maxHeight = '0px';
        btn.innerHTML = '展开 ▼';
    }
} 