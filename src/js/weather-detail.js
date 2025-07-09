// 天气详情弹窗逻辑
(function(){
    function getExtraSuggestions(data) {
        // 穿衣建议
        let dress = '';
        if(data.temp >= 28) dress = '建议穿短袖、短裤等清凉衣物';
        else if(data.temp >= 20) dress = '建议穿薄外套、长裤';
        else if(data.temp >= 10) dress = '建议穿夹克、卫衣等保暖衣物';
        else dress = '建议穿厚外套、羽绒服等防寒衣物';
        // 紫外线
        let uv = '--';
        if(data.raw && data.raw.uv_index) {
            uv = data.raw.uv_index + '（' + (data.raw.uv_index >= 7 ? '强' : data.raw.uv_index >= 4 ? '中等' : '弱') + '）';
        } else if(data.temp > 25 && data.icon && data.icon.includes('sun')) {
            uv = '较强';
        }
        // 空气质量
        let aqi = '--';
        if(data.raw && (data.raw.aqi || data.raw.air_quality)) {
            aqi = (data.raw.aqi || data.raw.air_quality) + '';
        }
        // 生活建议
        let life = [];
        if(data.temp >= 30) life.push('高温天气，注意防晒补水');
        if(data.temp <= 5) life.push('低温天气，注意防寒保暖');
        if((data.raw && data.raw.humidity > 80) || (data.humidity > 80)) life.push('湿度较大，注意防潮');
        if(data.raw && data.raw.pm25) life.push('PM2.5较高，敏感人群减少外出');
        if(data.raw && data.raw.uv_index >= 7) life.push('紫外线强，外出请涂抹防晒霜');
        if(data.raw && data.raw.tips) life.push(data.raw.tips);
        return {dress, uv, aqi, life: life.join('；')};
    }
    function showWeatherDetailPopup(data) {
        if(document.getElementById('weather-detail-overlay')) return;
        const extra = getExtraSuggestions(data);
        const overlay = document.createElement('div');
        overlay.className = 'weather-detail-overlay';
        overlay.id = 'weather-detail-overlay';
        overlay.innerHTML = `
            <div class="weather-detail-popup">
                <button class="weather-detail-close" title="关闭">×</button>
                <button class="weather-detail-refresh" title="刷新" style="position:absolute;right:54px;top:16px;background:none;border:none;font-size:22px;color:#4caf50;cursor:pointer;border-radius:50%;transition:background 0.18s, color 0.18s;">⟳</button>
                <div class="weather-detail-header">
                    <span class="weather-detail-icon"><i class="fa-solid ${data.icon||'fa-sun'}"></i></span>
                    <span class="weather-detail-title">${data.city||'--'} 天气详情</span>
                </div>
                <div class="weather-detail-info">
                    <div class="weather-detail-info-item">温度：${data.temp}℃</div>
                    <div class="weather-detail-info-item">湿度：${data.humidity||'--'}%</div>
                    <div class="weather-detail-info-item">风力：${data.wind_power||'--'}</div>
                    <div class="weather-detail-info-item">风向：${data.wind_direction||'--'}</div>
                    <div class="weather-detail-info-item">紫外线：${extra.uv}</div>
                    <div class="weather-detail-info-item">空气质量：${extra.aqi}</div>
                </div>
                <div class="weather-detail-desc">${data.description||''}</div>
                <div class="weather-detail-desc"><b>穿衣建议：</b>${extra.dress}</div>
                <div class="weather-detail-desc"><b>生活建议：</b>${extra.life||'--'}</div>
                <div style="text-align:right;margin-top:10px;">
                    <button id="weather-detail-copy-btn" style="background:#4caf50;color:#fff;border:none;border-radius:6px;padding:6px 18px;font-size:15px;cursor:pointer;">复制建议</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // 关闭逻辑
        overlay.querySelector('.weather-detail-close').onclick = function(e){
            e.stopPropagation();
            overlay.remove();
        };
        overlay.onclick = function(e){
            if(e.target===overlay) overlay.remove();
        };
        // 刷新按钮
        overlay.querySelector('.weather-detail-refresh').onclick = function(e){
            e.stopPropagation();
            if(window.SimpleWeatherManager) window.SimpleWeatherManager.refreshWeather();
            overlay.remove();
        };
        // 复制建议
        overlay.querySelector('#weather-detail-copy-btn').onclick = function(){
            const text = `【${data.city||''}天气】\n${data.temp}℃，湿度${data.humidity||'--'}%，风力${data.wind_power||'--'}，风向${data.wind_direction||'--'}\n${data.description||''}\n穿衣建议：${extra.dress}\n生活建议：${extra.life||'--'}`;
            if(navigator.clipboard){
                navigator.clipboard.writeText(text);
                this.textContent = '已复制！';
                setTimeout(()=>{this.textContent='复制建议';}, 1200);
            }else{
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                this.textContent = '已复制！';
                setTimeout(()=>{this.textContent='复制建议';}, 1200);
            }
        };
    }
    // 挂载到全局，供simple-weather调用
    window.showWeatherDetailPopup = showWeatherDetailPopup;
})();

document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('weather-card-btn');
    if(btn){
        btn.addEventListener('click', function(){
            if(window.SimpleWeatherManager && SimpleWeatherManager.weatherData){
                // 组装详情数据
                const data = SimpleWeatherManager.weatherData;
                const icon = (window.SimpleWeatherManager.travelTips[data.condition]?.icon) || 'fa-sun';
                const detail = Object.assign({}, data, {
                    icon,
                    humidity: data.humidity || (data.raw && data.raw.humidity) || '--',
                    wind_power: data.wind_power || (data.raw && data.raw.wind_power) || '--',
                    wind_direction: data.wind_direction || (data.raw && data.raw.wind_direction) || '--',
                });
                window.showWeatherDetailPopup && window.showWeatherDetailPopup(detail);
            }else{
                alert('天气数据暂未加载，请稍后再试');
            }
        });
    }
}); 