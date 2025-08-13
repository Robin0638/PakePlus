class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 'black'; // 'black' or 'white'
        this.gameEnded = false;
        this.gameMode = 'pvp'; // 'pvp' or 'pve'
        this.aiPlayer = 'white'; // AI默认执白
        this.isAiThinking = false;
        this.gameStartTime = Date.now(); // 游戏开始时间
        this.playTime = 0; // 累计游玩时间（毫秒）
        this.lastResumeTime = Date.now(); // 上次恢复游戏的时间
        this.isPaused = false; // 游戏是否暂停
        this.initBoard();
        this.createBoardHTML();
    }

    initBoard() {
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = null;
            }
        }
    }

    createBoardHTML() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => this.handleCellClick(i, j));
                boardElement.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        if (this.gameEnded || this.board[row][col] !== null || this.isAiThinking) {
            return;
        }

        // 人机模式下，只允许玩家（黑棋）落子
        if (this.gameMode === 'pve' && this.currentPlayer === this.aiPlayer) {
            console.log('AI回合，玩家不能落子');
            return;
        }

        console.log('玩家落子:', row, col, '模式:', this.gameMode, '当前玩家:', this.currentPlayer);
        this.makeMove(row, col);
    }

    makeMove(row, col) {
        if (this.board[row][col] !== null) return false;

        // 落子
        this.board[row][col] = this.currentPlayer;
        this.updateCellDisplay(row, col);

        // 检查胜利
        if (this.checkWin(row, col)) {
            this.endGame(this.currentPlayer);
            return true;
        }

        // 切换玩家
        this.switchPlayer();

        // 人机模式下，如果轮到AI且不是AI刚下的棋，让AI下棋
        if (this.gameMode === 'pve' && this.currentPlayer === this.aiPlayer && !this.gameEnded && !this.isAiThinking) {
            console.log('触发AI下棋');
            this.aiMove();
        }

        return true;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updatePlayerIndicator();
    }

    updatePlayerIndicator() {
        const indicator = document.getElementById('playerIndicator');
        const text = document.getElementById('playerText');
        const label = document.getElementById('playerLabel');
        
        indicator.className = `player-indicator ${this.currentPlayer}`;
        
        if (this.gameMode === 'pve') {
            if (this.currentPlayer === this.aiPlayer) {
                text.textContent = 'AI思考中...';
                text.className = 'ai-thinking';
                label.textContent = 'AI回合：';
            } else {
                text.textContent = this.currentPlayer === 'black' ? '黑棋（玩家）' : '白棋（玩家）';
                text.className = '';
                label.textContent = '你的回合：';
            }
        } else {
            text.textContent = this.currentPlayer === 'black' ? '黑棋' : '白棋';
            text.className = '';
            label.textContent = '当前玩家：';
        }
    }

    // AI下棋逻辑
    async aiMove() {
        this.isAiThinking = true;
        this.updatePlayerIndicator();
        
        // 添加思考延迟，让游戏更自然
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
        
        const move = this.getBestMove();
        if (move) {
            // 直接执行AI落子，避免递归调用makeMove
            this.board[move.row][move.col] = this.currentPlayer;
            this.updateCellDisplay(move.row, move.col, this.currentPlayer);
            
            // 检查胜利
            if (this.checkWin(move.row, move.col)) {
                this.endGame(this.currentPlayer);
            } else {
                // 切换玩家
                this.switchPlayer();
            }
        }
        
        this.isAiThinking = false;
        this.updatePlayerIndicator(); // 更新显示
    }

    // AI策略：使用评分系统找到最佳落子点
    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        
        // 遍历所有空位置
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    // 只考虑有邻居的位置（优化性能）
                    if (this.hasNeighbor(i, j)) {
                        const score = this.evaluatePosition(i, j);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { row: i, col: j };
                        }
                    }
                }
            }
        }
        
        // 如果没有找到有邻居的位置，选择中心点
        if (!bestMove) {
            const center = Math.floor(this.boardSize / 2);
            if (this.board[center][center] === null) {
                bestMove = { row: center, col: center };
            } else {
                // 随机选择一个空位置
                const emptyPositions = [];
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = 0; j < this.boardSize; j++) {
                        if (this.board[i][j] === null) {
                            emptyPositions.push({ row: i, col: j });
                        }
                    }
                }
                if (emptyPositions.length > 0) {
                    bestMove = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
                }
            }
        }
        
        return bestMove;
    }

    // 检查位置是否有相邻的棋子
    hasNeighbor(row, col) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                    if (this.board[nr][nc] !== null) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 评估位置得分
    evaluatePosition(row, col) {
        let score = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (let [dx, dy] of directions) {
            // 评估AI的得分
            score += this.evaluateDirection(row, col, dx, dy, this.aiPlayer) * 1.1;
            // 评估阻挡对手的得分
            score += this.evaluateDirection(row, col, dx, dy, this.getOpponent(this.aiPlayer));
        }
        
        return score;
    }

    // 评估特定方向的得分
    evaluateDirection(row, col, dx, dy, player) {
        let count = 0;
        let blocked = 0;
        
        // 向正方向计算
        let r = row + dx, c = col + dy;
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] === null) {
                break;
            } else {
                blocked++;
                break;
            }
            r += dx; c += dy;
        }
        
        // 向负方向计算
        r = row - dx; c = col - dy;
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] === null) {
                break;
            } else {
                blocked++;
                break;
            }
            r -= dx; c -= dy;
        }
        
        // 根据连子数量和阻挡情况给分
        if (count >= 4) return 10000; // 即将获胜
        if (count >= 3 && blocked === 0) return 1000; // 活四
        if (count >= 3 && blocked === 1) return 100; // 冲四
        if (count >= 2 && blocked === 0) return 100; // 活三
        if (count >= 2 && blocked === 1) return 10; // 眠三
        if (count >= 1 && blocked === 0) return 10; // 活二
        
        return count;
    }

    getOpponent(player) {
        return player === 'black' ? 'white' : 'black';
    }

    setGameMode(mode) {
        this.gameMode = mode;
        this.restart();
        
        // 更新按钮状态
        document.getElementById('pvpBtn').className = mode === 'pvp' ? 'mode-btn active' : 'mode-btn';
        document.getElementById('pveBtn').className = mode === 'pve' ? 'mode-btn active' : 'mode-btn';
    }

    updateCellDisplay(row, col, player = null) {
        const cellIndex = row * this.boardSize + col;
        const cell = document.querySelectorAll('.cell')[cellIndex];
        cell.classList.add('occupied');
        
        const piece = document.createElement('div');
        // 使用传入的player参数，如果没有则使用当前玩家
        const pieceColor = player || this.currentPlayer;
        piece.className = `piece ${pieceColor}`;
        cell.appendChild(piece);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updatePlayerIndicator();
    }

    updatePlayerIndicator() {
        const indicator = document.getElementById('playerIndicator');
        const text = document.getElementById('playerText');
        const label = document.getElementById('playerLabel');
        
        indicator.className = `player-indicator ${this.currentPlayer}`;
        
        if (this.gameMode === 'pve') {
            if (this.currentPlayer === this.aiPlayer) {
                text.textContent = 'AI思考中...';
                text.className = 'ai-thinking';
                label.textContent = 'AI回合：';
            } else {
                text.textContent = this.currentPlayer === 'black' ? '黑棋（玩家）' : '白棋（玩家）';
                text.className = '';
                label.textContent = '你的回合：';
            }
        } else {
            text.textContent = this.currentPlayer === 'black' ? '黑棋' : '白棋';
            text.className = '';
            label.textContent = '当前玩家：';
        }
    }

    checkWin(row, col) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 对角线 \
            [1, -1]   // 对角线 /
        ];

        for (let [dx, dy] of directions) {
            let count = 1; // 当前棋子
            
            // 向正方向检查
            let r = row + dx, c = col + dy;
            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                   this.board[r][c] === this.currentPlayer) {
                count++;
                r += dx;
                c += dy;
            }
            
            // 向负方向检查
            r = row - dx;
            c = col - dy;
            while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                   this.board[r][c] === this.currentPlayer) {
                count++;
                r -= dx;
                c -= dy;
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }

    endGame(winner) {
        this.gameEnded = true;
        
        // 更新游戏时间
        if (!this.isPaused) {
            const now = Date.now();
            this.playTime += (now - this.lastResumeTime);
            this.isPaused = true; // 游戏结束后设置为暂停状态
            console.log('游戏结束，总游玩时间：', Math.floor(this.playTime / 1000 / 60), '分钟');
        }
        
        let winnerText;
        
        if (this.gameMode === 'pve') {
            if (winner === this.aiPlayer) {
                winnerText = 'AI获胜！';
                document.getElementById('winMessage').textContent = '很遗憾，AI获得了胜利！再试一次吧！';
            } else {
                winnerText = '你获胜了！';
                document.getElementById('winMessage').textContent = '恭喜！你战胜了AI！';
            }
        } else {
            winnerText = winner === 'black' ? '黑棋获胜！' : '白棋获胜！';
            document.getElementById('winMessage').textContent = `恭喜${winner === 'black' ? '黑棋' : '白棋'}获得胜利！`;
        }
        
        // 添加游戏已结束的文本
        document.getElementById('winnerText').textContent = `游戏已结束！🎉 ${winnerText}`;
        document.getElementById('winModal').style.display = 'block';
        // 隐藏暂停按钮，显示返回主页按钮
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.style.display = 'none';
        }
        let homeBtn = document.getElementById('homeBtnAfterWin');
        if (!homeBtn) {
            homeBtn = document.createElement('button');
            homeBtn.id = 'homeBtnAfterWin';
            homeBtn.className = 'pause-btn';
            homeBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            homeBtn.style.position = 'fixed';
            homeBtn.style.top = '16px';
            homeBtn.style.right = '16px'; // 靠右显示
            homeBtn.style.transform = 'none'; // 移除居中变换
            homeBtn.style.zIndex = '1200';
            homeBtn.onclick = function() { returnToMenu(); };
            document.body.appendChild(homeBtn);
        } else {
            homeBtn.style.display = '';
        }
    }

    restart() {
        this.gameEnded = false;
        this.currentPlayer = 'black';
        this.isAiThinking = false;
        this.initBoard();
        this.createBoardHTML();
        this.updatePlayerIndicator();
        document.getElementById('winModal').style.display = 'none';
        // 恢复暂停按钮，隐藏返回主页按钮
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.style.display = '';
        const homeBtn = document.getElementById('homeBtnAfterWin');
        if (homeBtn) homeBtn.style.display = 'none';
    }
}

