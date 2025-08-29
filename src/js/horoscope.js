// 星座运势API相关
const HOROSCOPE_API = 'https://v2.xxapi.cn/api/horoscope';
const HOROSCOPE_SIGNS = [
  { name: '白羊座', type: 'aries', icon: '♈' },
  { name: '金牛座', type: 'taurus', icon: '♉' },
  { name: '双子座', type: 'gemini', icon: '♊' },
  { name: '巨蟹座', type: 'cancer', icon: '♋' },
  { name: '狮子座', type: 'leo', icon: '♌' },
  { name: '处女座', type: 'virgo', icon: '♍' },
  { name: '天秤座', type: 'libra', icon: '♎' },
  { name: '天蝎座', type: 'scorpio', icon: '♏' },
  { name: '射手座', type: 'sagittarius', icon: '♐' },
  { name: '摩羯座', type: 'capricorn', icon: '♑' },
  { name: '水瓶座', type: 'aquarius', icon: '♒' },
  { name: '双鱼座', type: 'pisces', icon: '♓' }
];

function createHoroscopeSelector(container, onSelect) {
  const select = document.createElement('select');
  select.className = 'horoscope-sign-select';
  HOROSCOPE_SIGNS.forEach(sign => {
    const option = document.createElement('option');
    option.value = sign.type;
    option.textContent = `${sign.icon} ${sign.name}`;
    select.appendChild(option);
  });
  select.addEventListener('change', () => onSelect(select.value));
  container.appendChild(select);
  return select;
}

function getTodayDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderHoroscopeCard(container, data) {
  container.innerHTML = '';
  if (!data || !data.data) {
    container.innerHTML = '<div class="horoscope-card">未获取到运势数据</div>';
    return;
  }
  const d = data.data;
  const sign = HOROSCOPE_SIGNS.find(s => s.type === d.name) || {};
  const icon = sign.icon || '';
  const todayStr = getTodayDateStr();
  const card = document.createElement('div');
  card.className = 'horoscope-card';
  card.innerHTML = `
    <div class="horoscope-title"><span class="horoscope-icon">${icon}</span>${d.title || ''} <span class="horoscope-date">${todayStr} 今日运势</span></div>
    <div class="horoscope-section">
      <div class="horoscope-section-title">综合指数 <span class="horoscope-index">${d.index?.all || ''}</span></div>
      <div class="horoscope-bar"><div class="horoscope-bar-inner" style="width:${parseInt(d.index?.all)||0}%"></div></div>
    </div>
    <div class="horoscope-section">
      <div class="horoscope-section-title">健康 <span class="horoscope-index">${d.index?.health || ''}</span></div>
      <div class="horoscope-bar"><div class="horoscope-bar-inner" style="width:${parseInt(d.index?.health)||0}%"></div></div>
    </div>
    <div class="horoscope-section">
      <div class="horoscope-section-title">爱情 <span class="horoscope-index">${d.index?.love || ''}</span></div>
      <div class="horoscope-bar"><div class="horoscope-bar-inner" style="width:${parseInt(d.index?.love)||0}%"></div></div>
    </div>
    <div class="horoscope-section">
      <div class="horoscope-section-title">财运 <span class="horoscope-index">${d.index?.money || ''}</span></div>
      <div class="horoscope-bar"><div class="horoscope-bar-inner" style="width:${parseInt(d.index?.money)||0}%"></div></div>
    </div>
    <div class="horoscope-section">
      <div class="horoscope-section-title">工作 <span class="horoscope-index">${d.index?.work || ''}</span></div>
      <div class="horoscope-bar"><div class="horoscope-bar-inner" style="width:${parseInt(d.index?.work)||0}%"></div></div>
    </div>
    <div class="horoscope-lucky">
      <div>幸运颜色：<span>${d.luckynumber || '-'}</span></div>
      <div>幸运星座：<span>${d.luckyconstellation || '-'}</span></div>
    </div>
    <div class="horoscope-todo">
      <div>宜：${d.todo?.yi || '-'}</div>
      <div>忌：${d.todo?.ji || '-'}</div>
    </div>
    <div style="text-align:right;margin-top:10px;">
      <button class="horoscope-detail-btn">查看详情</button>
    </div>
    <div class="horoscope-footer">数据来源：xxapi.cn</div>
  `;
  container.appendChild(card);

  // 详情弹窗
  const detailBtn = card.querySelector('.horoscope-detail-btn');
  detailBtn.addEventListener('click', function() {
    showHoroscopeDetailModal(d, icon, todayStr);
  });
}

