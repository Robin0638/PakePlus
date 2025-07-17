// 悬浮窗：今日农历信息
(function() {
  const solarSpan = document.getElementById('today-solar');
  const lunarSpan = document.getElementById('today-lunar');
  const btn = document.getElementById('holiday-lunar-float');

  // 获取今日日期
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  let lastDetail = null;
  let lastHolidayInfo = null;
  let lastHolidayType = null; // 0:班 1:休 2:假

  // 调用万年历API
  function fetchAlmanac() {
    const url = `https://api.tiax.cn/almanac/?year=${yyyy}&month=${parseInt(mm)}&day=${parseInt(dd)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        // 公历月日（不显示年份）
        const solar = `${parseInt(mm)}月${parseInt(dd)}日`;
        // 农历信息，只显示月日
        let lunar = '';
        if (data.农历日期) {
          lunar = data.农历日期.replace(/^农历.*?年\s*/,'').trim();
        } else {
          lunar = '农历加载失败';
        }
        lastDetail = data;
        fetchHolidayInfo(solar, lunar);
      })
      .catch(() => {
        solarSpan.textContent = '日期加载失败';
        lunarSpan.textContent = '';
        lastDetail = null;
      });
  }

  // 节假日API（以timor.tech为例，支持免费/开源/离线）
  function fetchHolidayInfo(solar, lunar) {
    fetch(`https://timor.tech/api/holiday/info?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        // 结构参考 https://timor.tech/api/holiday/info?date=2024-05-01
        // data.holiday: {name: "劳动节", ...}  data.type.type: 0/1/2
        let info = '';
        let type = null;
        if (data.holiday && data.holiday.name) {
          info = data.holiday.name;
        } else if (data.type) {
          if (data.type.type === 2) info = '节假日';
          else if (data.type.type === 1) info = '休息日';
          else if (data.type.type === 0) info = '工作日';
        }
        type = data.type ? data.type.type : null;
        lastHolidayInfo = info;
        lastHolidayType = type;
        // 顶部栏加“假”或“班”
        let tag = '';
        // 统一亮色（橙色）
        if (type === 2) tag = '<span style="color:#ffb300;font-size:12px;font-weight:bold;margin-left:6px;">假</span>';
        else if (type === 1) tag = '<span style="color:#ffb300;font-size:12px;font-weight:bold;margin-left:6px;">假</span>';
        else if (type === 0) tag = '<span style="color:#ffb300;font-size:12px;font-weight:bold;margin-left:6px;">班</span>';
        // solar和lunar也高亮
        solarSpan.innerHTML = `<span style="color:#fff;font-weight:bold;">${solar}</span>` + tag;
        lunarSpan.innerHTML = `<span style="color:#f8e9b0;font-weight:bold;">${lunar}</span>`;
      })
      .catch(() => {
        lastHolidayInfo = null;
        lastHolidayType = null;
        solarSpan.textContent = solar;
        lunarSpan.textContent = lunar;
      });
  }

  // 弹窗显示详细信息
  function showDetailDialog(data) {
    if (!data) return;
    // 判断深色模式
    const isDark = document.body.classList.contains('dark-theme');
    const cardBg = isDark ? 'linear-gradient(135deg,#23272e 60%,#2d3138 100%)' : 'linear-gradient(135deg,#fff 60%,#f7fafd 100%)';
    const cardColor = isDark ? '#f3f3f3' : '#222';
    const cardShadow = isDark ? '0 8px 32px rgba(0,0,0,0.55)' : '0 8px 32px rgba(0,0,0,0.13)';
    const closeColor = isDark ? '#aaa' : '#888';
    const lunarColor = isDark ? '#7ecfff' : '#2980b9';
    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const tag1 = isDark ? 'linear-gradient(90deg,#3a3f4a,#5e5a7a)' : 'linear-gradient(90deg,#fbeee6,#f7d9c4)';
    const tag2 = isDark ? 'linear-gradient(90deg,#2e4a5e,#3a7ca5)' : 'linear-gradient(90deg,#e6f7fb,#c4e3f7)';
    const tag3 = isDark ? 'linear-gradient(90deg,#3a2e5e,#7b3fb0)' : 'linear-gradient(90deg,#f3e6fb,#e0c4f7)';
    const fontTitle = 'font-family:STKaiti,STSong,SimSun,fangsong,Microsoft YaHei,serif;';
    let yiList = (data.宜||'').split('、').filter(Boolean).map(item=>`<div style='display:flex;align-items:center;gap:4px;margin:2px 0 2px 0;'><span style="color:#27ae60;font-size:13px;">✔️</span><span>${item}</span></div>`).join('');
    // 获取当前时间字符串
    function getTimeStr() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
    // 假日信息优先用API
    let holidayText = lastHolidayInfo ? `<div style=\"font-size:15px;color:#e67e22;font-weight:bold;margin-top:6px;letter-spacing:1px;\">${lastHolidayInfo}</div>` : '';
    // 时间显示
    let timeHtml = `<div id=\"lunar-detail-time\" style=\"font-size:14px;color:#ffb300;font-weight:bold;margin-top:2px;letter-spacing:1px;\">${getTimeStr()}</div>`;
    const html = `
      <div style=\"text-align:center;margin-bottom:18px;\">
        <div style=\"font-size:22px;font-weight:600;letter-spacing:1.5px;${fontTitle}line-height:1.2;\">${data.公历日期||''}</div>
        <div style=\"font-size:16px;color:${lunarColor};margin-top:4px;${fontTitle}line-height:1.2;\">${data.农历日期||''}</div>
        ${timeHtml}
        ${holidayText}
      </div>
      <div style=\"display:flex;justify-content:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;\">
        <span style=\"background:${tag1};border-radius:8px;padding:3px 14px;font-size:13px;color:#b07b33;${isDark?'color:#e0c08c;':''};box-shadow:0 1px 4px 0 rgba(0,0,0,0.04);transition:box-shadow 0.2s;cursor:default;\">干支：${data.干支日期||''}</span>
        <span style=\"background:${tag2};border-radius:8px;padding:3px 14px;font-size:13px;color:#3a7ca5;${isDark?'color:#7ecfff;':''};box-shadow:0 1px 4px 0 rgba(0,0,0,0.04);transition:box-shadow 0.2s;cursor:default;\">五行：${data.五行纳音||''}</span>
        <span style=\"background:${tag3};border-radius:8px;padding:3px 14px;font-size:13px;color:#7b3fb0;${isDark?'color:#c7aaff;':''};box-shadow:0 1px 4px 0 rgba(0,0,0,0.04);transition:box-shadow 0.2s;cursor:default;\">星神：${data.值日星神||''}</span>
      </div>
      <div style=\"border-top:1px solid ${borderColor};margin:0 0 0 0;padding:12px 0 0 0;\">
        <div style=\"font-size:16px;font-weight:bold;color:#27ae60;letter-spacing:1px;text-align:center;${fontTitle}\">宜</div>
        <div style=\"font-size:14px;line-height:1.8;color:${isDark?'#b6e6c7':'#2d7a4b'};margin-top:6px;max-height:120px;overflow:auto;-webkit-overflow-scrolling:touch;\">${yiList}</div>
      </div>
      <div style=\"border-top:1px solid ${borderColor};margin:18px 0 0 0;padding:10px 0 0 0;text-align:center;\">
        <div style=\"font-size:13px;color:${isDark?'#aaa':'#888'};\">黄历参考：${data.黄历日期||''}</div>
      </div>
    `;
    // 创建弹窗
    let dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.left = '0';
    dialog.style.top = '0';
    dialog.style.width = '100vw';
    dialog.style.height = '100vh';
    dialog.style.background = 'rgba(0,0,0,0.25)';
    dialog.style.zIndex = '9999';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    dialog.innerHTML = `<div style=\"background:${cardBg};color:${cardColor};padding:32px 22px 22px 22px;border-radius:20px;max-width:96vw;min-width:240px;box-shadow:${cardShadow};position:relative;backdrop-filter:blur(2px);\">
      <button id=\"close-lunar-detail\" style=\"position:absolute;right:14px;top:10px;background:none;border:none;font-size:22px;cursor:pointer;color:${closeColor};line-height:1;\">×</button>
      <button id=\"share-lunar-detail\" title=\"分享\" style=\"position:absolute;right:48px;top:12px;background:none;border:none;font-size:18px;cursor:pointer;color:${closeColor};line-height:1;\"><i class=\"fas fa-share-alt\"></i></button>
      ${html}
    </div>`;
    document.body.appendChild(dialog);
    // 关闭按钮
    dialog.querySelector('#close-lunar-detail').onclick = function() {
      document.body.removeChild(dialog);
    };
    dialog.onclick = function(e) {
      if (e.target === dialog) document.body.removeChild(dialog);
    };
    // 分享按钮
    dialog.querySelector('#share-lunar-detail').onclick = function(e) {
      e.stopPropagation();
      // 分享方式选择
      let shareBox = document.createElement('div');
      shareBox.style.position = 'fixed';
      shareBox.style.left = '0';
      shareBox.style.top = '0';
      shareBox.style.width = '100vw';
      shareBox.style.height = '100vh';
      shareBox.style.background = 'rgba(0,0,0,0.15)';
      shareBox.style.zIndex = '10000';
      shareBox.style.display = 'flex';
      shareBox.style.alignItems = 'center';
      shareBox.style.justifyContent = 'center';
      shareBox.innerHTML = `<div style=\"background:${cardBg};color:${cardColor};padding:18px 24px;border-radius:14px;box-shadow:${cardShadow};min-width:180px;max-width:90vw;display:flex;flex-direction:column;gap:16px;align-items:center;\">
        <button id=\"share-as-image\" style=\"font-size:15px;padding:8px 18px;border-radius:8px;border:none;background:#ffb300;color:#fff;font-weight:bold;cursor:pointer;display:flex;align-items:center;gap:8px;\"><i class=\"fas fa-image\"></i>图片分享</button>
        <button id=\"share-as-text\" style=\"font-size:15px;padding:8px 18px;border-radius:8px;border:none;background:#27ae60;color:#fff;font-weight:bold;cursor:pointer;display:flex;align-items:center;gap:8px;\"><i class=\"fas fa-font\"></i>文字分享</button>
        <button id=\"share-cancel\" style=\"font-size:13px;padding:4px 12px;border-radius:6px;border:none;background:#eee;color:#888;cursor:pointer;margin-top:8px;\">取消</button>
      </div>`;
      document.body.appendChild(shareBox);
      shareBox.onclick = function(ev) { if (ev.target === shareBox) document.body.removeChild(shareBox); };
      shareBox.querySelector('#share-cancel').onclick = function() { document.body.removeChild(shareBox); };
      // 图片分享
      shareBox.querySelector('#share-as-image').onclick = function() {
        document.body.removeChild(shareBox);
        // 在截图前临时扩展卡片内容，确保宜内容全部显示，并加来源
        const card = dialog.querySelector('div');
        let sourceMark = document.createElement('div');
        sourceMark.textContent = '内容来源：有数规划（电脑版）日历+开源API';
        sourceMark.style.cssText = 'text-align:center;font-size:12px;color:#bbb;margin-top:18px;letter-spacing:1px;';
        card.appendChild(sourceMark);
        // 展开宜内容区域高度
        const yiDiv = card.querySelector('div[style*="max-height:120px"]');
        let oldMaxHeight = null;
        if (yiDiv) {
          oldMaxHeight = yiDiv.style.maxHeight;
          yiDiv.style.maxHeight = 'none';
        }
        // 隐藏关闭和分享按钮
        const closeBtn = card.querySelector('#close-lunar-detail');
        const shareBtn = card.querySelector('#share-lunar-detail');
        let oldCloseDisplay = closeBtn ? closeBtn.style.display : null;
        let oldShareDisplay = shareBtn ? shareBtn.style.display : null;
        if (closeBtn) closeBtn.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'none';
        // 临时修改时间内容
        const timeDiv = card.querySelector('#lunar-detail-time');
        let oldTimeText = timeDiv ? timeDiv.textContent : null;
        if (timeDiv) {
          const now = new Date();
          const h = String(now.getHours()).padStart(2, '0');
          const m = String(now.getMinutes()).padStart(2, '0');
          const s = String(now.getSeconds()).padStart(2, '0');
          timeDiv.textContent = `分享时间：${h}:${m}:${s}`;
        }
        if (window.html2canvas) {
          html2canvas(card, {backgroundColor: null}).then(canvas => {
            // 截图后还原
            card.removeChild(sourceMark);
            if (yiDiv && oldMaxHeight !== null) yiDiv.style.maxHeight = oldMaxHeight;
            if (closeBtn && oldCloseDisplay !== null) closeBtn.style.display = oldCloseDisplay;
            if (shareBtn && oldShareDisplay !== null) shareBtn.style.display = oldShareDisplay;
            if (timeDiv && oldTimeText !== null) timeDiv.textContent = oldTimeText;
            // 预览弹窗
            let previewBox = document.createElement('div');
            previewBox.style.position = 'fixed';
            previewBox.style.left = '0';
            previewBox.style.top = '0';
            previewBox.style.width = '100vw';
            previewBox.style.height = '100vh';
            previewBox.style.background = 'rgba(0,0,0,0.7)';
            previewBox.style.zIndex = '10001';
            previewBox.style.display = 'flex';
            previewBox.style.alignItems = 'center';
            previewBox.style.justifyContent = 'center';
            previewBox.innerHTML = `<div style=\"background:#fff;padding:18px 12px 12px 12px;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,0.18);max-width:96vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;\">
              <img src=\"${canvas.toDataURL('image/png')}\" alt=\"预览\" style=\"max-width:80vw;max-height:60vh;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.10);margin-bottom:12px;\" />
              <button id=\"download-preview-img\" style=\"font-size:15px;padding:7px 22px;border-radius:8px;border:none;background:#ffb300;color:#fff;font-weight:bold;cursor:pointer;\">下载图片</button>
              <button id=\"close-preview-img\" style=\"font-size:13px;padding:4px 12px;border-radius:6px;border:none;background:#eee;color:#888;cursor:pointer;margin-top:8px;\">关闭</button>
              <div style=\"font-size:12px;color:#888;margin-top:6px;\">可长按图片保存或点击下载</div>
            </div>`;
            document.body.appendChild(previewBox);
            previewBox.onclick = function(ev) { if (ev.target === previewBox) document.body.removeChild(previewBox); };
            previewBox.querySelector('#close-preview-img').onclick = function() { document.body.removeChild(previewBox); };
            previewBox.querySelector('#download-preview-img').onclick = function() {
              const url = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = url;
              a.download = 'calendar-card.png';
              a.click();
            };
          });
        } else {
          // 还原
          card.removeChild(sourceMark);
          if (yiDiv && oldMaxHeight !== null) yiDiv.style.maxHeight = oldMaxHeight;
          if (closeBtn && oldCloseDisplay !== null) closeBtn.style.display = oldCloseDisplay;
          if (shareBtn && oldShareDisplay !== null) shareBtn.style.display = oldShareDisplay;
          if (timeDiv && oldTimeText !== null) timeDiv.textContent = oldTimeText;
          alert('未检测到html2canvas，无法截图');
        }
      };
      // 文字分享
      shareBox.querySelector('#share-as-text').onclick = function() {
        document.body.removeChild(shareBox);
        let text = '';
        text += (lastDetail?.公历日期||'') + '\n';
        text += (lastDetail?.农历日期||'') + '\n';
        if (lastHolidayInfo) text += `[${lastHolidayInfo}]\n`;
        text += '宜：' + (lastDetail?.宜||'') + '\n';
        text += '黄历：' + (lastDetail?.黄历日期||'') + '\n';
        navigator.clipboard.writeText(text);
        alert('已复制到剪贴板，可粘贴分享');
      };
    };
    // 自动更新时间
    setTimeout(function updateTime() {
      const t = document.getElementById('lunar-detail-time');
      if (t) {
        t.textContent = getTimeStr();
        setTimeout(updateTime, 1000);
      }
    }, 1000);
  }

  btn && btn.addEventListener('click', function() {
    if (lastDetail) showDetailDialog(lastDetail);
  });

  fetchAlmanac();
})(); 