// 全局函数
function restartGame() {
    if (window.game) {
        window.game.restart();
        // 确保重新开始后保持游戏模式设置
        if (window.selectedGameMode) {
            window.game.gameMode = window.selectedGameMode;
            if (window.selectedGameMode === 'pve') {
                window.game.aiPlayer = 'white';
            }
        }
        
        // 重置游戏时间相关属性
        window.game.gameStartTime = Date.now();
        window.game.playTime = 0;
        window.game.lastResumeTime = Date.now();
        window.game.isPaused = false;
    }
}

// 启动页相关
function startGame() {
    // 确保游戏实例存在
    if (!window.game) {
        window.game = new GomokuGame();
    }
    
    // 设置游戏ID和时间相关属性
    window.game.gameId = Date.now().toString();
    window.game.gameStartTime = Date.now();
    window.game.playTime = 0;
    window.game.lastResumeTime = Date.now();
    window.game.isPaused = false;
    
    // 应用之前选择的游戏模式
    if (window.selectedGameMode) {
        window.game.gameMode = window.selectedGameMode;
        if (window.selectedGameMode === 'pve') {
            window.game.aiPlayer = 'white';
        }
        console.log('游戏模式设置为:', window.selectedGameMode);
    }
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('header').style.display = '';
    document.getElementById('gameContainer').style.display = '';
    document.getElementById('pauseBtn').style.display = '';
    document.getElementById('languageFloatBall').style.display = 'none';
    restartGame();
}

