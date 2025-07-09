/**
 * 简化出行建议管理器
 * 在最近要做标题旁边显示简化的出行建议
 */
const SimpleWeatherManager = {
    // 天气数据缓存
    weatherData: null,
    
    // 当前位置
    currentLocation: '无',
    
    // 出行建议模板
    travelTips: {
        sunny: {
            icon: 'fa-sun',
            tips: ['天气晴朗，适合出行', '记得防晒', '可以户外活动']
        },
        cloudy: {
            icon: 'fa-cloud',
            tips: ['天气多云', '适合外出']
        },
        rainy: {
            icon: 'fa-cloud-showers-heavy',
            tips: ['今天有雨', '记得带伞', '注意路滑']
        },
        snowy: {
            icon: 'fa-snowflake',
            tips: ['今天下雪', '注意保暖', '小心路滑']
        },
        foggy: {
            icon: 'fa-smog',
            tips: ['今天有雾', '注意安全', '谨慎驾驶']
        },
        windy: {
            icon: 'fa-wind',
            tips: ['今天有风', '注意保暖', '小心高空坠物']
        }
    },

    /**
     * 初始化简化出行建议
     */
    init() {
        console.log('初始化简化出行建议...');
        
        try {
            this.createSimpleWeather();
            this.bindEvents();
            this.loadWeatherData();
            
            // 每五分钟更新一次天气数据（与原本天气管理器保持一致）
            setInterval(() => this.loadWeatherData(), 5 * 60 * 1000);
            
            console.log('简化出行建议初始化完成');
        } catch (error) {
            console.error('简化出行建议初始化失败:', error);
        }
    },

    /**
     * 创建简化出行建议元素
     */
    createSimpleWeather() {
        // 查找最近要做视图的标题区域
        const recentTasksSection = document.getElementById('recent-tasks');
        if (!recentTasksSection) {
            console.error('找不到最近要做视图，无法创建简化出行建议');
            return;
        }

        // 检查是否已经存在简化出行建议
        if (document.querySelector('.simple-weather-container')) {
            console.log('简化出行建议已存在，跳过创建');
            return;
        }

        const viewHeader = recentTasksSection.querySelector('.view-header');
        if (!viewHeader) {
            console.error('找不到视图标题，无法创建简化出行建议');
            return;
        }

        // 创建简化出行建议容器
        const simpleWeatherContainer = document.createElement('div');
        simpleWeatherContainer.className = 'simple-weather-container';
        simpleWeatherContainer.innerHTML = `
            <div class="simple-weather-icon"><i class="fa-solid fa-sun"></i></div>
            <div class="simple-weather-text">正在获取出行建议...</div>
            <div class="simple-weather-temp">--℃</div>
        `;

        // 将简化出行建议插入到标题旁边（在view-controls之前）
        const viewControls = viewHeader.querySelector('.view-controls');
        if (viewControls) {
            viewHeader.insertBefore(simpleWeatherContainer, viewControls);
        } else {
            viewHeader.appendChild(simpleWeatherContainer);
        }
        
        console.log('简化出行建议元素创建完成');
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        const container = document.querySelector('.simple-weather-container');
        if (container) {
            // 点击刷新天气
            container.addEventListener('click', () => {
                this.refreshWeather();
            });

            // 点击弹出天气详情
            container.addEventListener('click', () => {
                if (!this.weatherData) return;
                // 组装详情数据
                const icon = this.travelTips[this.weatherData.condition]?.icon || 'fa-sun';
                const detail = Object.assign({}, this.weatherData, {
                    icon,
                    humidity: this.weatherData.humidity || (this.weatherData.raw && this.weatherData.raw.humidity) || '--',
                    wind_power: this.weatherData.wind_power || (this.weatherData.raw && this.weatherData.raw.wind_power) || '--',
                    wind_direction: this.weatherData.wind_direction || (this.weatherData.raw && this.weatherData.raw.wind_direction) || '--',
                });
                if(window.showWeatherDetailPopup) window.showWeatherDetailPopup(detail);
            });
        }
    },

    /**
     * 加载天气数据
     */
    async loadWeatherData() {
        const container = document.querySelector('.simple-weather-container');
        if (!container) return;

        // 直接显示加载图标（无动画）
        container.querySelector('.simple-weather-icon').innerHTML = '<i class="fa-solid fa-rotate"></i>';

        try {
            await this.getCurrentLocation();
            const weatherData = await this.fetchWeatherData();
            this.updateWeatherDisplay(weatherData);
            this.weatherData = weatherData;
        } catch (error) {
            console.error('获取天气数据失败:', error);
            this.showErrorState();
        }
    },

    /**
     * 获取当前位置信息
     */
    async getCurrentLocation() {
        // 尝试从本地存储获取上次的位置设置
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            this.currentLocation = savedLocation;
            return;
        }

        // 本地无城市，先用IP定位
        try {
            const response = await fetch('https://uapis.cn/api/myip.php');
            const data = await response.json();
            console.log('IP定位API返回：', data);
            
            // 兼容返回类型和字段
            let city = '';
            if (typeof data.city === 'string') {
                city = data.city;
            } else if (typeof data.city === 'number') {
                city = String(data.city);
            } else if (data.region && typeof data.region === 'string') {
                city = data.region;
            }
            
            if (data.code === 200 && city) {
                this.currentLocation = city;
                localStorage.setItem('userLocation', city);
            } else {
                this.currentLocation = '天津市'; // 兜底
            }
        } catch (error) {
            console.error('IP定位API调用失败', error);
            this.currentLocation = '天津市';
        }
    },

    /**
     * 获取天气数据
     */
    async fetchWeatherData() {
        // 使用与原本天气管理器相同的数据源
        const weatherUrl = `https://uapis.cn/api/weather?name=${encodeURIComponent(this.currentLocation)}`;
        
        try {
            const response = await fetch(weatherUrl);
            if (!response.ok) {
                throw new Error('天气数据获取失败，HTTP状态：' + response.status);
            }
            
            const data = await response.json();
            
            if (data.code === 200) {
                // 成功获取数据
                return {
                    temp: data.temperature || data.temp || 0,
                    condition: this.mapWeatherCondition(data.weather || data.wea || ''),
                    description: this.generateTravelTip(data),
                    city: data.city || this.currentLocation,
                    humidity: data.humidity || '',
                    wind_power: data.wind_power || '',
                    wind_direction: data.wind_direction || '',
                    raw: data
                };
            } else if (data.code === 500) {
                throw new Error(`城市"${this.currentLocation}"未找到，请检查城市名称`);
            } else if (data.code === 400) {
                throw new Error('请求内容不能为空');
            } else if (data.code === 0) {
                throw new Error('检测到非法请求，请稍后再试');
            } else {
                throw new Error('获取天气数据失败：' + (data.msg || '未知错误'));
            }
        } catch (error) {
            console.warn('使用模拟天气数据:', error);
            return this.getMockWeatherData();
        }
    },

    /**
     * 映射天气条件到我们的分类
     */
    mapWeatherCondition(weather) {
        const weatherStr = weather.toLowerCase();
        
        if (weatherStr.includes('晴')) {
            return 'sunny';
        } else if (weatherStr.includes('多云') || weatherStr.includes('阴')) {
            return 'cloudy';
        } else if (weatherStr.includes('雨')) {
            return 'rainy';
        } else if (weatherStr.includes('雪')) {
            return 'snowy';
        } else if (weatherStr.includes('雾')) {
            return 'foggy';
        } else if (weatherStr.includes('风')) {
            return 'windy';
        } else {
            return 'cloudy'; // 默认多云
        }
    },

    /**
     * 生成出行建议
     */
    generateTravelTip(weatherData) {
        const weather = weatherData.weather || weatherData.wea || '';
        const temp = weatherData.temperature || weatherData.temp || 0;
        const humidity = parseInt(weatherData.humidity || 0);
        const windDir = weatherData.wind_direction || '';
        const windPower = weatherData.wind_power || '';
        
        let tipText = '';
        
        // 根据天气情况生成贴士
        if (weather.includes('晴')) {
            if (temp > 30) {
                tipText = '天气炎热，注意防晒，多补充水分';
            } else if (temp > 20) {
                tipText = '天气晴朗，适合出行，记得防晒';
            } else if (temp <= 15) {
                tipText = '天气晴朗，早晚较凉，注意保暖';
            } else {
                tipText = '天气晴朗，适合外出活动';
            }
        } else if (weather.includes('多云') || weather.includes('阴')) {
            if (temp < 10) {
                tipText = '天气阴冷，注意保暖，适合室内活动';
            } else if (temp <= 15) {
                tipText = '天气多云，早晚较凉，注意保暖';
            } else {
                tipText = '天气多云，适合外出';
            }
        } else if (weather.includes('雨')) {
            if (weather.includes('小雨')) {
                tipText = '有小雨，记得带伞，注意路滑';
            } else if (weather.includes('中雨') || weather.includes('大雨')) {
                tipText = '有雨，建议减少外出，必须外出请带伞';
            } else {
                tipText = '今天有雨，记得带伞，注意路滑';
            }
        } else if (weather.includes('雪')) {
            tipText = '今天下雪，注意保暖，小心路滑';
        } else if (weather.includes('雾')) {
            tipText = '今天有雾，注意安全，谨慎驾驶';
        } else if (weather.includes('风')) {
            if (windPower.includes('大') || windPower.includes('强')) {
                tipText = '今天有大风，注意安全，小心高空坠物';
            } else {
                tipText = '今天有风';
            }
        } else {
            // 根据温度给出建议
            if (temp > 30) {
                tipText = '天气炎热，注意防暑降温';
            } else if (temp > 20) {
                tipText = '天气适宜，适合外出活动';
            } else if (temp > 15) {
                tipText = '天气较凉，注意添加衣物';
            } else {
                tipText = '天气寒冷，注意保暖';
            }
        }
        
        return tipText || '天气适宜，注意安全';
    },

    /**
     * 获取模拟天气数据（当API不可用时）
     */
    getMockWeatherData() {
        const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        const temp = Math.floor(Math.random() * 30) + 5; // 5-35度

        return {
            temp: temp,
            condition: randomCondition,
            description: this.travelTips[randomCondition].tips[0],
            city: '当前位置'
        };
    },

    /**
     * 更新天气显示
     */
    updateWeatherDisplay(weatherData) {
        const container = document.querySelector('.simple-weather-container');
        if (!container) return;

        const iconElement = container.querySelector('.simple-weather-icon');
        const textElement = container.querySelector('.simple-weather-text');
        const tempElement = container.querySelector('.simple-weather-temp');

        // 根据天气条件选择图标和提示
        const tipData = this.travelTips[weatherData.condition] || this.travelTips.cloudy;
        
        // 更新显示内容
        iconElement.innerHTML = `<i class="fa-solid ${tipData.icon}"></i>`;
        textElement.textContent = weatherData.description || tipData.tips[0];
        tempElement.textContent = `${Math.round(weatherData.temp)}℃`;

        // 移除错误状态
        container.classList.remove('error');
    },

    /**
     * 显示错误状态
     */
    showErrorState() {
        const container = document.querySelector('.simple-weather-container');
        if (!container) return;

        const iconElement = container.querySelector('.simple-weather-icon');
        const textElement = container.querySelector('.simple-weather-text');
        const tempElement = container.querySelector('.simple-weather-temp');

        iconElement.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        textElement.textContent = '天气信息获取失败';
        tempElement.textContent = '';

        container.classList.add('error');
    },

    /**
     * 刷新天气
     */
    refreshWeather() {
        console.log('刷新天气数据...');
        this.loadWeatherData();
    },

    /**
     * 销毁简化出行建议
     */
    destroy() {
        const container = document.querySelector('.simple-weather-container');
        if (container) {
            container.remove();
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待页面完全加载后初始化简化天气管理器
    setTimeout(() => {
        console.log('开始初始化简化天气管理器');
        SimpleWeatherManager.init();
    }, 1000);
});

// 导出到全局作用域
window.SimpleWeatherManager = SimpleWeatherManager; 