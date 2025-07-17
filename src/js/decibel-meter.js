/**
 * 分贝仪功能模块
 * 使用Web Audio API实现分贝测量
 */

class DecibelMeter {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isRecording = false;
        this.animationId = null;
        this.calibrationOffset = 0; // 校准偏移量
        
        this.init();
    }
    
    /**
     * 初始化分贝仪
     */
    init() {
        this.bindEvents();
        this.updateStatus('点击开始测量');
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 分贝仪按钮点击事件
        const btn = document.getElementById('decibel-meter-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                this.showModal();
            });
        }
        
        // 模态框关闭事件
        const closeBtn = document.getElementById('decibel-meter-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        // 点击模态框背景关闭
        const modal = document.getElementById('decibel-meter-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }
        
        // 开始测量按钮
        const startBtn = document.getElementById('decibel-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startMeasurement();
            });
        }
        
        // 停止测量按钮
        const stopBtn = document.getElementById('decibel-stop-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopMeasurement();
            });
        }
    }
    
    /**
     * 显示分贝仪模态框（自动隐藏底部栏）
     */
    showModal() {
        const modal = document.getElementById('decibel-meter-modal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            // 隐藏底部栏
            const bottomNav = document.querySelector('.bottom-nav-new, .bottom-nav');
            if (bottomNav) bottomNav.style.display = 'none';
        }
    }

    /**
     * 隐藏分贝仪模态框（恢复底部栏显示）
     */
    hideModal() {
        const modal = document.getElementById('decibel-meter-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            // 恢复底部栏
            const bottomNav = document.querySelector('.bottom-nav-new, .bottom-nav');
            if (bottomNav) bottomNav.style.display = '';
            // 如果正在测量，停止测量
            if (this.isRecording) {
                this.stopMeasurement();
            }
        }
    }
    
    /**
     * 开始测量（增加最高/最低值重置）
     */
    async startMeasurement() {
        try {
            // 请求麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            });
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            this.microphone.connect(this.analyser);
            this.isRecording = true;
            this.updateUIForRecording(true);
            this.updateStatus('正在测量中...');

            // 最高/最低值初始化
            this._minDb = null;
            this._maxDb = null;
            this.updateExtremes('--', '--');

            // 开始动画循环
            this.measureLoop();
        } catch (error) {
            console.error('无法访问麦克风:', error);
            this.updateStatus('无法访问麦克风，请检查权限设置');
            this.showError('麦克风访问失败', '请确保已授予麦克风权限，并刷新页面重试。');
        }
    }

    /**
     * 停止测量
     */
    stopMeasurement() {
        this.isRecording = false;
        
        // 停止动画循环
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 关闭音频流
        if (this.microphone && this.microphone.mediaStream) {
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        // 关闭音频上下文
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.updateUIForRecording(false);
        this.updateStatus('测量已停止');
        this.updateDecibelValue('--');
        this.updateMeterFill(0);
        this.updateExtremes('--', '--'); // 停止时重置最高/最低值
    }

    /**
     * 测量循环（更平稳：加大平滑+限制刷新频率+只显示整数+最高最低值）
     */
    measureLoop() {
        if (!this.isRecording || !this.analyser) return;

        const bufferLength = this.analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        // 归一化到-1~1
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
        }
        let rms = Math.sqrt(sum / bufferLength);

        // 平滑（0.7历史+0.3新值）
        if (!this._lastRms) this._lastRms = rms;
        rms = this._lastRms = this._lastRms * 0.7 + rms * 0.3;

        // 噪音门限，低于0.02认为是极静环境
        if (rms < 0.02) rms = 0.01 + Math.random() * 0.005;

        // 分贝计算
        let db = 20 * Math.log10(rms / 0.01);
        db = Math.max(0, Math.min(120, db * 1.8 + 40));

        // 限制UI刷新频率（每150ms刷新一次）
        const now = Date.now();
        if (!this._lastUpdate || now - this._lastUpdate > 150) {
            this._lastUpdate = now;
            const dbInt = Math.round(db);
            this.updateDecibelValue(dbInt);
            this.updateMeterFill(dbInt);
            this.updateStatus(this.getDecibelDescription(dbInt));

            // 最高/最低值逻辑
            if (typeof dbInt === 'number' && !isNaN(dbInt)) {
                if (this._minDb === null || dbInt < this._minDb) this._minDb = dbInt;
                if (this._maxDb === null || dbInt > this._maxDb) this._maxDb = dbInt;
                this.updateExtremes(this._minDb, this._maxDb);
            }
        }

        // 继续循环
        this.animationId = requestAnimationFrame(() => {
            this.measureLoop();
        });
    }
    
    /**
     * 计算分贝值
     * @param {Uint8Array} dataArray 频率数据
     * @returns {number} 分贝值
     */
    calculateDecibel(dataArray) {
        // 计算RMS（均方根）
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        
        // 转换为分贝值
        // 使用更准确的分贝计算公式
        // 参考值：0dB = 20μPa，120dB = 20Pa
        // 将0-255的字节值映射到0-120dB
        let decibel = 0;
        if (rms > 0) {
            // 使用对数关系计算分贝值
            // 假设最大音量对应120dB
            const normalizedRms = rms / 255;
            decibel = 20 * Math.log10(normalizedRms) + 120;
        }
        
        // 添加校准偏移量（可以根据设备调整）
        decibel += this.calibrationOffset;
        
        // 限制范围在0-120dB之间
        decibel = Math.max(0, Math.min(120, decibel));
        
        return decibel;
    }
    
    /**
     * 获取分贝描述（按新标准）
     * @param {number} decibel 分贝值
     * @returns {string} 描述文本
     */
    getDecibelDescription(decibel) {
        if (decibel < 20) {
            return '很静，几乎感觉不到（无危害）';
        } else if (decibel < 40) {
            return '安静，犹如轻声说话（无危害）';
        } else if (decibel < 60) {
            return '一般普通室内谈话（无危害）';
        } else if (decibel < 70) {
            return '吵闹，大声喧哗，交通路旁（打扰休息/分神）';
        } else if (decibel < 90) {
            return '很吵，如同施工现场（有损神经细胞/耳朵难受）';
        } else if (decibel < 100) {
            return '吵闹加剧，如同爆裂轰鸣（听力受损/耳部疼痛）';
        } else {
            return '难以忍受（可能失聪/严重危害健康）';
        }
    }
    
    /**
     * 更新分贝值显示
     * @param {string} value 分贝值
     */
    updateDecibelValue(value) {
        const valueElement = document.getElementById('decibel-value');
        if (valueElement) {
            valueElement.textContent = value;
            
            // 根据分贝值设置颜色
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                if (numValue < 30) {
                    valueElement.style.color = '#10b981'; // 绿色
                } else if (numValue < 60) {
                    valueElement.style.color = '#3b82f6'; // 蓝色
                } else if (numValue < 90) {
                    valueElement.style.color = '#f59e0b'; // 橙色
                } else if (numValue < 120) {
                    valueElement.style.color = '#ef4444'; // 红色
                } else {
                    valueElement.style.color = '#dc2626'; // 深红色
                }
            } else {
                valueElement.style.color = ''; // 恢复默认颜色
            }
        }
    }
    
    /**
     * 更新仪表盘填充
     * @param {number} decibel 分贝值
     */
    updateMeterFill(decibel) {
        const fillElement = document.getElementById('meter-fill');
        if (fillElement) {
            const percentage = (decibel / 120) * 100;
            fillElement.style.width = `${percentage}%`;
        }
    }
    
    /**
     * 更新状态显示
     * @param {string} status 状态文本
     */
    updateStatus(status) {
        const statusElement = document.getElementById('decibel-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    /**
     * 更新UI为录制状态
     * @param {boolean} isRecording 是否正在录制
     */
    updateUIForRecording(isRecording) {
        const startBtn = document.getElementById('decibel-start-btn');
        const stopBtn = document.getElementById('decibel-stop-btn');
        
        if (startBtn && stopBtn) {
            if (isRecording) {
                startBtn.style.display = 'none';
                stopBtn.style.display = 'block';
            } else {
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
            }
        }
    }
    
    /**
     * 显示错误信息
     * @param {string} title 标题
     * @param {string} message 消息
     */
    showError(title, message) {
        // 更新状态显示错误信息
        this.updateStatus(`错误: ${message}`);
        
        // 显示更友好的错误提示
        const statusElement = document.getElementById('decibel-status');
        if (statusElement) {
            statusElement.style.color = '#ef4444';
            statusElement.style.borderLeftColor = '#ef4444';
            
            // 3秒后恢复正常颜色
            setTimeout(() => {
                statusElement.style.color = '';
                statusElement.style.borderLeftColor = '';
            }, 3000);
        }
    }

    /**
     * 更新最高/最低分贝值显示
     */
    updateExtremes(min, max) {
        const minEl = document.getElementById('decibel-min');
        const maxEl = document.getElementById('decibel-max');
        if (minEl) minEl.textContent = `最低：${min} dB`;
        if (maxEl) maxEl.textContent = `最高：${max} dB`;
    }
}

// 初始化分贝仪
document.addEventListener('DOMContentLoaded', () => {
    window.decibelMeter = new DecibelMeter();
}); 