// 修改 setGameMode 支持启动页和主界面按钮高亮
function setGameMode(mode, fromStart) {
    // 保存模式到全局变量，供后续使用
    window.selectedGameMode = mode;
    
    if (typeof window.game !== 'undefined') {
        window.game.gameMode = mode;
        if (mode === 'pve') {
            window.game.aiPlayer = 'white';
        }
    }
    
    // 启动页按钮高亮
    if (fromStart) {
        const startPvpBtn = document.getElementById('startPvpBtn');
        const startPveBtn = document.getElementById('startPveBtn');
        if (startPvpBtn && startPveBtn) {
            startPvpBtn.classList.toggle('active', mode === 'pvp');
            startPveBtn.classList.toggle('active', mode === 'pve');
        }
    } else {
        const pvpBtn = document.getElementById('pvpBtn');
        const pveBtn = document.getElementById('pveBtn');
        if (pvpBtn && pveBtn) {
            pvpBtn.classList.toggle('active', mode === 'pvp');
            pveBtn.classList.toggle('active', mode === 'pve');
        }
    }
    
    // 如果已进入主界面，重开一局
    if (!fromStart && typeof restartGame === 'function') {
        restartGame();
    }
}

function closeModal() {
    document.getElementById('winModal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const winModal = document.getElementById('winModal');
    const pauseModal = document.getElementById('pauseModal');
    const loadArchiveModal = document.getElementById('loadArchiveModal');
    const settingsModal = document.getElementById('settingsModal');
    
    if (event.target === winModal) {
        winModal.style.display = 'none';
    }
    if (event.target === pauseModal) {
        pauseModal.style.display = 'none';
    }
    if (event.target === loadArchiveModal) {
        loadArchiveModal.style.display = 'none';
    }
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
}

// 键盘支持
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
        document.getElementById('pauseModal').style.display = 'none';
        document.getElementById('loadArchiveModal').style.display = 'none';
        document.getElementById('settingsModal').style.display = 'none';
        closeStatsModal();
    } else if (event.key === 'r' || event.key === 'R') {
        restartGame();
    }
});

