// 日期推算卡片逻辑
(function() {
    function createDateCalcCard(panel) {
        // 卡片HTML结构
        const card = document.createElement('div');
        card.className = 'date-calc-card';
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:24px;">📅</span>
                    <h4 style="margin:0;">日期推算卡片</h4>
                </div>
                <button id="date-calc-close-btn" style="background:none;border:none;font-size:22px;line-height:1;cursor:pointer;color:#888;padding:0 4px;">×</button>
            </div>
            <div class="form-group">
                <label>起始日期</label>
                <input type="date" id="calc-base-date">
            </div>
            <div class="form-group">
                <label>加/减天数</label>
                <input type="number" id="calc-days" placeholder="输入正数为加，负数为减">
            </div>
            <div class="actions">
                <button id="calc-date-btn">推算日期</button>
            </div>
            <div class="form-group">
                <label>日期间隔计算</label>
                <input type="date" id="calc-date1"> ~ <input type="date" id="calc-date2">
                <button id="calc-diff-btn" style="margin-left:10px;">计算天数</button>
            </div>
            <div class="result" id="date-calc-result"></div>
        `;
        // 关闭按钮事件
        card.querySelector('#date-calc-close-btn').onclick = function(e) {
            e.stopPropagation();
            if (panel) panel.remove();
        };
        return card;
    }

    function showDateCalcCard() {
        // 检查是否已存在
        if (document.getElementById('date-calc-card-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'date-calc-card-panel';
        panel.style.position = 'fixed';
        panel.style.left = '0';
        panel.style.top = '0';
        panel.style.width = '100vw';
        panel.style.height = '100vh';
        panel.style.background = 'rgba(0,0,0,0.18)';
        panel.style.zIndex = '9999';
        panel.style.display = 'flex';
        panel.style.alignItems = 'center';
        panel.style.justifyContent = 'center';
        panel.appendChild(createDateCalcCard(panel));
        document.body.appendChild(panel);
        // 点击遮罩关闭
        panel.addEventListener('click', function(e) {
            if (e.target === panel) panel.remove();
        });
        // 推算日期
        panel.querySelector('#calc-date-btn').onclick = function() {
            const base = panel.querySelector('#calc-base-date').value;
            const days = parseInt(panel.querySelector('#calc-days').value, 10);
            if (!base || isNaN(days)) {
                panel.querySelector('#date-calc-result').textContent = '请填写完整信息';
                return;
            }
            const baseDate = new Date(base);
            baseDate.setDate(baseDate.getDate() + days);
            panel.querySelector('#date-calc-result').textContent = `推算结果：${baseDate.toISOString().slice(0,10)}`;
        };
        // 计算天数
        panel.querySelector('#calc-diff-btn').onclick = function() {
            const d1 = panel.querySelector('#calc-date1').value;
            const d2 = panel.querySelector('#calc-date2').value;
            if (!d1 || !d2) {
                panel.querySelector('#date-calc-result').textContent = '请填写两个日期';
                return;
            }
            const date1 = new Date(d1);
            const date2 = new Date(d2);
            const diff = Math.abs(date2 - date1);
            const days = Math.floor(diff / (1000*60*60*24));
            panel.querySelector('#date-calc-result').textContent = `间隔天数：${days} 天`;
        };
    }

    // 入口按钮事件
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.getElementById('date-calc-card-btn');
        if (btn) {
            btn.addEventListener('click', showDateCalcCard);
        }
    });
})(); 