// app.js - Aplicación principal XRP Trading Monitor Pro

class XRPTradingApp {
    constructor() {
        this.currentTimeframe = 1;
        this.currentPrice = 0;
        this.previousPrice = 0;
        this.updateInterval = null;
        this.priceData = [];
        this.isInitialized = false;
        this.lastUpdate = null;
        
        // Referencias a servicios
        this.api = window.apiService;
        this.indicators = window.technicalIndicators;
        this.charts = window.chartManager;
        this.trading = window.tradingEngine;
        
        // Estado de la aplicación
        this.state = {
            loading: true,
            error: false,
            data: null,
            analysis: null,
            recommendations: null
        };
        
        // Configuración
        this.config = {
            updateInterval: 30000, // 30 segundos
            alertDuration: 5000,   // 5 segundos
            maxRetries: 3,
            animationDuration: 300
        };
    }

    // Inicializar la aplicación
    async initialize() {
        console.log('🚀 Iniciando XRP Trading Monitor Pro...');
        
        try {
            this.showLoading();
            this.setupEventListeners();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Configurar actualizaciones automáticas
            this.startAutoUpdate();
            
            // Mostrar contenido
            this.showContent();
            this.isInitialized = true;
            
            // Alerta de bienvenida
            this.showAlert('🎯 Sistema Iniciado', 'Monitor XRP activo. Datos actualizándose cada 30 segundos.');
            
            console.log('✅ Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            this.showError('Error al inicializar', error.message);
        }
    }

    // Cargar datos iniciales
    async loadInitialData() {
        try {
            console.log('📊 Cargando datos iniciales...');
            
            // Obtener datos del mercado
            const batchData = await this.api.getBatchData(this.currentTimeframe);
            this.state.data = batchData;
            
            // Procesar datos
            await this.processMarketData(batchData);
            
            console.log('✅ Datos iniciales cargados');
            
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            throw error;
        }
    }

    // Procesar datos del mercado
    async processMarketData(data) {
        try {
            // Validar estructura de datos
            if (!data || typeof data !== 'object') {
                throw new Error('Datos de mercado inválidos');
            }

            const { current, historical, market } = data;
            
            // Validar datos históricos
            if (!historical || !historical.prices || !Array.isArray(historical.prices)) {
                console.warn('⚠️ Datos históricos inválidos, usando fallback');
                this.priceData = this.generateFallbackPrices();
            } else {
                this.priceData = historical.prices;
            }

            // Validar datos actuales
            let currentData = {};
            if (current && current.ripple) {
                currentData = current.ripple;
            } else if (current && typeof current === 'object') {
                currentData = current;
            } else {
                console.warn('⚠️ Datos actuales inválidos, generando fallback');
                currentData = this.generateFallbackCurrentData();
            }

            this.currentPrice = currentData.usd || 0;
            
            // Realizar análisis técnico solo si hay datos válidos
            console.log('🔍 Realizando análisis técnico...');
            if (this.priceData.length > 0) {
                this.state.analysis = this.indicators.getCompleteAnalysis(this.priceData);
            } else {
                this.state.analysis = this.getDefaultAnalysis();
            }
            
            // Generar señales de trading
            console.log('💡 Generando señales de trading...');
            const signals = this.trading.analyzeSignals(this.priceData, this.state.analysis);
            
            // Generar recomendaciones
            console.log('🎯 Generando recomendaciones...');
            this.state.recommendations = this.trading.generateRecommendations(
                this.priceData, 
                currentData, 
                this.state.analysis
            );
            
            // Calcular soporte y resistencia
            const supportResistance = this.trading.calculateSupportResistance(this.priceData);
            
            // Actualizar UI
            this.updateUI(currentData, this.state.analysis, this.state.recommendations, supportResistance);
            
            // Verificar alertas
            this.checkAlerts(currentData);
            
        } catch (error) {
            console.error('❌ Error procesando datos:', error);
            throw error;
        }
    }

    // Actualizar interfaz de usuario
    updateUI(currentData, analysis, recommendations, supportResistance) {
        try {
            // Actualizar estadísticas principales
            this.updateStats(currentData);
            
            // Actualizar gráfico principal
            if (this.state.data && this.state.data.historical) {
                this.charts.updatePriceChart(this.state.data.historical, this.currentTimeframe);
            }
            
            // Actualizar indicadores técnicos
            this.updateIndicators(analysis);
            
            // Actualizar señales de trading
            this.updateTradingSignals();
            
            // Actualizar recomendaciones
            this.updateRecommendations(recommendations);
            
            // Actualizar libro de órdenes (simulado)
            this.updateOrderBook();
            
            // Actualizar niveles de soporte/resistencia
            this.updateSupportResistance(supportResistance);
            
            // Actualizar timestamp
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('❌ Error actualizando UI:', error);
        }
    }

    // Actualizar estadísticas principales
    updateStats(data) {
        try {
            const currentPrice = data.usd || 0;
            const change24h = data.usd_24h_change || 0;
            const volume24h = data.usd_24h_vol || 0;
            const marketCap = data.usd_market_cap || 0;
            const high24h = data.usd_24h_high || currentPrice;
            const low24h = data.usd_24h_low || currentPrice;

            // Precio actual
            document.getElementById('current-price').textContent = `$${currentPrice.toFixed(4)}`;
            
            // Cambio de precio
            const changeElement = document.getElementById('change-percent');
            const arrowElement = document.getElementById('change-arrow');
            const priceCard = document.getElementById('price-card');
            
            changeElement.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
            
            // Actualizar estilos según cambio
            priceCard.classList.remove('positive', 'negative');
            if (change24h > 0) {
                changeElement.className = 'positive';
                arrowElement.textContent = '↑';
                arrowElement.className = 'positive';
                priceCard.classList.add('positive');
            } else if (change24h < 0) {
                changeElement.className = 'negative';
                arrowElement.textContent = '↓';
                arrowElement.className = 'negative';
                priceCard.classList.add('negative');
            } else {
                changeElement.className = '';
                arrowElement.textContent = '→';
                arrowElement.className = '';
            }
            
            // Otras estadísticas
            document.getElementById('volume-24h').textContent = `$${this.formatNumber(volume24h)}`;
            document.getElementById('market-cap').textContent = `$${this.formatNumber(marketCap)}`;
            document.getElementById('high-24h').textContent = `$${high24h.toFixed(4)}`;
            document.getElementById('low-24h').textContent = `$${low24h.toFixed(4)}`;
            
            // Distancias desde máximo y mínimo
            const highDistance = ((currentPrice - high24h) / high24h * 100);
            const lowDistance = ((currentPrice - low24h) / low24h * 100);
            
            document.getElementById('high-distance').textContent = `${highDistance.toFixed(2)}%`;
            document.getElementById('low-distance').textContent = `${lowDistance.toFixed(2)}%`;
            
        } catch (error) {
            console.error('❌ Error actualizando estadísticas:', error);
        }
    }

    // Actualizar indicadores técnicos
    updateIndicators(analysis) {
        try {
            if (!analysis) return;
            
            // RSI
            const rsiElement = document.getElementById('rsi-value');
            const rsiDesc = document.getElementById('rsi-desc');
            rsiElement.textContent = analysis.rsi.toFixed(2);
            
            if (analysis.rsi > 70) {
                rsiElement.className = 'indicator-value negative';
                rsiDesc.textContent = 'Sobrecomprado - Posible corrección bajista';
            } else if (analysis.rsi < 30) {
                rsiElement.className = 'indicator-value positive';
                rsiDesc.textContent = 'Sobrevendido - Posible rebote alcista';
            } else {
                rsiElement.className = 'indicator-value';
                rsiDesc.textContent = 'Zona neutral - Sin señales claras';
            }
            
            // MACD
            const macdElement = document.getElementById('macd-value');
            const macdDesc = document.getElementById('macd-desc');
            macdElement.textContent = analysis.macd.histogram.toFixed(4);
            
            if (analysis.macd.histogram > 0) {
                macdElement.className = 'indicator-value positive';
                macdDesc.textContent = 'Señal alcista - Momentum positivo';
            } else {
                macdElement.className = 'indicator-value negative';
                macdDesc.textContent = 'Señal bajista - Momentum negativo';
            }
            
            // Bollinger Bands
            const bbElement = document.getElementById('bb-value');
            const bbDesc = document.getElementById('bb-desc');
            const position = analysis.bollingerBands.position;
            bbElement.textContent = `${position.toFixed(1)}%`;
            
            if (position > 80) {
                bbDesc.textContent = 'Cerca de banda superior - Posible resistencia';
            } else if (position < 20) {
                bbDesc.textContent = 'Cerca de banda inferior - Posible soporte';
            } else {
                bbDesc.textContent = 'En zona media - Tendencia estable';
            }
            
            // Estocástico
            const stochElement = document.getElementById('stoch-value');
            const stochDesc = document.getElementById('stoch-desc');
            stochElement.textContent = `${analysis.stochastic.k.toFixed(1)} / ${analysis.stochastic.d.toFixed(1)}`;
            
            switch (analysis.stochastic.signal) {
                case 'overbought':
                    stochDesc.textContent = 'Zona de sobrecompra - Precaución';
                    break;
                case 'oversold':
                    stochDesc.textContent = 'Zona de sobreventa - Oportunidad';
                    break;
                default:
                    stochDesc.textContent = 'Zona neutral';
            }
            
            // Actualizar mini gráficos
            this.charts.updateIndicatorCharts(analysis);
            
        } catch (error) {
            console.error('❌ Error actualizando indicadores:', error);
        }
    }

    // Actualizar señales de trading
    updateTradingSignals() {
        try {
            const signals = this.trading.signals || [];
            const container = document.getElementById('trading-signals-container');
            
            if (signals.length === 0) {
                container.innerHTML = '<div class="signal-card"><div class="signal-description">Analizando señales...</div></div>';
                return;
            }
            
            const signalsHtml = signals.slice(0, 5).map(signal => `
                <div class="signal-card">
                    <div class="signal-header">
                        <span class="signal-type signal-${signal.type}">${signal.type.toUpperCase()}</span>
                        <div class="signal-strength">
                            ${Array(5).fill(0).map((_, i) => 
                                `<div class="strength-bar ${i < (signal.strength || 0) ? 'active' : ''}"></div>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="signal-title">${signal.title}</div>
                    <div class="signal-description">${signal.description}</div>
                    <div class="signal-action">
                        <span>Fuerza: ${signal.strength || 0}/5</span>
                        <span>${signal.timeframe || 'N/A'}</span>
                        <span>${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = signalsHtml;
            
        } catch (error) {
            console.error('❌ Error actualizando señales:', error);
        }
    }

    // Actualizar recomendaciones
    updateRecommendations(recommendations) {
        try {
            if (!recommendations) return;
            
            // Recomendación principal
            document.getElementById('main-recommendation').textContent = recommendations.recommendation;
            document.getElementById('rec-icon').textContent = recommendations.icon;
            document.getElementById('confidence-score').textContent = `${recommendations.confidence}%`;
            
            // Niveles de trading
            document.getElementById('entry-price').textContent = `$${recommendations.entryPrice.toFixed(4)}`;
            
            const stopLossPercent = ((recommendations.stopLoss - recommendations.entryPrice) / recommendations.entryPrice * 100);
            document.getElementById('stop-loss').textContent = 
                `$${recommendations.stopLoss.toFixed(4)} (${stopLossPercent.toFixed(2)}%)`;
            
            const takeProfitPercent = ((recommendations.takeProfit - recommendations.entryPrice) / recommendations.entryPrice * 100);
            document.getElementById('take-profit').textContent = 
                `$${recommendations.takeProfit.toFixed(4)} (${takeProfitPercent.toFixed(2)}%)`;
            
            document.getElementById('risk-reward').textContent = `1:${recommendations.riskReward.toFixed(2)}`;
            
        } catch (error) {
            console.error('❌ Error actualizando recomendaciones:', error);
        }
    }

    // Actualizar libro de órdenes (simulado)
    updateOrderBook() {
        try {
            const currentPrice = this.currentPrice || 0.5234;
            
            // Generar órdenes simuladas
            const asks = this.generateOrderBook(currentPrice, 'ask', 5);
            const bids = this.generateOrderBook(currentPrice, 'bid', 5);
            
            // Mostrar asks
            const asksHtml = asks.map(order => `
                <div class="order-row ask">
                    <div>$${order.price.toFixed(4)}</div>
                    <div>${this.formatNumber(order.amount)}</div>
                    <div>$${this.formatNumber(order.total)}</div>
                </div>
            `).join('');
            document.getElementById('ask-orders').innerHTML = asksHtml;
            
            // Mostrar bids
            const bidsHtml = bids.map(order => `
                <div class="order-row bid">
                    <div>$${order.price.toFixed(4)}</div>
                    <div>${this.formatNumber(order.amount)}</div>
                    <div>$${this.formatNumber(order.total)}</div>
                </div>
            `).join('');
            document.getElementById('bid-orders').innerHTML = bidsHtml;
            
        } catch (error) {
            console.error('❌ Error actualizando libro de órdenes:', error);
        }
    }

    // Generar libro de órdenes simulado
    generateOrderBook(currentPrice, type, count) {
        const orders = [];
        const spread = 0.001; // 0.1% spread
        
        for (let i = 0; i < count; i++) {
            const multiplier = type === 'ask' ? 
                (1 + spread + (i * spread * 0.5)) : 
                (1 - spread - (i * spread * 0.5));
            
            const price = currentPrice * multiplier;
            const amount = 100000 + Math.random() * 900000;
            const total = price * amount;
            
            orders.push({ price, amount, total });
        }
        
        return orders;
    }

    // Actualizar niveles de soporte y resistencia
    updateSupportResistance(levels) {
        try {
            if (!levels) return;
            
            const { supports, resistances } = levels;
            
            // Soportes
            const supportsHtml = supports.length > 0 ? supports.map(level => `
                <div class="level-item">
                    <div class="level-price">$${level.price.toFixed(4)}</div>
                    <div class="level-details">
                        <span class="level-strength ${this.getStrengthClass(level.strength)}">${level.strength}</span>
                    </div>
                </div>
            `).join('') : '<div class="level-item"><div class="level-price">No hay niveles detectados</div></div>';
            
            document.getElementById('support-levels').innerHTML = supportsHtml;
            
            // Resistencias
            const resistancesHtml = resistances.length > 0 ? resistances.map(level => `
                <div class="level-item">
                    <div class="level-price">$${level.price.toFixed(4)}</div>
                    <div class="level-details">
                        <span class="level-strength ${this.getStrengthClass(level.strength)}">${level.strength}</span>
                    </div>
                </div>
            `).join('') : '<div class="level-item"><div class="level-price">No hay niveles detectados</div></div>';
            
            document.getElementById('resistance-levels').innerHTML = resistancesHtml;
            
        } catch (error) {
            console.error('❌ Error actualizando soporte/resistencia:', error);
        }
    }

    // Método para obtener la clase CSS según la fuerza del nivel
    getStrengthClass(strength) {
        if (!strength) return 'strength-debil';
        
        const strengthLower = strength.toLowerCase();
        if (strengthLower.includes('fuerte') || strengthLower.includes('strong')) {
            return 'strength-fuerte';
        } else if (strengthLower.includes('moderado') || strengthLower.includes('moderate')) {
            return 'strength-moderado';
        } else {
            return 'strength-debil';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        try {
            // Botones de timeframe
            document.querySelectorAll('.time-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    this.handleTimeframeChange(e);
                });
            });
            
            // Redimensionamiento de ventana
            window.addEventListener('resize', () => {
                this.charts.resizeCharts();
            });
            
            // Visibilidad de la página
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseUpdates();
                } else {
                    this.resumeUpdates();
                }
            });
            
        } catch (error) {
            console.error('❌ Error configurando event listeners:', error);
        }
    }

    // Manejar cambio de timeframe
    async handleTimeframeChange(e) {
        try {
            const button = e.target;
            const newTimeframe = parseInt(button.dataset.days);
            
            if (newTimeframe === this.currentTimeframe) return;
            
            // Actualizar UI
            document.querySelectorAll('.time-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            // Actualizar timeframe
            this.currentTimeframe = newTimeframe;
            
            // Mostrar loading temporal
            this.showLoading();
            
            // Cargar nuevos datos
            const newData = await this.api.getBatchData(newTimeframe);
            await this.processMarketData(newData);
            
            // Mostrar contenido
            this.showContent();
            
        } catch (error) {
            console.error('❌ Error cambiando timeframe:', error);
            this.showAlert('Error', 'No se pudo cambiar el período de tiempo');
        }
    }

    // Iniciar actualizaciones automáticas
    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(async () => {
            try {
                await this.updateData();
            } catch (error) {
                console.error('❌ Error en actualización automática:', error);
            }
        }, this.config.updateInterval);
        
        console.log(`⏰ Actualizaciones automáticas cada ${this.config.updateInterval / 1000}s`);
    }

    // Pausar actualizaciones
    pauseUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏸️ Actualizaciones pausadas');
        }
    }

    // Reanudar actualizaciones
    resumeUpdates() {
        if (!this.updateInterval && this.isInitialized) {
            this.startAutoUpdate();
            console.log('▶️ Actualizaciones reanudadas');
        }
    }

    // Actualizar datos
    async updateData() {
        try {
            const newData = await this.api.getBatchData(this.currentTimeframe);
            await this.processMarketData(newData);
            
        } catch (error) {
            console.error('❌ Error actualizando datos:', error);
            // No mostrar error en actualizaciones automáticas, solo log
        }
    }

    // Verificar alertas
    checkAlerts(currentData) {
        try {
            const currentPrice = currentData.usd || 0;
            
            // Verificar cambios significativos de precio
            if (this.previousPrice > 0) {
                const alerts = this.trading.checkPriceAlerts(currentPrice, this.previousPrice);
                alerts.forEach(alert => {
                    this.showAlert(alert.title, alert.message);
                });
            }
            
            this.previousPrice = currentPrice;
            
        } catch (error) {
            console.error('❌ Error verificando alertas:', error);
        }
    }

    // Formatear números
    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    }

    // Actualizar timestamp de última actualización
    updateLastUpdateTime() {
        const now = new Date();
        document.getElementById('update-time').textContent = 
            `Actualizado: ${now.toLocaleTimeString('es-ES')}`;
        this.lastUpdate = now;
    }

    // Mostrar loading
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('error-container').style.display = 'none';
        document.getElementById('main-content').style.display = 'none';
        this.state.loading = true;
        this.state.error = false;
    }

    // Mostrar contenido principal
    showContent() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error-container').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        this.state.loading = false;
        this.state.error = false;
    }

    // Mostrar error
    showError(message, details = '') {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error-container').style.display = 'block';
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-details').textContent = details;
        this.state.loading = false;
        this.state.error = true;
    }

    // Mostrar alerta
    showAlert(title, content) {
        const alertBanner = document.getElementById('alert-banner');
        document.getElementById('alert-title').textContent = title;
        document.getElementById('alert-content').textContent = content;
        
        alertBanner.classList.add('show');
        
        setTimeout(() => {
            alertBanner.classList.remove('show');
        }, this.config.alertDuration);
    }

    // Ocultar alerta
    hideAlert() {
        document.getElementById('alert-banner').classList.remove('show');
    }

    // Toggle para análisis avanzado
    toggleAdvancedAnalysis() {
        try {
            const advancedPanel = document.getElementById('advanced-analysis');
            const toggleButton = document.getElementById('advanced-toggle');
            
            if (!advancedPanel) {
                console.warn('⚠️ Panel de análisis avanzado no encontrado');
                return;
            }
            
            const isHidden = advancedPanel.style.display === 'none' || 
                           window.getComputedStyle(advancedPanel).display === 'none';
            
            if (isHidden) {
                // Mostrar panel
                advancedPanel.style.display = 'block';
                if (toggleButton) {
                    toggleButton.title = 'Ocultar Análisis Avanzado';
                    toggleButton.style.opacity = '1';
                }
                
                // Actualizar datos si hay módulos avanzados disponibles
                this.updateAdvancedAnalysisDisplay();
                
                console.log('🔬 Panel de análisis avanzado mostrado');
            } else {
                // Ocultar panel
                advancedPanel.style.display = 'none';
                if (toggleButton) {
                    toggleButton.title = 'Mostrar Análisis Avanzado';
                    toggleButton.style.opacity = '0.7';
                }
                
                console.log('🔬 Panel de análisis avanzado ocultado');
            }
            
        } catch (error) {
            console.error('❌ Error en toggleAdvancedAnalysis:', error);
        }
    }

    // Actualizar contenido del análisis avanzado
    updateAdvancedAnalysisDisplay() {
        try {
            // Solo actualizar si tenemos módulos avanzados disponibles
            if (!window.advancedModules && !window.advancedIntegration) {
                this.showAdvancedAnalysisPlaceholder();
                return;
            }
            
            // Intentar obtener análisis de los módulos avanzados
            if (window.advancedIntegration && window.advancedIntegration.isInitialized) {
                this.loadAdvancedAnalysisData();
            } else {
                // Mostrar mensaje de carga
                this.showAdvancedAnalysisLoading();
            }
            
        } catch (error) {
            console.error('❌ Error actualizando análisis avanzado:', error);
            this.showAdvancedAnalysisError();
        }
    }

    // Cargar datos de análisis avanzado
    async loadAdvancedAnalysisData() {
        try {
            const modules = window.advancedIntegration.modules;
            
            // Análisis de volatilidad
            if (modules.volatility) {
                const volData = await modules.volatility.getCurrentAnalysis?.() || {};
                this.setElementText('volatility-current', volData.current || 'Calculando...');
                this.setElementText('volatility-trend', volData.trend || 'Analizando...');
                this.setElementText('volatility-risk', volData.riskLevel || 'Evaluando...');
            }
            
            // Actividad de ballenas
            if (modules.whales) {
                const whaleData = await modules.whales.getLatestActivity?.() || {};
                this.setElementText('whale-signals', whaleData.signalCount || '0');
                this.setElementText('whale-confidence', whaleData.confidence || 'Analizando...');
                this.setElementText('whale-impact', whaleData.marketImpact || 'Evaluando...');
            }
            
            // Arbitraje
            if (modules.arbitrage) {
                const arbData = await modules.arbitrage.getOpportunities?.() || {};
                this.setElementText('arbitrage-count', arbData.count || '0');
                this.setElementText('arbitrage-max-profit', arbData.maxProfit || 'Calculando...');
            }
            
            // Portfolio
            if (modules.portfolio) {
                const portfolioData = await modules.portfolio.getCurrentStats?.() || {};
                this.setElementText('portfolio-performance', portfolioData.performance || 'Evaluando...');
                this.setElementText('portfolio-risk', portfolioData.risk || 'Analizando...');
            }
            
        } catch (error) {
            console.error('❌ Error cargando datos de análisis avanzado:', error);
            this.showAdvancedAnalysisError();
        }
    }

    // Mostrar placeholder cuando no hay módulos avanzados
    showAdvancedAnalysisPlaceholder() {
        const elements = {
            'volatility-current': 'No disponible',
            'volatility-trend': 'Módulo no cargado',
            'volatility-risk': 'N/A',
            'whale-signals': '0',
            'whale-confidence': 'No disponible',
            'whale-impact': 'N/A',
            'arbitrage-count': '0',
            'arbitrage-max-profit': 'No disponible',
            'portfolio-performance': 'No disponible',
            'portfolio-risk': 'N/A'
        };
        
        Object.entries(elements).forEach(([id, text]) => {
            this.setElementText(id, text);
        });
    }

    // Mostrar mensaje de carga
    showAdvancedAnalysisLoading() {
        const elements = {
            'volatility-current': 'Cargando...',
            'volatility-trend': 'Analizando...',
            'volatility-risk': 'Calculando...',
            'whale-signals': 'Detectando...',
            'whale-confidence': 'Analizando...',
            'whale-impact': 'Evaluando...',
            'arbitrage-count': 'Buscando...',
            'arbitrage-max-profit': 'Calculando...',
            'portfolio-performance': 'Evaluando...',
            'portfolio-risk': 'Analizando...'
        };
        
        Object.entries(elements).forEach(([id, text]) => {
            this.setElementText(id, text);
        });
    }

    // Mostrar mensaje de error
    showAdvancedAnalysisError() {
        const elements = {
            'volatility-current': 'Error',
            'volatility-trend': 'Error de cálculo',
            'volatility-risk': 'Error',
            'whale-signals': 'Error',
            'whale-confidence': 'Error de análisis',
            'whale-impact': 'Error',
            'arbitrage-count': 'Error',
            'arbitrage-max-profit': 'Error de cálculo',
            'portfolio-performance': 'Error',
            'portfolio-risk': 'Error'
        };
        
        Object.entries(elements).forEach(([id, text]) => {
            this.setElementText(id, text);
        });
    }

    // Utility method para establecer texto de elemento
    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    // Reintentar conexión
    async retryConnection() {
        console.log('🔄 Reintentando conexión...');
        try {
            this.showLoading();
            await this.loadInitialData();
            this.showContent();
            this.showAlert('✅ Conexión Restaurada', 'Datos actualizados correctamente');
        } catch (error) {
            console.error('❌ Error en reintento:', error);
            this.showError('Error de conexión', 'No se pudo conectar con el servidor. Verifique su conexión a internet.');
        }
    }

    // Obtener estado de la aplicación
    getState() {
        return {
            ...this.state,
            currentTimeframe: this.currentTimeframe,
            currentPrice: this.currentPrice,
            isInitialized: this.isInitialized,
            lastUpdate: this.lastUpdate
        };
    }

    // Destruir aplicación
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.charts.destroyAllCharts();
        this.indicators.clearCache();
        
        console.log('🛑 Aplicación destruida');
    }

    // ========== MÉTODOS DE FALLBACK ==========

    // Generar precios de fallback cuando no hay datos históricos
    generateFallbackPrices() {
        const now = Date.now();
        const prices = [];
        let currentPrice = 0.6; // Precio base de $0.60
        
        // Generar 24 puntos (1 hora cada uno)
        for (let i = 23; i >= 0; i--) {
            const timestamp = now - (i * 3600000); // 1 hora en ms
            // Pequeña variación aleatoria
            currentPrice += (Math.random() - 0.5) * 0.02;
            currentPrice = Math.max(0.4, Math.min(0.8, currentPrice)); // Entre $0.40 y $0.80
            
            prices.push([timestamp, parseFloat(currentPrice.toFixed(6))]);
        }
        
        console.log('🎭 Generados precios de fallback:', prices.length, 'puntos');
        return prices;
    }

    // Generar datos actuales de fallback
    generateFallbackCurrentData() {
        const basePrice = 0.6;
        const change = (Math.random() - 0.5) * 0.1; // ±5% cambio
        
        return {
            usd: parseFloat(basePrice.toFixed(6)),
            usd_market_cap: Math.round(basePrice * 55000000000),
            usd_24h_vol: Math.round(1500000000 + Math.random() * 1000000000),
            usd_24h_change: parseFloat((change * 100).toFixed(2)),
            last_updated_at: Math.floor(Date.now() / 1000)
        };
    }

    // Análisis técnico por defecto cuando no hay datos suficientes
    getDefaultAnalysis() {
        return {
            rsi: 50,
            macd: { value: 0, signal: 0, histogram: 0 },
            bollinger: { upper: 0.65, middle: 0.6, lower: 0.55 },
            sma: { sma20: 0.6, sma50: 0.59 },
            trend: 'neutral',
            signals: {
                buy: [],
                sell: [],
                neutral: ['No hay datos suficientes para análisis']
            }
        };
    }
}

// Inicializar aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global de la aplicación
    window.app = new XRPTradingApp();
    
    // Verificar que todos los servicios estén disponibles
    if (window.apiService && window.technicalIndicators && window.chartManager && window.tradingEngine) {
        window.app.initialize();
    } else {
        console.error('❌ Error: No todos los servicios están disponibles');
        setTimeout(() => {
            if (window.app) {
                window.app.showError('Error de Carga', 'No se pudieron cargar todos los módulos necesarios');
            }
        }, 1000);
    }
});

// Manejar errores globales
window.addEventListener('error', (event) => {
    console.error('❌ Error global:', event.error);
    if (window.app && !window.app.state.loading) {
        window.app.showAlert('⚠️ Error', 'Se detectó un error en la aplicación');
    }
});

// Cleanup al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.destroy();
    }
});
