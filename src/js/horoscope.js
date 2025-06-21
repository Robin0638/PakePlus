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
  // 详情文本拼接（用于复制）
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
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'horoscope-detail-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:420px;">
        <div class="modal-header">
          <h3>${icon} ${d.title || ''} ${todayStr} 今日运势</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body" style="max-height:60vh;overflow:auto;">
          <div class="horoscope-short" style="margin-bottom:10px;font-weight:bold;font-size:1.08em;">
            本日需注意：${d.shortcomment || ''}
          </div>
          <div class="horoscope-section-detail">
            <div class="horoscope-section-title">${icons.all} <span style='font-weight:bold'>综合运势</span></div>
            <div class="horoscope-fortune-text">${d.fortunetext?.all || ''}</div>
          </div>
          <div class="horoscope-section-detail">
            <div class="horoscope-section-title">${icons.health} <span style='font-weight:bold'>健康</span></div>
            <div class="horoscope-fortune-text">${d.fortunetext?.health || ''}</div>
          </div>
          <div class="horoscope-section-detail">
            <div class="horoscope-section-title">${icons.love} <span style='font-weight:bold'>爱情</span></div>
            <div class="horoscope-fortune-text">${d.fortunetext?.love || ''}</div>
          </div>
          <div class="horoscope-section-detail">
            <div class="horoscope-section-title">${icons.money} <span style='font-weight:bold'>财运</span></div>
            <div class="horoscope-fortune-text">${d.fortunetext?.money || ''}</div>
          </div>
          <div class="horoscope-section-detail">
            <div class="horoscope-section-title">${icons.work} <span style='font-weight:bold'>工作</span></div>
            <div class="horoscope-fortune-text">${d.fortunetext?.work || ''}</div>
          </div>
          <div style="border-top:1px dashed #e0e0e0;margin:12px 0 8px 0;padding-top:8px;">
            <div style="margin-bottom:4px;"><b>幸运数字：</b>${d.luckynumber || '-'}</div>
            <div style="margin-bottom:4px;"><b>幸运星座：</b>${d.luckyconstellation || '-'}</div>
            <div style="margin-bottom:4px;"><b>宜：</b>${d.todo?.yi || '-'}</div>
            <div style="margin-bottom:4px;"><b>忌：</b>${d.todo?.ji || '-'}</div>
          </div>
          <div style="text-align:right;margin-top:10px;">
            <button id="horoscope-copy-btn" class="horoscope-detail-btn" style="font-size:0.98em;">复制全部内容</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // 关闭按钮
    modal.querySelector('.close-btn').onclick = function() {
      modal.style.display = 'none';
    };
    // 点击遮罩关闭
    modal.onclick = function(e) {
      if (e.target === modal) modal.style.display = 'none';
    };
    // 复制按钮
    modal.querySelector('#horoscope-copy-btn').onclick = function() {
      navigator.clipboard.writeText(getDetailText());
      this.textContent = '已复制';
      setTimeout(()=>{this.textContent='复制全部内容';}, 1200);
    };
  } else {
    modal.querySelector('.modal-header h3').innerHTML = `${icon} ${d.title || ''} ${todayStr} 今日运势`;
    modal.querySelector('.modal-body').innerHTML = `
      <div class="horoscope-short" style="margin-bottom:10px;font-weight:bold;font-size:1.08em;">
        本日需注意：${d.shortcomment || ''}
      </div>
      <div class="horoscope-section-detail">
        <div class="horoscope-section-title">${icons.all} <span style='font-weight:bold'>综合运势</span></div>
        <div class="horoscope-fortune-text">${d.fortunetext?.all || ''}</div>
      </div>
      <div class="horoscope-section-detail">
        <div class="horoscope-section-title">${icons.health} <span style='font-weight:bold'>健康</span></div>
        <div class="horoscope-fortune-text">${d.fortunetext?.health || ''}</div>
      </div>
      <div class="horoscope-section-detail">
        <div class="horoscope-section-title">${icons.love} <span style='font-weight:bold'>爱情</span></div>
        <div class="horoscope-fortune-text">${d.fortunetext?.love || ''}</div>
      </div>
      <div class="horoscope-section-detail">
        <div class="horoscope-section-title">${icons.money} <span style='font-weight:bold'>财运</span></div>
        <div class="horoscope-fortune-text">${d.fortunetext?.money || ''}</div>
      </div>
      <div class="horoscope-section-detail">
        <div class="horoscope-section-title">${icons.work} <span style='font-weight:bold'>工作</span></div>
        <div class="horoscope-fortune-text">${d.fortunetext?.work || ''}</div>
      </div>
      <div style=\"border-top:1px dashed #e0e0e0;margin:12px 0 8px 0;padding-top:8px;\">
        <div style=\"margin-bottom:4px;\"><b>幸运数字：</b>${d.luckynumber || '-'}</div>
        <div style=\"margin-bottom:4px;\"><b>幸运星座：</b>${d.luckyconstellation || '-'}</div>
        <div style=\"margin-bottom:4px;\"><b>宜：</b>${d.todo?.yi || '-'}</div>
        <div style=\"margin-bottom:4px;\"><b>忌：</b>${d.todo?.ji || '-'}</div>
      </div>
      <div style=\"text-align:right;margin-top:10px;\">
        <button id=\"horoscope-copy-btn\" class=\"horoscope-detail-btn\" style=\"font-size:0.98em;\">复制全部内容</button>
      </div>
    `;
    // 复制按钮
    modal.querySelector('#horoscope-copy-btn').onclick = function() {
      navigator.clipboard.writeText(getDetailText());
      this.textContent = '已复制';
      setTimeout(()=>{this.textContent='复制全部内容';}, 1200);
    };
  }
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
  // 清空内容
  widget.innerHTML = '';
  // 创建卡片
  const card = document.createElement('div');
  card.className = 'horoscope-card';
  widget.appendChild(card);
  // 卡片顶部：选择框和标题
  const topDiv = document.createElement('div');
  topDiv.style.display = 'flex';
  topDiv.style.justifyContent = 'space-between';
  topDiv.style.alignItems = 'center';
  topDiv.style.marginBottom = '8px';
  // 标题
  const title = document.createElement('div');
  title.className = 'horoscope-title';
  title.innerHTML = '星座运势';
  topDiv.appendChild(title);
  // 选择框
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
    cardDiv.innerHTML = '加载中...';
    fetchHoroscope(currentSign, data => renderHoroscopeCard(cardDiv, data));
  });
  selectorDiv.appendChild(select);
  topDiv.appendChild(selectorDiv);
  card.appendChild(topDiv);
  // 卡片内容区
  const cardDiv = document.createElement('div');
  card.appendChild(cardDiv);
  function updateHoroscope() {
    cardDiv.innerHTML = '加载中...';
    // 始终用当前选择的星座
    const signType = select.value;
    fetchHoroscope(signType, data => renderHoroscopeCard(cardDiv, data));
  }
  updateHoroscope();
  // 每隔1分钟自动更新
  setInterval(updateHoroscope, 60000);
}

// 页面加载后自动挂载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountHoroscopeWidget);
} else {
  mountHoroscopeWidget();
} 