function pauseGame() {
    document.getElementById('pauseModal').style.display = 'block';
    
    // 更新游戏时间
    if (window.game && !window.game.isPaused) {
        const now = Date.now();
        window.game.playTime += (now - window.game.lastResumeTime);
        window.game.isPaused = true;
        console.log('游戏暂停，当前游玩时间：', Math.floor(window.game.playTime / 1000 / 60), '分钟');
    }
}

function continueGame() {
    document.getElementById('pauseModal').style.display = 'none';
    
    // 恢复游戏时间计时
    if (window.game && window.game.isPaused) {
        window.game.lastResumeTime = Date.now();
        window.game.isPaused = false;
        console.log('游戏继续，累计游玩时间：', Math.floor(window.game.playTime / 1000 / 60), '分钟');
    }
}

function returnToMenu() {
    // document.getElementById('languageFloatBall').style.display = '';
    const shouldSave = confirm('是否要保存当前游戏进度？\n\n选择"确定"将保存当前进度并返回主菜单\n选择"取消"将直接返回主菜单（不保存进度）');
    
    if (shouldSave) {
        // 保存当前进度
        saveArchive();
        showArchiveTip('游戏进度已保存！');
        
        // 移除了不需要的提示
    }
    
    // 返回主菜单
    document.getElementById('pauseModal').style.display = 'none';
    document.getElementById('startScreen').style.display = '';
    document.getElementById('header').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    // 主页面暂停按钮应始终隐藏
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.style.display = 'none';
    const homeBtn = document.getElementById('homeBtnAfterWin');
    if (homeBtn) homeBtn.style.display = 'none';
}

function restartFromPause() {
    document.getElementById('pauseModal').style.display = 'none';
    restartGame();
}

// 游戏设置对象
let gameSettings = {
    aiDifficulty: 'easy',
    soundEnabled: true,
    animationEnabled: true,
    theme: 'light',
    boardStyle: 'default'
};

// 从本地存储加载设置
function loadSettings() {
    const savedSettings = localStorage.getItem('gomokuSettings');
    if (savedSettings) {
        try {
            gameSettings = { ...gameSettings, ...JSON.parse(savedSettings) };
        } catch (e) {
            console.error('加载设置失败:', e);
        }
    }
}

// 保存设置到本地存储
function saveSettingsToStorage() {
    try {
        localStorage.setItem('gomokuSettings', JSON.stringify(gameSettings));
    } catch (e) {
        console.error('保存设置失败:', e);
    }
}

// 应用设置到界面
function applySettings() {
    // 应用主题
    if (gameSettings.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    // 应用动画设置
    if (!gameSettings.animationEnabled) {
        document.body.classList.add('no-animation');
    } else {
        document.body.classList.remove('no-animation');
    }
    
    // 应用棋盘风格
    const board = document.querySelector('.board');
    if (board) {
        // 移除所有棋盘风格类
        board.classList.remove('board-wood', 'board-marble', 'board-star', 'board-grass');
        
        // 根据设置添加相应类
        if (gameSettings.boardStyle === 'wood') {
            board.classList.add('board-wood');
        } else if (gameSettings.boardStyle === 'marble') {
            board.classList.add('board-marble');
        } else if (gameSettings.boardStyle === 'star') {
            board.classList.add('board-star');
        } else if (gameSettings.boardStyle === 'grass') {
            board.classList.add('board-grass');
        }
    }
}

// 从开始菜单显示设置
function showSettingsFromStart() {
    loadSettings();
    populateSettingsForm();
    document.getElementById('settingsModal').style.display = 'block';
}

// 从暂停菜单显示设置
function showSettings() {
    loadSettings();
    populateSettingsForm();
    document.getElementById('settingsModal').style.display = 'block';
}

// 为设置模态框添加点击事件处理函数
function initSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.onclick = function(event) {
            if (event.target === settingsModal) {
                closeSettingsModal();
            }
        };
    }
}

// 在页面加载时初始化设置模态框
document.addEventListener('DOMContentLoaded', function() {
    initSettingsModal();
});

