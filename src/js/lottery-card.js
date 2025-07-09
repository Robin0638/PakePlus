// 自定义抽奖卡片逻辑
(function() {
    // 统计对象，存储每个奖项的抽中次数
    let lotteryStats = {};

    function createLotteryCard(panel) {
        const card = document.createElement('div');
        card.className = 'lottery-card';
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:24px;">🎲</span>
                    <h4 style="margin:0;">自定义抽奖卡片</h4>
                </div>
                <button id="lottery-close-btn" title="关闭">×</button>
            </div>
            <div class="form-group" style="position:relative;">
                <label>奖项内容（每行一个）</label>
                <textarea id="lottery-items" placeholder="如：一等奖\n二等奖\n三等奖" style="padding-right:70px;"></textarea>
                <button id="lottery-clear-btn" style="position:absolute;right:6px;top:28px;background:#e53935;color:#fff;border:none;border-radius:5px;padding:2px 10px;font-size:13px;cursor:pointer;">清除</button>
            </div>
            <div class="form-group">
                <label>抽取奖项个数</label>
                <input type="number" id="lottery-count" min="1" max="20" value="1">
            </div>
            <div class="actions">
                <button id="lottery-draw-btn">开始抽奖</button>
                <button id="lottery-share-btn" style="background:#4caf50;display:none;">分享结果</button>
            </div>
            <div style="display:flex;justify-content:center;margin:18px 0;">
                <canvas id="lottery-wheel" width="260" height="260" style="display:none;"></canvas>
            </div>
            <div class="result" id="lottery-result"></div>
            <div class="result" id="lottery-stats" style="font-size:14px;color:#888;margin-top:8px;"></div>
        `;
        // 关闭按钮
        card.querySelector('#lottery-close-btn').onclick = function(e) {
            e.stopPropagation();
            if (panel) panel.remove();
        };
        // 清除按钮
        card.querySelector('#lottery-clear-btn').onclick = function(e) {
            e.stopPropagation();
            card.querySelector('#lottery-items').value = '';
            localStorage.removeItem('lottery_items');
        };
        return card;
    }

    function drawWheel(canvas, items, highlightIndex = -1) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const cx = w/2, cy = h/2, r = Math.min(w, h)/2 - 10;
        const n = items.length;
        const colors = ["#FFD54F", "#FF9800", "#FFB300", "#F57C00", "#FFE082", "#FFCC80", "#FF7043", "#FFA726"];
        for(let i=0;i<n;i++){
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, (2*Math.PI/n)*i, (2*Math.PI/n)*(i+1));
            ctx.closePath();
            ctx.fillStyle = colors[i%colors.length];
            ctx.fill();
            if(i===highlightIndex){
                ctx.save();
                ctx.globalAlpha = 0.38;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r, (2*Math.PI/n)*i, (2*Math.PI/n)*(i+1));
                ctx.closePath();
                ctx.fillStyle = '#e53935';
                ctx.fill();
                ctx.restore();
            }
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((2*Math.PI/n)*(i+0.5));
            ctx.textAlign = 'right';
            ctx.font = (i===highlightIndex ? 'bold 18px sans-serif' : '16px sans-serif');
            ctx.fillStyle = (i===highlightIndex ? '#e53935' : '#333');
            ctx.fillText(items[i], r-18, 6);
            ctx.restore();
        }
        // 画指针
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0);
        ctx.beginPath();
        ctx.moveTo(0, -r+8);
        ctx.lineTo(0, -r-18);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#e53935';
        ctx.stroke();
        ctx.restore();
        // 画中心圆
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, 2*Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#ff9800';
        ctx.textAlign = 'center';
        ctx.fillText('抽奖', cx, cy+7);
    }

    function spinWheel(canvas, items, resultIndex, cb) {
        let n = items.length;
        let anglePer = 2*Math.PI/n;
        let current = 0;
        let totalRounds = 6 + Math.random()*2;
        let targetAngle = (3*Math.PI/2) - (resultIndex+0.5)*anglePer;
        let totalAngle = totalRounds*2*Math.PI + targetAngle;
        let start = null;
        function animate(ts){
            if(!start) start = ts;
            let elapsed = ts - start;
            let duration = 2200 + Math.random()*400;
            let progress = Math.min(elapsed/duration, 1);
            let ease = 1-Math.pow(1-progress,3);
            let angle = ease*totalAngle;
            canvas.style.display = '';
            let ctx = canvas.getContext('2d');
            ctx.save();
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate(angle);
            ctx.translate(-canvas.width/2, -canvas.height/2);
            drawWheel(canvas, items, progress===1 ? resultIndex : -1);
            ctx.restore();
            if(progress<1){
                requestAnimationFrame(animate);
            }else{
                setTimeout(()=>cb && cb(), 400);
            }
        }
        requestAnimationFrame(animate);
    }

    function showLotteryCard() {
        if (document.getElementById('lottery-card-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'lottery-card-panel';
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
        panel.appendChild(createLotteryCard(panel));
        document.body.appendChild(panel);
        // 自动填充奖项内容
        const itemsTextarea = panel.querySelector('#lottery-items');
        const saved = localStorage.getItem('lottery_items');
        if(saved) itemsTextarea.value = saved;
        // 输入时自动保存
        itemsTextarea.addEventListener('input', function(){
            localStorage.setItem('lottery_items', this.value);
        });
        // 点击遮罩关闭
        panel.addEventListener('click', function(e) {
            if (e.target === panel) panel.remove();
        });
        // 抽奖逻辑
        panel.querySelector('#lottery-draw-btn').onclick = function() {
            const itemsText = panel.querySelector('#lottery-items').value.trim();
            const count = parseInt(panel.querySelector('#lottery-count').value, 10);
            const canvas = panel.querySelector('#lottery-wheel');
            const shareBtn = panel.querySelector('#lottery-share-btn');
            if (!itemsText) {
                panel.querySelector('#lottery-result').textContent = '请填写奖项内容';
                canvas.style.display = 'none';
                shareBtn.style.display = 'none';
                return;
            }
            let items = itemsText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            if (items.length === 0) {
                panel.querySelector('#lottery-result').textContent = '请填写有效奖项';
                canvas.style.display = 'none';
                shareBtn.style.display = 'none';
                return;
            }
            if (count < 1 || count > items.length) {
                panel.querySelector('#lottery-result').textContent = '抽取个数需在1~奖项总数之间';
                canvas.style.display = 'none';
                shareBtn.style.display = 'none';
                return;
            }
            // 随机抽取
            let pool = [...items];
            let result = [];
            let resultIndexes = [];
            for (let i = 0; i < count; i++) {
                let idx = Math.floor(Math.random() * pool.length);
                result.push(pool[idx]);
                resultIndexes.push(items.indexOf(pool[idx]));
                pool.splice(idx, 1);
            }
            // 统计
            result.forEach(r => {
                if (!lotteryStats[r]) lotteryStats[r] = 0;
                lotteryStats[r]++;
            });
            // 展示统计
            let statsHtml = '<b>抽奖统计：</b><br>' + items.map(it => `${it}：${lotteryStats[it]||0} 次`).join(' &nbsp; ');
            panel.querySelector('#lottery-stats').innerHTML = statsHtml;
            // 转盘动画
            canvas.style.display = '';
            drawWheel(canvas, items);
            let showIndex = resultIndexes[0];
            spinWheel(canvas, items, showIndex, function(){
                panel.querySelector('#lottery-result').innerHTML = `<span style='font-size:22px;'>🎉</span> 抽中：<br>${result.map(r => `<span style='display:inline-block;margin:4px 0;'>${r}</span>`).join('<br>')}`;
                shareBtn.style.display = '';
                // 记录本次结果，供分享
                shareBtn.dataset.share = `本次抽奖结果：\n${result.join(', ')}\n\n全部统计：\n${items.map(it => `${it}：${lotteryStats[it]||0}次`).join('，')}`;
            });
        };
        // 分享/复制按钮逻辑
        panel.querySelector('#lottery-share-btn').onclick = function() {
            const text = this.dataset.share || '';
            if (!text) return;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.textContent = '已复制！';
                    setTimeout(()=>{this.textContent='分享结果';}, 1200);
                });
            } else {
                // 兼容性降级
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                this.textContent = '已复制！';
                setTimeout(()=>{this.textContent='分享结果';}, 1200);
            }
        };
    }

    // 入口按钮事件
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.getElementById('lottery-card-btn');
        if (btn) {
            btn.addEventListener('click', showLotteryCard);
        }
    });
})(); 