function showHoroscopeDetailModal(d, icon, todayStr) {
  let modal = document.getElementById('horoscope-detail-modal');
  // 图标映射
  const icons = {
    all: '🌟',
    health: '💪',
    love: '💖',
    money: '💰',
    work: '💼'
  };
  // 详情文本拼接（用于Copy）
  function getDetailText() {
    return [
      `${d.title || ''} ${todayStr} 今日运势`,
      `本日需注意：${d.shortcomment || ''}`,
      `综合运势：${d.fortunetext?.all || ''}`,
      `健康：${d.fortunetext?.health || ''}`,
      `爱情：${d.fortunetext?.love || ''}`,
      `财运：${d.fortunetext?.money || ''}`,
      `工作：${d.fortunetext?.work || ''}`,
      `幸运数字：${d.luckynumber || '-'}`,
      `幸运星座：${d.luckyconstellation || '-'}`,
      `宜：${d.todo?.yi || '-'}`,
      `忌：${d.todo?.ji || '-'}`
    ].join('\n');
  }
  // 检测深色模式
  const isDark = document.body.classList.contains('dark-theme');
  // 颜色方案
  const bg = isDark ? 'linear-gradient(135deg,#23243a 60%,#3a2c4f 100%)' : 'linear-gradient(135deg,#f8fafc 60%,#ffe0f7 100%)';
  const headerBg = isDark ? 'linear-gradient(90deg,#3a2c4f 0%,#23243a 100%)' : 'linear-gradient(90deg,#fbc2eb 0%,#a6c1ee 100%)';
  const textColor = isDark ? '#f3eaff' : '#444';
  const subText = isDark ? '#bdb6d6' : '#888';
  const card1 = isDark ? 'linear-gradient(90deg,#5f4b8b 0%,#23243a 100%)' : 'linear-gradient(90deg,#fbc2eb 0%,#a6c1ee 100%)';
  const card2 = isDark ? 'linear-gradient(90deg,#23243a 0%,#5f4b8b 100%)' : 'linear-gradient(90deg,#a1c4fd 0%,#c2e9fb 100%)';
  const card3 = isDark ? 'linear-gradient(90deg,#b06ab3 0%,#4568dc 100%)' : 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)';
  const card4 = isDark ? 'linear-gradient(90deg,#ff5858 0%,#f857a6 100%)' : 'linear-gradient(90deg,#f857a6 0%,#ff5858 100%)';
  const barAll = isDark ? 'linear-gradient(90deg,#a770ef,#f6d365)' : 'linear-gradient(90deg,#fbc2eb,#a6c1ee)';
  const barHealth = isDark ? 'linear-gradient(90deg,#43cea2,#185a9d)' : 'linear-gradient(90deg,#a8edea,#fed6e3)';
  const barLove = isDark ? 'linear-gradient(90deg,#ff6a88,#ff99ac)' : 'linear-gradient(90deg,#fcb69f,#ffecd2)';
  const barMoney = isDark ? 'linear-gradient(90deg,#ffd452,#544a7d)' : 'linear-gradient(90deg,#f7971e,#ffd200)';
  const barWork = isDark ? 'linear-gradient(90deg,#23243a,#43cea2)' : 'linear-gradient(90deg,#43cea2,#185a9d)';
  const btnBg = isDark ? 'linear-gradient(90deg,#5f4b8b 0%,#23243a 100%)' : 'linear-gradient(90deg,#fbc2eb 0%,#a6c1ee 100%)';
  const btnColor = isDark ? '#ffe0f7' : '#d72660';
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'horoscope-detail-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-content horoscope-detail-modal-content" style="max-width:440px;background:${bg};border-radius:18px;box-shadow:0 8px 32px #0003;padding:0;overflow:hidden;">
      <div class="modal-header" style="background:${headerBg};padding:18px 24px 12px 24px;border-radius:18px 18px 0 0;display:flex;align-items:center;gap:12px;">
        <span style="font-size:2.5em;">${icon}</span>
        <div style="flex:1;">
          <h3 style="margin:0;font-size:1.25em;letter-spacing:1px;color:${textColor};">${d.title || ''} <span style='font-size:0.85em;font-weight:normal;color:${subText};'>${todayStr} 今日运势</span></h3>
        </div>
        <button class="close-btn" style="font-size:1.5em;background:none;border:none;color:${textColor};">&times;</button>
      </div>
      <div class="modal-body" style="padding:22px 24px 18px 24px;max-height:62vh;overflow:auto;">
        <div class="horoscope-short" style="margin-bottom:16px;font-weight:bold;font-size:1.12em;color:#d72660;letter-spacing:0.5px;">🔔 本日需注意：${d.shortcomment || ''}</div>
        <div class="horoscope-section-detail" style="margin-bottom:14px;">
          <div class="horoscope-section-title" style="font-size:1.08em;font-weight:bold;margin-bottom:4px;color:${textColor};">${icons.all} 综合运势</div>
          <div class="horoscope-bar" style="background:#2223  ;border-radius:8px;height:16px;overflow:hidden;margin-bottom:6px;"><div class="horoscope-bar-inner" style="background:${barAll};height:100%;width:${parseInt(d.index?.all)||0}%;transition:width .5s;"></div></div>
          <div class="horoscope-fortune-text" style="color:${textColor};font-size:0.98em;">${d.fortunetext?.all || ''}</div>
        </div>
        <div class="horoscope-section-detail" style="margin-bottom:14px;">
          <div class="horoscope-section-title" style="font-size:1.08em;font-weight:bold;margin-bottom:4px;color:${textColor};">${icons.health} 健康</div>
          <div class="horoscope-bar" style="background:#2223  ;border-radius:8px;height:16px;overflow:hidden;margin-bottom:6px;"><div class="horoscope-bar-inner" style="background:${barHealth};height:100%;width:${parseInt(d.index?.health)||0}%;transition:width .5s;"></div></div>
          <div class="horoscope-fortune-text" style="color:${textColor};font-size:0.98em;">${d.fortunetext?.health || ''}</div>
        </div>
        <div class="horoscope-section-detail" style="margin-bottom:14px;">
          <div class="horoscope-section-title" style="font-size:1.08em;font-weight:bold;margin-bottom:4px;color:${textColor};">${icons.love} 爱情</div>
          <div class="horoscope-bar" style="background:#2223  ;border-radius:8px;height:16px;overflow:hidden;margin-bottom:6px;"><div class="horoscope-bar-inner" style="background:${barLove};height:100%;width:${parseInt(d.index?.love)||0}%;transition:width .5s;"></div></div>
          <div class="horoscope-fortune-text" style="color:${textColor};font-size:0.98em;">${d.fortunetext?.love || ''}</div>
        </div>
        <div class="horoscope-section-detail" style="margin-bottom:14px;">
          <div class="horoscope-section-title" style="font-size:1.08em;font-weight:bold;margin-bottom:4px;color:${textColor};">${icons.money} 财运</div>
          <div class="horoscope-bar" style="background:#2223  ;border-radius:8px;height:16px;overflow:hidden;margin-bottom:6px;"><div class="horoscope-bar-inner" style="background:${barMoney};height:100%;width:${parseInt(d.index?.money)||0}%;transition:width .5s;"></div></div>
          <div class="horoscope-fortune-text" style="color:${textColor};font-size:0.98em;">${d.fortunetext?.money || ''}</div>
        </div>
        <div class="horoscope-section-detail" style="margin-bottom:14px;">
          <div class="horoscope-section-title" style="font-size:1.08em;font-weight:bold;margin-bottom:4px;color:${textColor};">${icons.work} 工作</div>
          <div class="horoscope-bar" style="background:#2223  ;border-radius:8px;height:16px;overflow:hidden;margin-bottom:6px;"><div class="horoscope-bar-inner" style="background:${barWork};height:100%;width:${parseInt(d.index?.work)||0}%;transition:width .5s;"></div></div>
          <div class="horoscope-fortune-text" style="color:${textColor};font-size:0.98em;">${d.fortunetext?.work || ''}</div>
        </div>
        <div style="display:flex;gap:12px;margin:18px 0 8px 0;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;background:${card1};border-radius:10px;padding:10px 14px;color:#ffe0f7;font-weight:bold;box-shadow:0 2px 8px #fbc2eb33;">🍀 幸运数字：${d.luckynumber || '-'}</div>
          <div style="flex:1;min-width:120px;background:${card2};border-radius:10px;padding:10px 14px;color:#ffe0f7;font-weight:bold;box-shadow:0 2px 8px #a1c4fd33;">🌟 幸运星座：${d.luckyconstellation || '-'}</div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:8px;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;background:${card3};border-radius:10px;padding:10px 14px;color:#fff;font-weight:bold;box-shadow:0 2px 8px #ffd20033;">✅ 宜：${d.todo?.yi || '-'}</div>
          <div style="flex:1;min-width:120px;background:${card4};border-radius:10px;padding:10px 14px;color:#fff;font-weight:bold;box-shadow:0 2px 8px #f857a633;">❌ 忌：${d.todo?.ji || '-'}</div>
        </div>
        <div style="text-align:right;margin-top:18px;">
          <button id="horoscope-copy-btn" class="horoscope-detail-btn" style="font-size:1.08em;background:${btnBg};color:${btnColor};border:none;border-radius:8px;padding:8px 22px;box-shadow:0 2px 8px #fbc2eb33;cursor:pointer;">📋 Copy全部Content</button>
        </div>
      </div>
    </div>
  `;
  // Close按钮
  modal.querySelector('.close-btn').onclick = function() {
    modal.style.display = 'none';
  };
  // 点击遮罩Close
  modal.onclick = function(e) {
    if (e.target === modal) modal.style.display = 'none';
  };
  // Copy按钮
  modal.querySelector('#horoscope-copy-btn').onclick = function() {
    navigator.clipboard.writeText(getDetailText());
    this.textContent = '已Copy';
    setTimeout(()=>{this.textContent='📋 Copy全部Content';}, 1200);
  };
  modal.style.display = 'block';
}

function fetchHoroscope(signType, cb) {
  fetch(`${HOROSCOPE_API}?type=${signType}&time=today`)
    .then(res => res.json())
    .then(data => cb(data))
    .catch(() => cb({ error: true }));
}

// 挂载到今日热搜卡片上方
function mountHoroscopeWidget() {
  // 定位到今日热搜卡片上方
  const hotTodaySection = document.querySelector('.hot-today-section');
  if (!hotTodaySection) return;
  let widget = document.getElementById('horoscope-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'horoscope-widget';
    widget.style.margin = '30px 0';
    hotTodaySection.parentNode.insertBefore(widget, hotTodaySection);
  }
  // 清空Content
  widget.innerHTML = '';
  // 创建卡片
  const card = document.createElement('div');
  card.className = 'horoscope-card';
  widget.appendChild(card);
  // 卡片顶部：Select框和Title
  const topDiv = document.createElement('div');
  topDiv.style.display = 'flex';
  topDiv.style.justifyContent = 'space-between';
  topDiv.style.alignItems = 'center';
  topDiv.style.marginBottom = '8px';
  // Title
  const title = document.createElement('div');
  title.className = 'horoscope-title';
  title.innerHTML = '星座运势';
  topDiv.appendChild(title);
  // Select框
  const selectorDiv = document.createElement('div');
  selectorDiv.style.textAlign = 'right';
  // 读取本地存储的星座
  let currentSign = localStorage.getItem('horoscope_sign_type') || HOROSCOPE_SIGNS[0].type;
  const select = document.createElement('select');
  select.className = 'horoscope-sign-select';
  HOROSCOPE_SIGNS.forEach(sign => {
    const option = document.createElement('option');
    option.value = sign.type;
    option.textContent = `${sign.icon} ${sign.name}`;
    if (sign.type === currentSign) option.selected = true;
    select.appendChild(option);
  });
  select.addEventListener('change', () => {
    currentSign = select.value;
    localStorage.setItem('horoscope_sign_type', currentSign);
    cardDiv.innerHTML = '加载medium...';
    fetchHoroscope(currentSign, data => renderHoroscopeCard(cardDiv, data));
  });
  selectorDiv.appendChild(select);
  topDiv.appendChild(selectorDiv);
  card.appendChild(topDiv);
  // 卡片Content区
  const cardDiv = document.createElement('div');
  card.appendChild(cardDiv);
  function updateHoroscope() {
    cardDiv.innerHTML = '加载medium...';
    // 始终用当前Select的星座
    const signType = select.value;
    fetchHoroscope(signType, data => renderHoroscopeCard(cardDiv, data));
  }
  updateHoroscope();
  // 每隔1min自动更新
  setInterval(updateHoroscope, 60000);
}

// 页面加载后自动挂载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountHoroscopeWidget);
} else {
  mountHoroscopeWidget();
} 