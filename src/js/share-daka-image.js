// 打卡卡片图片分享功能
// 依赖：html2canvas（需在index.html中引入）
(function(){
    function showShareDakaImageModal(dakaData) {
        // 1. 构建一个隐藏的DOM用于截图
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = '-9999px';
        temp.style.top = '0';
        temp.style.width = '360px';
        temp.style.background = '#fff';
        temp.style.color = '#222';
        temp.style.borderRadius = '16px';
        temp.style.boxShadow = '0 2px 16px #4285f422';
        temp.style.padding = '28px 20px 20px 20px';
        temp.style.fontFamily = 'inherit';
        temp.innerHTML = `
            <div style="font-size:22px;font-weight:700;margin-bottom:10px;word-break:break-all;">${escapeHtml(dakaData.title)}</div>
            <div style="font-size:15px;color:#666;margin-bottom:12px;word-break:break-all;">${escapeHtml(dakaData.content)}</div>
            <div style="margin-bottom:10px;font-size:13px;color:#888;">标签：${(dakaData.tags||[]).map(tag=>`<span style='background:#e3f0ff;color:#4285f4;padding:2px 8px;border-radius:4px;margin-right:6px;font-size:12px;'>${escapeHtml(tag)}</span>`).join('')}</div>
            <div style='margin-bottom:10px;font-size:13px;color:#888;'>打卡记录：</div>
            <div style='max-height:180px;overflow-y:auto;'>
                ${(dakaData.punchRecords||[]).map(r=>`
                    <div style='margin-bottom:10px;padding:10px 12px;background:#f8faff;border-radius:8px;border:1px solid #e3eafc;'>
                        <div style='font-size:13px;color:#4285f4;font-weight:600;margin-bottom:4px;'><i class="fas fa-calendar-check"></i> ${r.date}</div>
                        ${r.text?`<div style='font-size:15px;color:#333;margin:6px 0 0 0;line-height:1.7;'>${escapeHtml(r.text)}</div>`:''}
                        ${(r.files||[]).length?`<div style='margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;'>${r.files.map(f=>f.type&&f.type.startsWith('image/')&&f.data?`<img src='${f.data}' style='max-width:60px;max-height:60px;border-radius:6px;box-shadow:0 1px 4px #ccc;' />`:'').join('')}</div>`:''}
                    </div>
                `).join('')}
            </div>
            <div style='margin-top:18px;text-align:center;font-size:12px;color:#bbb;'>内容来自有数</div>
        `;
        document.body.appendChild(temp);
        // 2. 用html2canvas生成图片
        window.html2canvas(temp, {backgroundColor: null, useCORS: true, scale: 2}).then(canvas => {
            const imgUrl = canvas.toDataURL('image/png');
            document.body.removeChild(temp);
            // 3. 弹窗预览
            showImagePreviewModal(imgUrl);
        });
    }

    function showImagePreviewModal(imgUrl) {
        // 移除已存在的弹窗
        document.querySelectorAll('.share-daka-image-modal').forEach(e=>e.remove());
        // 创建弹窗
        const overlay = document.createElement('div');
        overlay.className = 'share-daka-image-modal';
        overlay.innerHTML = `
            <div class="share-daka-image-popup">
                <button class="share-daka-image-close" title="关闭">×</button>
                <div class="share-daka-image-preview"><img src="${imgUrl}" style="max-width:100%;max-height:50vh;border-radius:12px;" /></div>
                <div class="share-daka-image-actions">
                    <button class="share-daka-image-btn" id="daka-img-download"><i class="fas fa-download"></i> 下载图片</button>
                    <button class="share-daka-image-btn" id="daka-img-share"><i class="fas fa-share-alt"></i> 分享图片</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('.share-daka-image-close').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        // 下载
        overlay.querySelector('#daka-img-download').onclick = () => {
            const a = document.createElement('a');
            a.href = imgUrl;
            a.download = 'daka-share.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        // 分享
        overlay.querySelector('#daka-img-share').onclick = async () => {
            if (navigator.canShare && navigator.canShare({ files: [] })) {
                const res = await fetch(imgUrl);
                const blob = await res.blob();
                const file = new File([blob], 'daka-share.png', { type: 'image/png' });
                try {
                    await navigator.share({ files: [file], title: '打卡分享', text: '分享我的打卡' });
                } catch {}
            } else {
                alert('当前浏览器不支持原生图片分享，可手动下载后分享');
            }
        };
    }

    // 笔记分享图片
    window.showShareNoteImageModal = function(noteData) {
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = '-9999px';
        temp.style.top = '0';
        temp.style.width = '360px';
        temp.style.background = '#fff';
        temp.style.color = '#222';
        temp.style.borderRadius = '16px';
        temp.style.boxShadow = '0 2px 16px #4285f422';
        temp.style.padding = '28px 20px 20px 20px';
        temp.style.fontFamily = 'inherit';
        temp.innerHTML = `
            <div style=\"font-size:22px;font-weight:700;margin-bottom:10px;word-break:break-all;\">${escapeHtml(noteData.title)}</div>
            <div style=\"font-size:15px;color:#666;margin-bottom:12px;word-break:break-all;max-height:120px;overflow:auto;\">${escapeHtml(noteData.content)}</div>
            <div style=\"margin-bottom:10px;font-size:13px;color:#888;\">标签：${(noteData.tags||[]).map(tag=>`<span style='background:#e3f0ff;color:#4285f4;padding:2px 8px;border-radius:4px;margin-right:6px;font-size:12px;'>${escapeHtml(tag)}</span>`).join('')}</div>
            <div style='margin-top:18px;text-align:center;font-size:12px;color:#bbb;'>内容来自有数</div>
        `;
        document.body.appendChild(temp);
        window.html2canvas(temp, {backgroundColor: null, useCORS: true, scale: 2}).then(canvas => {
            const imgUrl = canvas.toDataURL('image/png');
            document.body.removeChild(temp);
            showImagePreviewModal(imgUrl);
        });
    }

    // 倒数日分享图片
    window.showShareCountdownImageModal = function(countdownData) {
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = '-9999px';
        temp.style.top = '0';
        temp.style.width = '360px';
        temp.style.background = '#fff';
        temp.style.color = '#222';
        temp.style.borderRadius = '16px';
        temp.style.boxShadow = '0 2px 16px #4285f422';
        temp.style.padding = '28px 20px 20px 20px';
        temp.style.fontFamily = 'inherit';
        temp.innerHTML = `
            <div style=\"font-size:22px;font-weight:700;margin-bottom:10px;word-break:break-all;display:flex;align-items:center;gap:10px;\">${countdownData.icon||''} ${escapeHtml(countdownData.name)}</div>
            <div style=\"font-size:15px;color:#666;margin-bottom:8px;word-break:break-all;\">日期：${escapeHtml(countdownData.date)}${countdownData.typeShort?`（${escapeHtml(countdownData.typeShort)}）`:''}</div>
            <div style=\"font-size:18px;font-weight:600;color:#4285f4;margin-bottom:8px;\">${countdownData.daysText}</div>
            ${countdownData.notes?`<div style=\"font-size:14px;color:#888;margin-bottom:8px;word-break:break-all;\">备注：${escapeHtml(countdownData.notes)}</div>`:''}
            ${countdownData.participants&&countdownData.participants.length?`<div style=\"font-size:13px;color:#888;margin-bottom:8px;\">参与者：${countdownData.participants.map(escapeHtml).join('，')}</div>`:''}
            <div style='margin-top:18px;text-align:center;font-size:12px;color:#bbb;'>内容来自有数</div>
        `;
        document.body.appendChild(temp);
        window.html2canvas(temp, {backgroundColor: null, useCORS: true, scale: 2}).then(canvas => {
            const imgUrl = canvas.toDataURL('image/png');
            document.body.removeChild(temp);
            showImagePreviewModal(imgUrl);
        });
    }

    function escapeHtml(str) {
        return String(str||'').replace(/[&<>"']/g, function(s) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[s];
        });
    }

    // 对外暴露
    window.showShareDakaImageModal = showShareDakaImageModal;
})(); 