// 填充设置表单
function populateSettingsForm() {
    // 设置AI难度
    const aiDifficultyRadios = document.querySelectorAll('input[name="aiDifficulty"]');
    aiDifficultyRadios.forEach(radio => {
        if (radio.value === gameSettings.aiDifficulty) {
            radio.checked = true;
        }
    });
    
    // 设置主题
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        if (radio.value === gameSettings.theme) {
            radio.checked = true;
        }
    });
    
    // 设置棋盘风格
    const boardStyleRadios = document.querySelectorAll('input[name="boardStyle"]');
    boardStyleRadios.forEach(radio => {
        if (radio.value === gameSettings.boardStyle) {
            radio.checked = true;
        }
    });
    
    // 设置复选框
    document.getElementById('soundEnabled').checked = gameSettings.soundEnabled;
    document.getElementById('animationEnabled').checked = gameSettings.animationEnabled;
}

// 保存设置
function saveSettings() {
    // 获取AI难度
    const aiDifficultyRadio = document.querySelector('input[name="aiDifficulty"]:checked');
    if (aiDifficultyRadio) {
        gameSettings.aiDifficulty = aiDifficultyRadio.value;
    }
    
    // 获取主题
    const themeRadio = document.querySelector('input[name="theme"]:checked');
    if (themeRadio) {
        gameSettings.theme = themeRadio.value;
    }
    
    // 获取棋盘风格
    const boardStyleRadio = document.querySelector('input[name="boardStyle"]:checked');
    if (boardStyleRadio) {
        gameSettings.boardStyle = boardStyleRadio.value;
    }
    
    // 获取复选框设置
    gameSettings.soundEnabled = document.getElementById('soundEnabled').checked;
    gameSettings.animationEnabled = document.getElementById('animationEnabled').checked;
    
    // 保存到本地存储
    saveSettingsToStorage();
    
    // 应用设置
    applySettings();
    
    // 关闭设置弹窗
    closeSettingsModal();
    
    // 显示保存成功提示
    showSettingsSavedTip();
}

// 关闭设置弹窗
function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

// 显示设置保存成功提示
function showSettingsSavedTip() {
    // 创建提示元素
    const tip = document.createElement('div');
    tip.className = 'settings-saved-tip';
    tip.textContent = '设置已保存';
    tip.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1em;
        font-weight: 600;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
    `;
    
    document.body.appendChild(tip);
    
    // 2秒后移除提示
    setTimeout(() => {
        if (tip.parentNode) {
            tip.parentNode.removeChild(tip);
        }
    }, 2000);
}

// 修改closeModal支持暂停菜单
const oldCloseModal = window.closeModal;
window.closeModal = function() {
    if (typeof oldCloseModal === 'function') oldCloseModal();
    document.getElementById('pauseModal').style.display = 'none';
};

function returnToHomeFromWin() {
    document.getElementById('winModal').style.display = 'none';
    document.getElementById('startScreen').style.display = '';
    document.getElementById('header').style.display = 'none';
    // 隐藏用户浮球
    document.getElementById('userFloatBall').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'none';
}

function restartFromWin() {
    document.getElementById('winModal').style.display = 'none';
    restartGame();
}

function showStatsFromWin() {
    document.getElementById('winModal').style.display = 'none';
    showStatsModal();
}

function showStatsModal() {
    const archives = getArchives();
    const stats = calculateStats(archives);
    
    // 创建战绩弹窗
    const statsModal = document.createElement('div');
    statsModal.className = 'modal';
    statsModal.id = 'statsModal';
    statsModal.style.display = 'block';
    
    statsModal.innerHTML = `
        <div class="modal-content stats-modal">
            <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:8px;display:inline-block;vertical-align:middle;">
                    <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 9L12 6L15 9L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                游戏战绩
            </h2>
            <div class="stats-content">
                <div class="stats-item">
                    <div class="stats-label">总游戏次数</div>
                    <div class="stats-value">${stats.totalGames}</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">获胜次数</div>
                    <div class="stats-value">${stats.wins}</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">胜率</div>
                    <div class="stats-value">${stats.winRate}%</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">总游戏时长</div>
                    <div class="stats-value">${stats.totalTime}</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">平均游戏时长</div>
                    <div class="stats-value">${stats.avgTime}</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">最高得分</div>
                    <div class="stats-value">${stats.highestScore}</div>
                </div>
            </div>
            <div class="stats-actions">
                <button class="modal-btn" onclick="closeStatsModal()">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:8px;">
                        <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    关闭
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(statsModal);
    
    // 点击外部关闭
    statsModal.onclick = function(event) {
        if (event.target === statsModal) {
            closeStatsModal();
        }
    };
}

function closeStatsModal() {
    const statsModal = document.getElementById('statsModal');
    if (statsModal) {
        statsModal.remove();
    }
}

function calculateStats(archives) {
    if (archives.length === 0) {
        return {
            totalGames: 0,
            wins: 0,
            winRate: 0,
            totalTime: '0分钟',
            avgTime: '0分钟',
            highestScore: 0
        };
    }
    
    let totalGames = archives.length;
    let wins = 0;
    let totalTime = 0;
    let highestScore = 0;
    
    archives.forEach(archive => {
        if (archive.gameEnded) {
            wins++;
        }
        
        // 使用存档中的playTime（累计游玩时间）
        if (archive.playTime) {
            totalTime += Math.floor(archive.playTime / 1000 / 60);
        } else if (archive.gameStartTime && archive.saveTime) {
            // 兼容旧存档
            totalTime += Math.floor((archive.saveTime - archive.gameStartTime) / 1000 / 60);
        }
        
        const score = calculateScore(archive.board);
        if (score > highestScore) {
            highestScore = score;
        }
    });
    
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const avgTime = totalGames > 0 ? Math.round(totalTime / totalGames) : 0;
    
    return {
        totalGames,
        wins,
        winRate,
        totalTime: `${totalTime}分钟`,
        avgTime: `${avgTime}分钟`,
        highestScore
    };
}

// 页面加载时只显示启动页
window.onload = function() {
    // 检查本地存储是否有用户信息
    const userInfo = JSON.parse(localStorage.getItem('gomoku-user-info') || 'null');
    const userInfoModal = document.getElementById('userInfoModal');
    const userFloatBall = document.getElementById('userFloatBall');
    if (!userInfo) {
        userInfoModal.style.display = 'flex';
        document.getElementById('userInfoConfirmBtn').onclick = function() {
            const nickname = document.getElementById('userNicknameInput').value.trim() || '玩家';
            const avatarRadio = document.querySelector('input[name="avatar"]:checked');
            let avatarEmoji = '🐱';
            switch (avatarRadio ? avatarRadio.value : 'cat') {
                case 'cat': avatarEmoji = '🐱'; break;
                case 'dog': avatarEmoji = '🐶'; break;
                case 'bear': avatarEmoji = '🐻'; break;
                case 'rabbit': avatarEmoji = '🐰'; break;
                default: avatarEmoji = '🐱';
            }
            localStorage.setItem('gomoku-user-info', JSON.stringify({ nickname, avatarEmoji }));
            showUserFloatBall(nickname, avatarEmoji);
            userInfoModal.style.display = 'none';
        };
    } else {
        userInfoModal.style.display = 'none';
        showUserFloatBall(userInfo.nickname, userInfo.avatarEmoji);
    }
    // 其余初始化逻辑
    window.selectedGameMode = 'pvp';
    document.getElementById('startScreen').style.display = '';
    document.getElementById('header').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'none';
    // 浮球在主页面左侧
    document.getElementById('userFloatBall').classList.remove('right');
};

function showUserFloatBall(nickname, avatarEmoji) {
    const userFloatBall = document.getElementById('userFloatBall');
    const userAvatarBall = document.getElementById('userAvatarBall');
    const userNameBall = document.getElementById('userNameBall');
    userAvatarBall.textContent = avatarEmoji;
    userNameBall.textContent = nickname;
    userFloatBall.style.display = 'flex';
    
    // 添加点击事件监听器
    userFloatBall.onclick = function() {
        showStatsModal();
    };
}

// 进入游戏时浮球切到右侧
const originalStartGame = startGame;
startGame = function() {
    document.getElementById('userFloatBall').classList.add('right');
    originalStartGame();
};
// 返回主菜单时浮球切回左侧
const originalReturnToMenu = returnToMenu;
returnToMenu = function() {
    originalReturnToMenu();
    document.getElementById('userFloatBall').classList.remove('right');
};

// 多存档支持
const ARCHIVE_KEY = 'gomoku-archives';
const MAX_ARCHIVES = 10; // 最多保存10个存档

function getArchives() {
    try {
        const data = localStorage.getItem(ARCHIVE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('获取存档列表失败:', error);
        return [];
    }
}

function setArchives(archives) {
    try {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives));
    } catch (error) {
        console.error('保存存档列表失败:', error);
    }
}

// 存档功能
function saveArchive() {
    if (!window.game) {
        console.log('游戏实例不存在，无法保存存档');
        return;
    }
    try {
        const archives = getArchives();
        const gameId = window.game.gameId || Date.now().toString();
        
        // 如果没有游戏ID，创建一个
        if (!window.game.gameId) {
            window.game.gameId = gameId;
        }
        
        // 如果游戏没有暂停，需要更新游戏时间
        if (!window.game.isPaused) {
            const now = Date.now();
            window.game.playTime += (now - window.game.lastResumeTime);
            window.game.lastResumeTime = now;
        }
        
        const archive = {
            gameId: gameId,
            board: window.game.board,
            currentPlayer: window.game.currentPlayer,
            gameMode: window.game.gameMode,
            aiPlayer: window.game.aiPlayer,
            gameEnded: window.game.gameEnded,
            saveTime: Date.now(),
            gameStartTime: window.game.gameStartTime || Date.now(),
            playTime: window.game.playTime || 0 // 保存累计游玩时间
        };
        
        // 检查是否已存在相同游戏ID的存档
        const existingIndex = archives.findIndex(a => a.gameId === gameId);
        if (existingIndex !== -1) {
            // 更新现有存档
            archives[existingIndex] = archive;
        } else {
            // 添加新存档
            archives.unshift(archive); // 新存档放在最前面
        }
        
        // 限制存档数量
        if (archives.length > MAX_ARCHIVES) {
            archives.splice(MAX_ARCHIVES);
        }
        
        setArchives(archives);
        showArchiveTip('已保存存档！');
    } catch (error) {
        console.error('保存存档失败:', error);
        showArchiveTip('保存失败，请重试');
    }
}

function loadArchive() {
    showLoadArchiveModal();
}

function showLoadArchiveModal() {
    updateArchiveList();
    document.getElementById('loadArchiveModal').style.display = 'block';
}

function closeLoadArchiveModal() {
    document.getElementById('loadArchiveModal').style.display = 'none';
}

function closeGameRecordsModal() {
    document.getElementById('loadArchiveModal').style.display = 'none';
}

function updateArchiveList() {
    const archiveList = document.getElementById('archive-list');
    const archives = getArchives();
    
    if (archives.length === 0) {
        archiveList.innerHTML = '<div class="archive-item empty"><div class="archive-info"><div class="archive-title">暂无存档</div><div class="archive-date">没有可用的存档文件</div></div></div>';
        return;
    }
    
    let html = '';
    archives.forEach((archive, index) => {
        try {
            const saveDate = new Date(archive.saveTime);
            const score = calculateScore(archive.board);
            const gameModeText = archive.gameMode === 'pve' ? '人机对战' : '双人对战';
            // 使用实际游玩时间而不是从开始到保存的时间差
            const gameDuration = Math.floor((archive.playTime || 0) / 1000 / 60); // 游戏时长（分钟）
            
            html += `
                <div class="archive-item" onclick="loadArchiveFromModal(${index})">
                    <div class="archive-info">
                        <div class="archive-title">游戏 ${index + 1}</div>
                        <div class="archive-date">${saveDate.toLocaleString('zh-CN')}</div>
                        <div class="archive-mode">${gameModeText} · ${gameDuration}分钟</div>
                    </div>
                    <div class="archive-score">得分: ${score}</div>
                    <button class="archive-delete-btn" onclick="event.stopPropagation(); deleteArchive(${index})" title="删除存档">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4H14M6 4V2.5C6 2.22386 6.22386 2 6.5 2H9.5C9.77614 2 10 2.22386 10 2.5V4M11.5 4V13.5C11.5 13.7761 11.2761 14 11 14H5C4.72386 14 4.5 13.7761 4.5 13.5V4H11.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
        } catch (error) {
            console.error('解析存档失败:', error);
        }
    });
    
    archiveList.innerHTML = html;
}

function loadArchiveFromModal(index) {
    try {
        const archives = getArchives();
        if (index < 0 || index >= archives.length) {
            showArchiveTip('存档索引无效');
            return;
        }
        
        const archive = archives[index];
        
        // 验证存档数据完整性
        if (!archive.board || !archive.currentPlayer || !archive.gameMode) {
            showArchiveTip('存档数据不完整');
            return;
        }
        
        // 确保游戏实例存在
        if (!window.game) {
            window.game = new GomokuGame();
        }
        
        // 恢复游戏状态
        window.game.gameId = archive.gameId;
        window.game.board = archive.board;
        window.game.currentPlayer = archive.currentPlayer;
        window.game.gameMode = archive.gameMode;
        window.game.aiPlayer = archive.aiPlayer || 'white';
        window.game.gameEnded = archive.gameEnded || false;
        window.game.gameStartTime = archive.gameStartTime;
        window.game.playTime = archive.playTime || 0; // 恢复累计游玩时间
        window.game.lastResumeTime = Date.now(); // 设置恢复时间
        window.game.isPaused = false; // 恢复后游戏不是暂停状态
        
        // 保存模式到全局变量
        window.selectedGameMode = archive.gameMode;
        
        // 更新界面
        window.game.createBoardHTML();
        
        // 恢复棋盘显示 - 显示所有已落子的棋子
        for (let i = 0; i < window.game.boardSize; i++) {
            for (let j = 0; j < window.game.board[i].length; j++) {
                if (window.game.board[i][j] !== null) {
                    window.game.updateCellDisplay(i, j, window.game.board[i][j]);
                }
            }
        }
        
        window.game.updatePlayerIndicator();
        
        // 显示游戏界面和暂停按钮
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('header').style.display = '';
        document.getElementById('gameContainer').style.display = '';
        document.getElementById('pauseBtn').style.display = '';
        
        // 将用户浮球移到右侧
        document.getElementById('userFloatBall').classList.add('right');
        
        // 关闭弹窗
        closeLoadArchiveModal();
        
        showArchiveTip('存档已读取，游戏已恢复');
    } catch (error) {
        console.error('读取存档失败:', error);
        showArchiveTip('读取存档失败，请重试');
    }
}

function deleteArchive(index) {
    if (confirm('确定要删除这个存档吗？')) {
        try {
            const archives = getArchives();
            if (index >= 0 && index < archives.length) {
                archives.splice(index, 1);
                setArchives(archives);
                updateArchiveList();
                showArchiveTip('存档已删除');
            }
        } catch (error) {
            console.error('删除存档失败:', error);
            showArchiveTip('删除失败，请重试');
        }
    }
}

function calculateScore(board) {
    // 简单的得分计算：已落子数量
    let score = 0;
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] !== null) {
                score++;
            }
        }
    }
    return score;
}

function clearArchive() {
    if (confirm('确定要清除所有存档和用户信息吗？此操作不可恢复！')) {
        try {
            setArchives([]);
            localStorage.removeItem('gomoku-user-info');
            showArchiveTip('所有存档和用户信息已清除');
            updateArchiveList();
            setTimeout(() => { location.reload(); }, 800);
        } catch (error) {
            console.error('清除存档失败:', error);
            showArchiveTip('清除失败，请重试');
        }
    }
}

function showArchiveTip(msg) {
    const tip = document.getElementById('archiveTip');
    if (tip) {
        tip.textContent = msg;
        tip.classList.add('show');
        setTimeout(() => {
            tip.classList.remove('show');
            tip.textContent = '';
        }, 2000);
    }
    // 同时在控制台显示，确保在游戏界面也能看到提示
    console.log('存档提示:', msg);
}

function showGameRecords() {
    const archives = getArchives();
    const gameRecords = archives.filter(archive => archive.gameEnded);
    
    if (gameRecords.length === 0) {
        document.getElementById('archive-list').innerHTML = '<div class="archive-item empty"><div class="archive-info"><div class="archive-title">暂无游戏记录</div><div class="archive-date">没有完成的游戏记录</div></div></div>';
        document.getElementById('loadArchiveModal').style.display = 'block';
        return;
    }
    
    let html = '';
    gameRecords.forEach((record, index) => {
        try {
            const saveDate = new Date(record.saveTime);
            const score = calculateScore(record.board);
            const gameModeText = record.gameMode === 'pve' ? '人机对战' : '双人对战';
            // 使用实际游玩时间而不是从开始到保存的时间差
            const gameDuration = Math.floor((record.playTime || 0) / 1000 / 60); // 游戏时长（分钟）
            const resultText = record.winner ? (record.winner === 'black' ? '黑棋胜利' : '白棋胜利') : '游戏失败';
            
            html += `
                <div class="archive-item" style="cursor: default;">
                    <div class="archive-info">
                        <div class="archive-title">${resultText}</div>
                        <div class="archive-date">${saveDate.toLocaleString('zh-CN')}</div>
                        <div class="archive-mode">${gameModeText} · ${gameDuration}分钟</div>
                    </div>
                    <div class="archive-score">得分: ${score}</div>
                </div>
            `;
        } catch (error) {
            console.error('解析游戏记录失败:', error);
        }
    });
    
    document.getElementById('archive-list').innerHTML = html;
    document.getElementById('loadArchiveModal').style.display = 'block';
}

// 添加手动保存功能
function manualSave() {
    saveArchive();
    showArchiveTip('游戏已手动保存');
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载并应用设置
    loadSettings();
    applySettings();
    
    // 默认设置为双人对战模式
    setGameMode('pvp', true);
    
    console.log('五子棋游戏已初始化，设置已加载');
});