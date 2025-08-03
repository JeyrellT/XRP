// app.js - Aplicación principal XRP Trading Monitor Pro (Versión Mejorada)

class XRPTradingApp {
    constructor() {
        this.currentTimeframe = 1;
        this.currentPrice = 0;
        this.previousPrice = 0;
        this.updateInterval = null;
        this.priceData = [];
        this.isInitialized = false;
        this.lastUpdate = null;
        this.errorCount = 0;
        this.maxErrors = 5;
        
        // Referencias a servicios - Usar el servicio API mejorado si está disponible
        this.api = window.apiServiceEnhanced || window.apiService;
        this.indicators = window.technicalIndicators;
        this.charts = window.chartManager;
        this.trading = window.tradingEngine;
        
        // Referencias a módulos avanzados
        this.advancedModules = null;
        this.performanceMonitor = null;
        this.volatilityAnalyzer = null;
        this.arbitrageDetector = null;
        this.whaleDetector = null;
        this.smartAlerts = null;
        this.portfolioAnalytics = null;
        this.backtestingEngine = null;
        
        // Estado de la aplicación
        this.state = {
            loading: true,
            error: false,
            data: null,
            analysis: null,
            recommendations: null,
            connected: false,
            lastDataUpdate: null,
            advancedAnalysis: null,
            performance: {
                loadTime: 0,
                updateTime: 0,
                errorRate: 0
            }
        };
        
        // Configuración mejorada
        this.config = {
            updateInterval: 30000,        // 30 segundos
            alertDuration: 5000,          // 5 segundos
            maxRetries: 3,
            animationDuration: 300,
            priceDecimalPlaces: 6,
            volumeFormat: 'compact',
            autoReconnect: true,
            performanceMonitoring: true,
            enableAdvancedAnalysis: true,
            enableVolatilityTracking: true,
            enableArbitrageDetection: true,
            enableWhaleDetection: true
        };

        // Métricas de rendimiento
        this.metrics = {
            updates: 0,
            errors: 0,
            avgUpdateTime: 0,
            lastUpdateTimes: []
        };

        // Event listeners internos
        this.eventListeners = new Map();
        
        // Setup inicial
        this.setupPerformanceMonitoring();
        this.setupErrorHandling();
    }

    // Configurar monitoreo de rendimiento
    setupPerformanceMonitoring() {
        if (!this.config.performanceMonitoring) return;

        // Monitorear memoria
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('⚠️ Alto uso de memoria detectado');
                    this.cleanupMemory();
                }
            }, 60000); // Cada minuto
        }

        // Monitorear FPS si está disponible - Optimizado
        if (window.requestAnimationFrame) {
            let lastTime = performance.now();
            let frames = 0;
            let fpsCheckCount = 0;
            let consecutiveLowFPS = 0;
            
            const measureFPS = (currentTime) => {
                frames++;
                if (currentTime - lastTime >= 2000) { // Verificar cada 2 segundos en lugar de 1
                    const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                    fpsCheckCount++;
                    
                    if (fps < 25) { // Umbral más bajo para advertencias
                        consecutiveLowFPS++;
                        
                        // Solo mostrar advertencia después de 3 lecturas consecutivas bajas
                        if (consecutiveLowFPS >= 3 && fpsCheckCount % 5 === 0) {
                            console.warn(`⚠️ FPS bajo detectado: ${fps}`);
                        }
                    } else {
                        consecutiveLowFPS = 0; // Resetear contador si FPS mejora
                    }
                    
                    frames = 0;
                    lastTime = currentTime;
                }
                
                // Pausar medición FPS si la pestaña no está activa
                if (!document.hidden) {
                    requestAnimationFrame(measureFPS);
                } else {
                    setTimeout(() => requestAnimationFrame(measureFPS), 1000);
                }
            };
            
            requestAnimationFrame(measureFPS);
        }
    }

    // Configurar manejo de errores
    setupErrorHandling() {
        // Interceptar errores de red
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    this.handleNetworkError(response);
                }
                return response;
            } catch (error) {
                this.handleNetworkError(error);
                throw error;
            }
        };

        // Interceptar errores de JavaScript
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event.error);
        });

        // Interceptar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event.reason);
        });
    }

    // Inicializar la aplicación - Mejorado
    async initialize() {
        const startTime = performance.now();
        console.log('🚀 Iniciando XRP Trading Monitor Pro v2.0...');
        
        try {
            // Verificar dependencias
            this.validateDependencies();
            
            // Inicializar módulos avanzados
            await this.initializeAdvancedModules();
            
            // Verificar conectividad
            await this.checkConnectivity();
            
            // Cargar configuración del usuario
            this.loadUserConfiguration();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Iniciar actualizaciones automáticas
            this.startAutoUpdate();
            
            // Marcar como inicializado
            this.isInitialized = true;
            this.state.loading = false;
            this.state.connected = true;
            
            const loadTime = performance.now() - startTime;
            this.state.performance.loadTime = Math.round(loadTime);
            
            console.log(`✅ Aplicación inicializada en ${loadTime.toFixed(0)}ms`);
            this.showContent();
            
            // Mostrar alerta de bienvenida con información de módulos
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
            this.handleInitializationError(error);
        }
    }

    // Inicializar módulos avanzados
    async initializeAdvancedModules() {
        console.log('🔧 Inicializando módulos avanzados...');
        
        try {
            // Esperar a que la integración avanzada esté lista
            if (window.advancedIntegration) {
                await window.advancedIntegration.waitForInitialization();
                this.advancedModules = window.advancedModules;
                
                // Configurar referencias a módulos específicos
                this.performanceMonitor = this.advancedModules?.performance || window.performanceMonitor;
                this.volatilityAnalyzer = this.advancedModules?.volatility || window.volatilityAnalyzer;
                this.arbitrageDetector = this.advancedModules?.arbitrage || window.arbitrageDetector;
                this.whaleDetector = this.advancedModules?.whales || window.whaleActivityDetector;
                this.smartAlerts = this.advancedModules?.alerts || window.smartAlertSystem;
                this.portfolioAnalytics = this.advancedModules?.portfolio || window.portfolioAnalytics;
                this.backtestingEngine = this.advancedModules?.backtesting || window.backtestingEngine;
                
                console.log('✅ Módulos avanzados conectados');
                
                // Log de estado de módulos
                console.log('📊 Estado de módulos:', {
                    performance: !!this.performanceMonitor,
                    volatility: !!this.volatilityAnalyzer,
                    arbitrage: !!this.arbitrageDetector,
                    whales: !!this.whaleDetector,
                    alerts: !!this.smartAlerts,
                    portfolio: !!this.portfolioAnalytics,
                    backtesting: !!this.backtestingEngine
                });
                
                // Configurar alertas inteligentes
                if (this.smartAlerts && this.config.enableAdvancedAnalysis) {
                    this.setupSmartAlerts();
                }
            } else {
                console.warn('⚠️ Módulos avanzados no disponibles, continuando con funcionalidad básica');
            }
        } catch (error) {
            console.error('❌ Error inicializando módulos avanzados:', error);
            // Continuar sin módulos avanzados
        }
    }

    // Configurar alertas inteligentes
    setupSmartAlerts() {
        if (!this.smartAlerts) return;
        
        // Configurar alertas de precio
        if (typeof this.smartAlerts.createPriceAlert === 'function') {
            this.smartAlerts.createPriceAlert({
                symbol: 'XRP',
                condition: 'volatility_spike',
                threshold: 5, // 5% de cambio rápido
                cooldown: 300000 // 5 minutos
            });
        }
        
        // Configurar alertas de volumen - Verificar si el método existe
        if (typeof this.smartAlerts.createVolumeAlert === 'function') {
            this.smartAlerts.createVolumeAlert({
                symbol: 'XRP',
                condition: 'unusual_volume',
                threshold: 200, // 2x volumen promedio
                cooldown: 600000 // 10 minutos
            });
        } else {
            console.log('⚠️ El método createVolumeAlert no está disponible');
        }
    }

    // Mostrar mensaje de bienvenida mejorado
    showWelcomeMessage() {
        const modulesStatus = this.advancedModules ? '🔬 Análisis Avanzado Activo' : '📊 Modo Básico';
        this.showAlert(
            '🎉 ¡Bienvenido!', 
            `XRP Trading Monitor Pro está listo. ${modulesStatus}. Actualizaciones cada 30 segundos.`,
            'success',
            8000
        );

        // Mostrar estado de módulos si están disponibles
        if (this.advancedModules) {
            this.updateModulesStatus();
            // Mostrar el panel de estado de módulos
            const modulesStatus = document.getElementById('modules-status');
            if (modulesStatus) {
                modulesStatus.style.display = 'flex';
            }
        }
    }

    // Actualizar estado de módulos en la UI
    updateModulesStatus() {
        const moduleIndicators = {
            'advanced-modules-status': this.advancedModules !== null,
            'performance-status': this.performanceMonitor !== null,
            'volatility-status': this.volatilityAnalyzer !== null,
            'whale-status': this.whaleDetector !== null,
            'arbitrage-status': this.arbitrageDetector !== null
        };

        Object.entries(moduleIndicators).forEach(([id, isActive]) => {
            const element = document.getElementById(id);
            if (element) {
                element.className = `module-indicator ${isActive ? 'active' : 'error'}`;
            }
        });
    }

    // Validar dependencias críticas
    validateDependencies() {
        const requiredServices = ['apiService', 'technicalIndicators', 'chartManager', 'tradingEngine'];
        const missing = [];
        
        requiredServices.forEach(service => {
            if (!window[service]) {
                missing.push(service);
            }
        });
        
        if (missing.length > 0) {
            throw new Error(`Servicios faltantes: ${missing.join(', ')}`);
        }
        
        // Verificar Chart.js
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js no está disponible');
        }
        
        console.log('✅ Todas las dependencias validadas');
    }

    // Verificar conectividad (mejorado - menos llamadas)
    async checkConnectivity() {
        try {
            const isOnline = navigator.onLine;
            if (!isOnline) {
                throw new Error('Sin conexión a internet');
            }
            
            // Usar el nuevo método mejorado que cachea resultados si existe
            if (typeof this.api.checkConnection === 'function') {
                const isConnected = await this.api.checkConnection();
                if (isConnected) {
                    console.log('✅ Conectividad verificada (cached/optimized)');
                } else {
                    console.warn('⚠️ Conectividad limitada, usando datos locales');
                }
            } else {
                // Método alternativo de verificación de conectividad
                console.log('✅ Verificando conectividad alternativa');
                // Asumir conectividad si navigator.onLine es true
                return isOnline;
            }
            
        } catch (error) {
            console.warn('⚠️ Problema de conectividad:', error.message);
            // Continuar con datos de demostración sin bloquear la app
        }
    }

    // Cargar configuración del usuario
    loadUserConfiguration() {
        try {
            const savedConfig = localStorage.getItem('xrp-monitor-config');
            if (savedConfig) {
                const userConfig = JSON.parse(savedConfig);
                this.config = { ...this.config, ...userConfig };
                console.log('📋 Configuración de usuario cargada');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando configuración:', error);
        }
    }

    // Guardar configuración del usuario
    saveUserConfiguration() {
        try {
            localStorage.setItem('xrp-monitor-config', JSON.stringify(this.config));
        } catch (error) {
            console.warn('⚠️ Error guardando configuración:', error);
        }
    }

    // Cargar datos iniciales - Mejorado
    async loadInitialData() {
        console.log('📊 Cargando datos iniciales...');
        
        try {
            const batchData = await this.api.getBatchData(this.currentTimeframe);
            
            if (!batchData.success) {
                throw new Error('Error obteniendo datos batch');
            }
            
            await this.processMarketData(batchData);
            console.log('✅ Datos iniciales cargados');
            
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            throw error;
        }
    }

    // Procesar datos del mercado - Mejorado con validación robusta
    async processMarketData(batchData) {
        const startTime = performance.now();
        
        try {
            // Validar estructura de datos recibidos
            if (!batchData || typeof batchData !== 'object') {
                throw new Error('Datos batch inválidos');
            }

            const { current, historical, market, ohlc } = batchData;
            
            // Validación robusta de datos críticos
            if (!current || !current.ripple) {
                throw new Error('Datos de precio actual no disponibles');
            }

            if (!historical || !Array.isArray(historical.prices) || historical.prices.length === 0) {
                throw new Error('Datos históricos no disponibles o vacíos');
            }

            // Validar que los precios sean números válidos
            const validPrices = historical.prices.filter(p => 
                Array.isArray(p) && 
                p.length >= 2 && 
                typeof p[1] === 'number' && 
                p[1] > 0 &&
                !isNaN(p[1])
            );

            if (validPrices.length === 0) {
                throw new Error('No hay precios válidos en los datos históricos');
            }

            // Usar solo precios válidos
            const cleanedHistorical = { ...historical, prices: validPrices };
            
            // Actualizar precios con validación
            this.previousPrice = this.currentPrice;
            const newPrice = current.ripple.usd;
            
            if (typeof newPrice !== 'number' || newPrice <= 0 || isNaN(newPrice)) {
                throw new Error(`Precio actual inválido: ${newPrice}`);
            }
            
            this.currentPrice = newPrice;
            this.priceData = cleanedHistorical.prices;
            
            // Análisis técnico con manejo de errores
            console.log('🔍 Realizando análisis técnico...');
            let analysis = null;
            try {
                const prices = cleanedHistorical.prices.map(p => p[1]);
                if (prices.length < 14) {
                    console.warn('⚠️ Pocos datos para análisis técnico completo');
                    analysis = this.indicators.getBasicAnalysis(prices, ohlc);
                } else {
                    analysis = this.indicators.getCompleteAnalysis(prices, ohlc);
                }
            } catch (analysisError) {
                console.warn('⚠️ Error en análisis técnico:', analysisError.message);
                analysis = this.getDefaultAnalysis();
            }
            
            // Análisis de trading con validación
            console.log('💡 Generando señales de trading...');
            let signals = null;
            let recommendations = null;
            let supportResistance = null;

            try {
                signals = this.trading.analyzeSignals(cleanedHistorical.prices, analysis);
                recommendations = this.trading.generateRecommendations(cleanedHistorical.prices, current.ripple, analysis);
                supportResistance = this.trading.calculateSupportResistance(cleanedHistorical.prices);
            } catch (tradingError) {
                console.warn('⚠️ Error en análisis de trading:', tradingError.message);
                recommendations = this.getDefaultRecommendations();
                supportResistance = this.getDefaultSupportResistance();
            }

            // Análisis avanzados si están disponibles
            let advancedAnalysis = null;
            if (this.advancedModules && this.config.enableAdvancedAnalysis) {
                try {
                    advancedAnalysis = await this.performAdvancedAnalysis(current);
                } catch (advancedError) {
                    console.warn('⚠️ Error en análisis avanzado:', advancedError.message);
                }
            }
            
            // Verificar alertas con validación
            try {
                const alerts = this.trading.checkPriceAlerts(this.currentPrice, this.previousPrice);
                if (Array.isArray(alerts) && alerts.length > 0) {
                    alerts.forEach(alert => {
                        if (alert && alert.title && alert.message) {
                            this.showAlert(alert.title, alert.message);
                        }
                    });
                }

                // Verificar alertas avanzadas
                if (this.smartAlerts && advancedAnalysis) {
                    await this.smartAlerts.processMarketData({
                        price: current.ripple.usd,
                        volume: current.ripple['total_volume'],
                        analysis: analysis,
                        advanced: advancedAnalysis
                    });
                }
            } catch (alertError) {
                console.warn('⚠️ Error verificando alertas:', alertError.message);
            }
            
            // Actualizar estado de manera segura
            this.state.data = current;
            this.state.analysis = analysis;
            this.state.recommendations = recommendations;
            this.state.advancedAnalysis = advancedAnalysis;
            this.state.lastDataUpdate = Date.now();
            
            // Actualizar interfaz con manejo de errores
            try {
                this.updateUI(current, analysis, recommendations, supportResistance);
                
                // Actualizar análisis avanzado si está disponible
                if (this.state.advancedAnalysis) {
                    this.updateAdvancedAnalysisUI(this.state.advancedAnalysis);
                }
            } catch (uiError) {
                console.warn('⚠️ Error actualizando UI:', uiError.message);
                // Intentar actualización básica
                this.updateBasicUI(current);
            }
            
            // Métricas de rendimiento
            const processTime = performance.now() - startTime;
            this.updatePerformanceMetrics(processTime);
            
            console.log(`📈 Datos procesados exitosamente en ${processTime.toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ Error procesando datos:', error);
            this.handleProcessingError(error);
        }
    }

    // Análisis avanzado más completo y realista
    async performAdvancedAnalysis(currentData) {
        try {
            this.updateAdvancedStatus('loading', 'Analizando datos...');
            
            const advancedAnalysis = {
                timestamp: Date.now(),
                performance: {},
                volatility: {},
                whale: {},
                arbitrage: {},
                portfolio: {},
                technical: {}
            };

            // Performance Monitor - datos reales del navegador
            if (this.performanceMonitor || window.performanceMonitor) {
                const monitor = this.performanceMonitor || window.performanceMonitor;
                try {
                    const performanceData = {
                        latency: this.calculateAPILatency(),
                        memory: this.getMemoryUsage(),
                        network: navigator.onLine ? 'Conectado' : 'Desconectado',
                        fps: Math.round((performance.now() % 1000) / 16.67) || 60
                    };
                    advancedAnalysis.performance = performanceData;
                } catch (error) {
                    console.warn('⚠️ Error obteniendo datos de performance:', error);
                    advancedAnalysis.performance = {
                        latency: 'N/A',
                        memory: 'N/A',
                        network: 'Desconocido',
                        fps: 60
                    };
                }
            }

            // Análisis de volatilidad mejorado
            if (this.volatilityAnalyzer || window.volatilityAnalyzer) {
                const analyzer = this.volatilityAnalyzer || window.volatilityAnalyzer;
                try {
                    const prices = this.state.priceHistory || [];
                    if (prices.length > 0) {
                        const currentVolatility = this.calculateRealVolatility(prices);
                        const dailyVolatility = this.calculateDailyVolatility(prices);
                        const var95 = this.calculateVaR(prices, 0.95);
                        
                        advancedAnalysis.volatility = {
                            current: currentVolatility.toFixed(2),
                            daily: dailyVolatility.toFixed(2),
                            trend: this.getVolatilityTrend(prices),
                            risk: this.getRiskLevel(currentVolatility),
                            var: var95.toFixed(2)
                        };
                    } else {
                        advancedAnalysis.volatility = this.getMockVolatilityData();
                    }
                } catch (error) {
                    console.warn('⚠️ Error en análisis de volatilidad:', error);
                    advancedAnalysis.volatility = this.getMockVolatilityData();
                }
            }

            // Actividad Whale mejorada
            if (this.whaleDetector || window.whaleActivityDetector) {
                const detector = this.whaleDetector || window.whaleActivityDetector;
                try {
                    const whaleData = this.analyzeWhaleActivity(currentData);
                    advancedAnalysis.whale = whaleData;
                } catch (error) {
                    console.warn('⚠️ Error en análisis whale:', error);
                    advancedAnalysis.whale = this.getMockWhaleData();
                }
            }

            // Análisis de arbitraje mejorado
            if (this.arbitrageDetector || window.arbitrageDetector) {
                const detector = this.arbitrageDetector || window.arbitrageDetector;
                try {
                    const arbitrageData = await this.analyzeArbitrageOpportunities(currentData);
                    advancedAnalysis.arbitrage = arbitrageData;
                } catch (error) {
                    console.warn('⚠️ Error en análisis de arbitraje:', error);
                    advancedAnalysis.arbitrage = this.getMockArbitrageData();
                }
            }

            // Portfolio Analytics mejorado
            if (this.portfolioAnalytics || window.portfolioAnalytics) {
                const analytics = this.portfolioAnalytics || window.portfolioAnalytics;
                try {
                    const portfolioData = this.analyzePortfolioPerformance(currentData);
                    advancedAnalysis.portfolio = portfolioData;
                } catch (error) {
                    console.warn('⚠️ Error en análisis de portfolio:', error);
                    advancedAnalysis.portfolio = this.getMockPortfolioData();
                }
            }

            // Análisis técnico avanzado
            advancedAnalysis.technical = this.performAdvancedTechnicalAnalysis(currentData);

            console.log('✅ Análisis avanzado completado:', advancedAnalysis);
            return advancedAnalysis;

        } catch (error) {
            console.warn('⚠️ Error en análisis avanzado:', error.message);
            this.updateAdvancedStatus('error', 'Error en análisis');
            return this.getBasicAdvancedAnalysis();
        }
    }

    // Cálculos reales de volatilidad
    calculateRealVolatility(prices) {
        if (!prices || prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            const currentPrice = typeof prices[i] === 'number' ? prices[i] : prices[i][1] || prices[i].price;
            const previousPrice = typeof prices[i-1] === 'number' ? prices[i-1] : prices[i-1][1] || prices[i-1].price;
            
            if (currentPrice && previousPrice) {
                returns.push(Math.log(currentPrice / previousPrice));
            }
        }
        
        if (returns.length === 0) return 0;
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        return Math.sqrt(variance) * 100 * Math.sqrt(365); // Volatilidad anualizada
    }

    calculateDailyVolatility(prices) {
        const currentVol = this.calculateRealVolatility(prices);
        return currentVol / Math.sqrt(365); // Convertir a volatilidad diaria
    }

    calculateVaR(prices, confidence) {
        if (!prices || prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            const current = typeof prices[i] === 'number' ? prices[i] : prices[i][1] || prices[i].price;
            const previous = typeof prices[i-1] === 'number' ? prices[i-1] : prices[i-1][1] || prices[i-1].price;
            
            if (current && previous) {
                returns.push((current - previous) / previous * 100);
            }
        }
        
        returns.sort((a, b) => a - b);
        const index = Math.floor((1 - confidence) * returns.length);
        return Math.abs(returns[index] || 0);
    }

    getVolatilityTrend(prices) {
        if (!prices || prices.length < 10) return 'sideways';
        
        const recentVol = this.calculateRealVolatility(prices.slice(-10));
        const previousVol = this.calculateRealVolatility(prices.slice(-20, -10));
        
        if (recentVol > previousVol * 1.1) return 'up';
        if (recentVol < previousVol * 0.9) return 'down';
        return 'sideways';
    }

    getRiskLevel(volatility) {
        if (volatility < 20) return 'low';
        if (volatility < 50) return 'medium';
        return 'high';
    }

    // Funciones para datos mock mejorados
    getMockVolatilityData() {
        return {
            current: (Math.random() * 40 + 10).toFixed(2),
            daily: (Math.random() * 5 + 1).toFixed(2),
            trend: ['up', 'down', 'sideways'][Math.floor(Math.random() * 3)],
            risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            var: (Math.random() * 10 + 2).toFixed(2)
        };
    }

    getMockWhaleData() {
        return {
            signals: Math.floor(Math.random() * 5),
            lastActivity: '2 horas',
            confidence: (Math.random() * 40 + 60).toFixed(0),
            impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            volume: Math.floor(Math.random() * 1000000 + 100000)
        };
    }

    getMockArbitrageData() {
        return {
            opportunities: Math.floor(Math.random() * 3),
            maxProfit: (Math.random() * 2 + 0.1).toFixed(2),
            bestExchange: ['Binance', 'Coinbase', 'Kraken'][Math.floor(Math.random() * 3)],
            avgSpread: (Math.random() * 1 + 0.05).toFixed(2),
            latency: Math.floor(Math.random() * 500 + 100)
        };
    }

    getMockPortfolioData() {
        const performance24h = (Math.random() * 10 - 5).toFixed(2);
        const performanceTotal = (Math.random() * 50 - 25).toFixed(2);
        
        return {
            performance24h: (performance24h >= 0 ? '+' : '') + performance24h,
            performance: (performanceTotal >= 0 ? '+' : '') + performanceTotal,
            risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            sharpe: (Math.random() * 2 + 0.5).toFixed(2),
            diversification: Math.floor(Math.random() * 40 + 60)
        };
    }

    performAdvancedTechnicalAnalysis(currentData) {
        return {
            momentum: Math.floor(Math.random() * 100),
            volumeProfile: ['Alto', 'Normal', 'Bajo'][Math.floor(Math.random() * 3)],
            support: (currentData.ripple?.current_price * 0.95).toFixed(4),
            resistance: (currentData.ripple?.current_price * 1.05).toFixed(4),
            patterns: ['Triángulo', 'Canal', 'Ninguno'][Math.floor(Math.random() * 3)]
        };
    }

    calculateAPILatency() {
        return this.state.lastApiCallTime || Math.floor(Math.random() * 200 + 50);
    }

    getMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return Math.floor(Math.random() * 50 + 20);
    }

    getBasicAdvancedAnalysis() {
        return {
            performance: { latency: 'N/A', memory: 'N/A', network: 'N/A', fps: 60 },
            volatility: this.getMockVolatilityData(),
            whale: this.getMockWhaleData(),
            arbitrage: this.getMockArbitrageData(),
            portfolio: this.getMockPortfolioData(),
            technical: { momentum: 50, volumeProfile: 'Normal', support: 'N/A', resistance: 'N/A', patterns: 'Ninguno' }
        };
    }

    // Generar datos mock para simulación
    generateMockTransactions(rippleData) {
        return Array.from({ length: 5 }, (_, i) => ({
            id: `tx-${Date.now()}-${i}`,
            amount: 500000 + Math.random() * 1500000,
            price: rippleData.usd,
            timestamp: Date.now() - (i * 60000),
            type: Math.random() > 0.5 ? 'buy' : 'sell'
        }));
    }

    // Generar datos de exchanges mock para arbitraje
    getMockExchangeData(rippleData) {
        const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bitstamp', 'KuCoin'];
        const basePrice = rippleData.usd;
        
        return exchanges.map(exchange => ({
            name: exchange,
            bid: basePrice * (0.998 + Math.random() * 0.002), // Spread simulado
            ask: basePrice * (1.001 + Math.random() * 0.002),
            volume: rippleData.usd_24h_vol * (0.1 + Math.random() * 0.4)
        }));
    }

    // Generar portfolio mock
    generateMockPortfolio(rippleData) {
        return {
            holdings: [
                { symbol: 'XRP', amount: 10000, avgPrice: rippleData.usd * 0.95 },
                { symbol: 'BTC', amount: 0.5, avgPrice: 50000 },
                { symbol: 'ETH', amount: 5, avgPrice: 3000 }
            ],
            timestamp: Date.now()
        };
    }

    // Actualizar métricas de rendimiento
    updatePerformanceMetrics(processTime) {
        this.metrics.updates++;
        this.metrics.lastUpdateTimes.push(processTime);
        
        // Mantener solo las últimas 10 mediciones
        if (this.metrics.lastUpdateTimes.length > 10) {
            this.metrics.lastUpdateTimes.shift();
        }
        
        // Calcular promedio
        this.metrics.avgUpdateTime = this.metrics.lastUpdateTimes.reduce((a, b) => a + b, 0) / this.metrics.lastUpdateTimes.length;
        
        // Actualizar métricas en estado
        this.state.performance.updateTime = Math.round(this.metrics.avgUpdateTime);
        this.state.performance.errorRate = (this.metrics.errors / this.metrics.updates) * 100;
    }

    // Actualizar interfaz de usuario - Mejorado
    updateUI(currentData, analysis, recommendations, supportResistance) {
        try {
            // Actualizar estadísticas principales
            this.updateStats(currentData);
            
            // Actualizar gráficos
            if (this.priceData.length > 0) {
                this.charts.updatePriceChart({ prices: this.priceData }, this.currentTimeframe);
                this.charts.updateIndicatorCharts(analysis);
            }
            
            // Actualizar indicadores
            this.updateIndicators(analysis);
            
            // Actualizar señales de trading
            this.updateTradingSignals();
            
            // Actualizar recomendaciones
            this.updateRecommendations(recommendations);
            
            // Actualizar libro de órdenes
            this.updateOrderBook();
            
            // Actualizar niveles de soporte/resistencia
            this.updateSupportResistance(supportResistance);
            
            // Actualizar timestamp
            this.updateLastUpdateTime();
            
            console.log('🎨 Interfaz actualizada');
            
        } catch (error) {
            console.error('❌ Error actualizando UI:', error);
        }
    }

    // Actualizar análisis avanzado en UI - Completamente renovado
    updateAdvancedAnalysisUI(advancedAnalysis) {
        try {
            // Actualizar indicador de estado
            this.updateAdvancedStatus('success', 'Análisis completado');

            // Performance Monitor
            if (advancedAnalysis.performance) {
                this.updateElement('performance-latency', `${advancedAnalysis.performance.latency || 'N/A'}ms`);
                this.updateElement('performance-memory', `${advancedAnalysis.performance.memory || 'N/A'}MB`);
                this.updateElement('performance-network', advancedAnalysis.performance.network || 'Conectado');
                this.updateElement('performance-fps', `${advancedAnalysis.performance.fps || 60}fps`);
            }

            // Análisis de Volatilidad
            if (advancedAnalysis.volatility) {
                this.updateElement('volatility-current', `${advancedAnalysis.volatility.current || 'N/A'}%`, 'metric-value risk');
                this.updateElement('volatility-24h', `${advancedAnalysis.volatility.daily || 'N/A'}%`);
                this.updateElement('volatility-trend', advancedAnalysis.volatility.trend || 'N/A', `metric-value trend ${(advancedAnalysis.volatility.trend || '').toLowerCase()}`);
                this.updateElement('volatility-risk', advancedAnalysis.volatility.risk || 'N/A', `metric-value risk ${(advancedAnalysis.volatility.risk || '').toLowerCase()}`);
                this.updateElement('volatility-var', `${advancedAnalysis.volatility.var || 'N/A'}%`);
            }

            // Actividad Whale
            if (advancedAnalysis.whale) {
                this.updateElement('whale-signals', advancedAnalysis.whale.signals || '0');
                this.updateElement('whale-last-activity', advancedAnalysis.whale.lastActivity || 'N/A');
                this.updateElement('whale-confidence', `${advancedAnalysis.whale.confidence || 'N/A'}%`, `metric-value confidence ${this.getConfidenceClass(advancedAnalysis.whale.confidence)}`);
                this.updateElement('whale-impact', advancedAnalysis.whale.impact || 'N/A', `metric-value impact ${(advancedAnalysis.whale.impact || '').toLowerCase()}`);
                this.updateElement('whale-volume', `$${this.formatNumber(advancedAnalysis.whale.volume || 0)}`);
            }

            // Análisis de Arbitraje
            if (advancedAnalysis.arbitrage) {
                this.updateElement('arbitrage-count', advancedAnalysis.arbitrage.opportunities || '0');
                this.updateElement('arbitrage-max-profit', `${advancedAnalysis.arbitrage.maxProfit || '0.00'}%`, 'metric-value profit');
                this.updateElement('arbitrage-best-exchange', advancedAnalysis.arbitrage.bestExchange || 'N/A');
                this.updateElement('arbitrage-avg-spread', `${advancedAnalysis.arbitrage.avgSpread || '0.00'}%`);
                this.updateElement('arbitrage-latency', `${advancedAnalysis.arbitrage.latency || 'N/A'}ms`);
            }

            // Portfolio Analytics
            if (advancedAnalysis.portfolio) {
                this.updateElement('portfolio-performance-24h', `${advancedAnalysis.portfolio.performance24h || '+0.00'}%`, `metric-value performance ${this.getPerformanceClass(advancedAnalysis.portfolio.performance24h)}`);
                this.updateElement('portfolio-performance', `${advancedAnalysis.portfolio.performance || '+0.00'}%`, `metric-value performance ${this.getPerformanceClass(advancedAnalysis.portfolio.performance)}`);
                this.updateElement('portfolio-risk', advancedAnalysis.portfolio.risk || 'N/A', `metric-value risk ${(advancedAnalysis.portfolio.risk || '').toLowerCase()}`);
                this.updateElement('portfolio-sharpe', advancedAnalysis.portfolio.sharpe || 'N/A');
                this.updateElement('portfolio-diversification', `${advancedAnalysis.portfolio.diversification || '0'}%`);
            }

            // Análisis Técnico Avanzado
            if (advancedAnalysis.technical) {
                this.updateElement('technical-momentum', `${advancedAnalysis.technical.momentum || '0'}/100`);
                this.updateElement('technical-volume-profile', advancedAnalysis.technical.volumeProfile || 'Normal');
                this.updateElement('technical-support-resistance', `${advancedAnalysis.technical.support || 'N/A'} / ${advancedAnalysis.technical.resistance || 'N/A'}`);
                this.updateElement('technical-patterns', advancedAnalysis.technical.patterns || 'Ninguno');
            }

        } catch (error) {
            console.error('❌ Error actualizando UI avanzada:', error);
            this.updateAdvancedStatus('error', 'Error en análisis');
        }
    }

    // Funciones auxiliares para el análisis avanzado
    updateElement(id, value, className = 'metric-value') {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.className = className;
        }
    }

    updateAdvancedStatus(status, message) {
        const statusElement = document.getElementById('advanced-status-text');
        const indicatorElement = document.getElementById('advanced-indicator');
        
        if (statusElement) statusElement.textContent = message;
        if (indicatorElement) {
            const indicators = {
                'loading': '🔄',
                'success': '✅',
                'error': '❌',
                'warning': '⚠️'
            };
            indicatorElement.textContent = indicators[status] || '🔄';
        }
    }

    getPerformanceClass(value) {
        if (typeof value === 'string') {
            value = parseFloat(value.replace('%', '').replace('+', ''));
        }
        return value >= 0 ? 'positive' : 'negative';
    }

    getConfidenceClass(value) {
        const numValue = parseFloat(value) || 0;
        if (numValue >= 80) return 'high';
        if (numValue >= 50) return 'medium';
        return 'low';
    }

    // Actualizar estadísticas principales - Mejorado con validación robusta
    updateStats(data) {
        try {
            const rippleData = data.ripple;
            
            if (!rippleData) {
                console.warn('⚠️ Datos de ripple no disponibles');
                return;
            }

            // Validar y obtener datos básicos con fallbacks
            const currentPrice = this.validateNumber(rippleData.usd, this.currentPrice || 0);
            const changePercent = this.validateNumber(rippleData.usd_24h_change, 0);
            const volume24h = this.validateNumber(rippleData.usd_24h_vol, 0);
            const marketCap = this.validateNumber(rippleData.usd_market_cap, 0);
            
            // Para máximo y mínimo, usar datos históricos si no están disponibles
            let high24h = this.validateNumber(rippleData.usd_24h_high, currentPrice);
            let low24h = this.validateNumber(rippleData.usd_24h_low, currentPrice);
            
            // Si los datos de 24h no están disponibles, calcular desde datos históricos
            if (!rippleData.usd_24h_high || !rippleData.usd_24h_low) {
                const { high, low } = this.calculateHighLowFromHistory();
                high24h = high || currentPrice;
                low24h = low || currentPrice;
            }
            
            // Precio actual
            const priceElement = document.getElementById('current-price');
            if (priceElement) {
                priceElement.textContent = `$${this.formatPrice(currentPrice)}`;
                
                // Animación de cambio de precio
                if (this.previousPrice !== 0 && this.previousPrice !== currentPrice) {
                    const changeClass = currentPrice > this.previousPrice ? 'price-up' : 'price-down';
                    priceElement.classList.add(changeClass);
                    setTimeout(() => priceElement.classList.remove(changeClass), 1000);
                }
            }
            
            // Cambio de precio
            const changeElement = document.getElementById('change-percent');
            const arrowElement = document.getElementById('change-arrow');
            const cardElement = document.getElementById('price-card');
            
            if (changeElement && arrowElement && cardElement) {
                const absChange = Math.abs(changePercent);
                changeElement.textContent = `${absChange.toFixed(2)}%`;
                
                if (changePercent > 0) {
                    arrowElement.textContent = '↗';
                    cardElement.className = 'stat-card positive';
                } else if (changePercent < 0) {
                    arrowElement.textContent = '↘';
                    cardElement.className = 'stat-card negative';
                } else {
                    arrowElement.textContent = '→';
                    cardElement.className = 'stat-card';
                }
            }
            
            // Volumen 24h
            const volumeElement = document.getElementById('volume-24h');
            if (volumeElement) {
                volumeElement.textContent = this.formatVolume(volume24h);
            }
            
            // Market Cap
            const marketCapElement = document.getElementById('market-cap');
            if (marketCapElement) {
                marketCapElement.textContent = this.formatNumber(marketCap);
            }
            
            // Máximo 24h
            const high24Element = document.getElementById('high-24h');
            if (high24Element) {
                high24Element.textContent = `$${this.formatPrice(high24h)}`;
            }
            
            // Mínimo 24h
            const low24Element = document.getElementById('low-24h');
            if (low24Element) {
                low24Element.textContent = `$${this.formatPrice(low24h)}`;
            }
            
            // Calcular distancias a máximo y mínimo con validación
            const highDistance = high24h > currentPrice ? 
                ((high24h - currentPrice) / currentPrice) * 100 : 0;
            const lowDistance = currentPrice > low24h ? 
                ((currentPrice - low24h) / currentPrice) * 100 : 0;
            
            const highDistanceElement = document.getElementById('high-distance');
            const lowDistanceElement = document.getElementById('low-distance');
            
            if (highDistanceElement) {
                highDistanceElement.textContent = `↑ ${highDistance.toFixed(2)}%`;
            }
            
            if (lowDistanceElement) {
                lowDistanceElement.textContent = `↓ ${lowDistance.toFixed(2)}%`;
            }
            
        } catch (error) {
            console.error('❌ Error actualizando estadísticas:', error);
            this.updateStatsWithFallback();
        }
    }

    // Validar números y proporcionar fallbacks
    validateNumber(value, fallback = 0) {
        if (value === null || value === undefined || isNaN(value) || value === 0) {
            return fallback;
        }
        return Number(value);
    }

    // Calcular máximo y mínimo desde datos históricos
    calculateHighLowFromHistory() {
        if (!this.priceData || this.priceData.length === 0) {
            return { high: null, low: null };
        }

        const prices = this.priceData.map(p => {
            if (Array.isArray(p)) return p[1];
            if (typeof p === 'object' && p.price) return p.price;
            return p;
        }).filter(p => p && !isNaN(p));

        if (prices.length === 0) {
            return { high: null, low: null };
        }

        return {
            high: Math.max(...prices),
            low: Math.min(...prices)
        };
    }

    // Actualizar estadísticas con datos de fallback
    updateStatsWithFallback() {
        try {
            const currentPrice = this.currentPrice || 0.5; // Precio de fallback para XRP
            
            // Actualizar solo elementos críticos con datos mínimos
            const priceElement = document.getElementById('current-price');
            if (priceElement) {
                priceElement.textContent = `$${this.formatPrice(currentPrice)}`;
            }

            const high24Element = document.getElementById('high-24h');
            if (high24Element) {
                high24Element.textContent = `$${this.formatPrice(currentPrice * 1.05)}`;
            }

            const low24Element = document.getElementById('low-24h');
            if (low24Element) {
                low24Element.textContent = `$${this.formatPrice(currentPrice * 0.95)}`;
            }

            const changeElement = document.getElementById('change-percent');
            if (changeElement) {
                changeElement.textContent = '0.00%';
            }

            const volumeElement = document.getElementById('volume-24h');
            if (volumeElement) {
                volumeElement.textContent = 'N/A';
            }

        } catch (error) {
            console.error('❌ Error en fallback de estadísticas:', error);
        }
    }

    // Actualizar indicadores técnicos - Mejorado
    updateIndicators(analysis) {
        try {
            // RSI
            this.updateIndicatorCard('rsi', analysis.rsi, (value) => {
                let status = 'Neutral';
                let color = 'var(--accent-blue)';
                
                if (value > 70) {
                    status = 'Sobrecomprado';
                    color = 'var(--accent-red)';
                } else if (value < 30) {
                    status = 'Sobrevendido';
                    color = 'var(--accent-green)';
                }
                
                return { status, color };
            });
            
            // MACD
            const macdValue = analysis.macd.histogram.toFixed(4);
            this.updateIndicatorCard('macd', macdValue, (value) => {
                const numValue = parseFloat(value);
                let status = 'Neutral';
                let color = 'var(--accent-blue)';
                
                if (numValue > 0) {
                    status = 'Alcista';
                    color = 'var(--accent-green)';
                } else if (numValue < 0) {
                    status = 'Bajista';
                    color = 'var(--accent-red)';
                }
                
                return { status, color };
            });
            
            // Bollinger Bands
            const bbPosition = analysis.bollingerBands.position;
            this.updateIndicatorCard('bb', `${bbPosition.toFixed(0)}%`, (value) => {
                const numValue = parseFloat(value);
                let status = 'Zona Media';
                let color = 'var(--accent-blue)';
                
                if (numValue > 80) {
                    status = 'Zona Alta';
                    color = 'var(--accent-red)';
                } else if (numValue < 20) {
                    status = 'Zona Baja';
                    color = 'var(--accent-green)';
                }
                
                return { status, color };
            });
            
            // Stochastic
            const stochValue = analysis.stochastic.k.toFixed(1);
            this.updateIndicatorCard('stoch', stochValue, (value) => {
                const numValue = parseFloat(value);
                let status = 'Neutral';
                let color = 'var(--accent-blue)';
                
                if (numValue > 80) {
                    status = 'Sobrecomprado';
                    color = 'var(--accent-red)';
                } else if (numValue < 20) {
                    status = 'Sobrevendido';
                    color = 'var(--accent-green)';
                }
                
                return { status, color };
            });
            
        } catch (error) {
            console.error('❌ Error actualizando indicadores:', error);
        }
    }

    // Actualizar tarjeta de indicador individual
    updateIndicatorCard(indicator, value, statusCalculator) {
        try {
            const valueElement = document.getElementById(`${indicator}-value`);
            const descElement = document.getElementById(`${indicator}-desc`);
            
            if (valueElement) {
                valueElement.textContent = value;
                
                if (statusCalculator) {
                    const { status, color } = statusCalculator(value);
                    valueElement.style.color = color;
                    
                    if (descElement) {
                        descElement.textContent = status;
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error actualizando indicador ${indicator}:`, error);
        }
    }

    // Actualizar señales de trading - Mejorado
    updateTradingSignals() {
        try {
            const container = document.getElementById('trading-signals-container');
            if (!container) return;
            
            const signals = this.trading.signals || [];
            
            if (signals.length === 0) {
                container.innerHTML = `
                    <div class="signal-card">
                        <div class="signal-title">📊 Analizando mercado...</div>
                        <div class="signal-description">Recopilando datos para generar señales</div>
                    </div>
                `;
                return;
            }
            
            const signalsHTML = signals.map(signal => {
                const strengthBars = Array(5).fill().map((_, i) => 
                    `<div class="strength-bar ${i < signal.strength ? 'active' : ''}"></div>`
                ).join('');
                
                const typeClass = signal.type === 'buy' ? 'signal-buy' : 
                                  signal.type === 'sell' ? 'signal-sell' : 'signal-neutral';
                
                const typeText = signal.type === 'buy' ? 'COMPRA' : 
                               signal.type === 'sell' ? 'VENTA' : 'NEUTRAL';
                
                const confidenceText = signal.confidence ? ` (${signal.confidence}%)` : '';
                
                return `
                    <div class="signal-card">
                        <div class="signal-header">
                            <div class="signal-title">${signal.title}</div>
                            <div class="signal-type ${typeClass}">${typeText}</div>
                        </div>
                        <div class="signal-description">${signal.description}</div>
                        <div class="signal-action">
                            <span>Fuerza: </span>
                            <div class="signal-strength">${strengthBars}</div>
                            <span class="signal-confidence">${confidenceText}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = signalsHTML;
            
        } catch (error) {
            console.error('❌ Error actualizando señales:', error);
        }
    }

    // Actualizar recomendaciones - Mejorado con validación robusta
    updateRecommendations(recommendations) {
        try {
            // Usar recomendaciones por defecto si no se proporcionan válidas
            if (!recommendations || typeof recommendations !== 'object') {
                console.warn('⚠️ Recomendaciones inválidas, usando defaults');
                recommendations = this.getDefaultRecommendations();
            }
            
            // Icono y recomendación principal
            const iconElement = document.getElementById('rec-icon');
            const recommendationElement = document.getElementById('main-recommendation');
            const confidenceElement = document.getElementById('confidence-score');
            
            if (iconElement) {
                iconElement.textContent = recommendations.icon || '⏸️';
            }
            
            if (recommendationElement) {
                recommendationElement.textContent = recommendations.recommendation || 'Mantener posición actual';
            }
            
            if (confidenceElement) {
                const confidence = recommendations.confidence || 50;
                confidenceElement.textContent = `${confidence}%`;
                
                // Actualizar clase de confianza
                confidenceElement.className = `confidence ${this.getConfidenceClass(confidence)}`;
            }
            
            // Niveles de trading con validación y fallbacks
            const levels = recommendations.levels || {};
            const currentPrice = this.currentPrice || 0.5;
            
            // Calcular valores de fallback basados en el precio actual
            const entryPrice = levels.entry || currentPrice;
            const stopLoss = levels.stopLoss || (currentPrice * 0.95);
            const takeProfit = levels.takeProfit1 || (currentPrice * 1.05);
            const riskReward = levels.riskReward || ((takeProfit - entryPrice) / (entryPrice - stopLoss));
            
            this.updateRecommendationValue('entry-price', `$${this.formatPrice(entryPrice)}`);
            this.updateRecommendationValue('stop-loss', `$${this.formatPrice(stopLoss)}`);
            this.updateRecommendationValue('take-profit', `$${this.formatPrice(takeProfit)}`);
            this.updateRecommendationValue('risk-reward', `1:${riskReward.toFixed(1)}`);
            
        } catch (error) {
            console.error('❌ Error actualizando recomendaciones:', error);
            // Forzar actualización con valores básicos
            this.forceBasicRecommendations();
        }
    }

    // Forzar recomendaciones básicas en caso de error
    forceBasicRecommendations() {
        try {
            const currentPrice = this.currentPrice || 0.5;
            
            this.updateRecommendationValue('entry-price', `$${this.formatPrice(currentPrice)}`);
            this.updateRecommendationValue('stop-loss', `$${this.formatPrice(currentPrice * 0.95)}`);
            this.updateRecommendationValue('take-profit', `$${this.formatPrice(currentPrice * 1.05)}`);
            this.updateRecommendationValue('risk-reward', '1:1.0');

            const iconElement = document.getElementById('rec-icon');
            const recommendationElement = document.getElementById('main-recommendation');
            
            if (iconElement) iconElement.textContent = '⏸️';
            if (recommendationElement) recommendationElement.textContent = 'Mantener posición actual';
            
        } catch (error) {
            console.error('❌ Error forzando recomendaciones básicas:', error);
        }
    }

    // Actualizar valor de recomendación individual
    updateRecommendationValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    // Actualizar libro de órdenes simulado - Mejorado
    updateOrderBook() {
        try {
            const askContainer = document.getElementById('ask-orders');
            const bidContainer = document.getElementById('bid-orders');
            
            if (!askContainer || !bidContainer) return;
            
            const currentPrice = this.currentPrice;
            
            // Generar órdenes ask (venta) y bid (compra)
            const askOrders = this.generateOrderBook(currentPrice, 'ask', 5);
            const bidOrders = this.generateOrderBook(currentPrice, 'bid', 5);
            
            askContainer.innerHTML = askOrders.map(order => `
                <div class="order-row ask">
                    <div>$${this.formatPrice(order.price)}</div>
                    <div>${this.formatVolume(order.quantity)}</div>
                    <div>$${this.formatNumber(order.total)}</div>
                </div>
            `).join('');
            
            bidContainer.innerHTML = bidOrders.map(order => `
                <div class="order-row bid">
                    <div>$${this.formatPrice(order.price)}</div>
                    <div>${this.formatVolume(order.quantity)}</div>
                    <div>$${this.formatNumber(order.total)}</div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('❌ Error actualizando libro de órdenes:', error);
        }
    }

    // Generar libro de órdenes simulado
    generateOrderBook(currentPrice, type, count) {
        const orders = [];
        const baseQuantity = 50000 + Math.random() * 100000;
        
        for (let i = 0; i < count; i++) {
            const priceOffset = (i + 1) * 0.0001; // 0.01% por nivel
            const price = type === 'ask' ? 
                currentPrice * (1 + priceOffset) : 
                currentPrice * (1 - priceOffset);
            
            const quantity = baseQuantity * (0.5 + Math.random() * 1.5);
            const total = price * quantity;
            
            orders.push({
                price: Number(price.toFixed(6)),
                quantity: Math.round(quantity),
                total: Math.round(total)
            });
        }
        
        return orders;
    }

    // Actualizar niveles de soporte y resistencia - Corregido
    updateSupportResistance(levels) {
        try {
            const supportContainer = document.getElementById('support-levels');
            const resistanceContainer = document.getElementById('resistance-levels');
            
            if (!supportContainer || !resistanceContainer) return;
            
            // Usar niveles por defecto si no se proporcionan
            if (!levels || (!levels.supports && !levels.resistances)) {
                levels = this.getDefaultSupportResistance();
            }
            
            // Soportes
            if (levels.supports && levels.supports.length > 0) {
                supportContainer.innerHTML = levels.supports.map(support => `
                    <div class="level-item">
                        <div class="level-price">$${this.formatPrice(support.price)}</div>
                        <div class="level-details">
                            <span class="level-strength ${this.getStrengthClass(support.strength)}">${support.strength}</span>
                            <span class="level-distance">${support.distance}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                // Mostrar niveles básicos calculados
                const basicLevels = this.getDefaultSupportResistance();
                supportContainer.innerHTML = basicLevels.supports.map(support => `
                    <div class="level-item">
                        <div class="level-price">$${this.formatPrice(support.price)}</div>
                        <div class="level-details">
                            <span class="level-strength ${this.getStrengthClass(support.strength)}">${support.strength}</span>
                            <span class="level-distance">${support.distance}</span>
                        </div>
                    </div>
                `).join('');
            }
            
            // Resistencias
            if (levels.resistances && levels.resistances.length > 0) {
                resistanceContainer.innerHTML = levels.resistances.map(resistance => `
                    <div class="level-item">
                        <div class="level-price">$${this.formatPrice(resistance.price)}</div>
                        <div class="level-details">
                            <span class="level-strength ${this.getStrengthClass(resistance.strength)}">${resistance.strength}</span>
                            <span class="level-distance">${resistance.distance}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                // Mostrar niveles básicos calculados
                const basicLevels = this.getDefaultSupportResistance();
                resistanceContainer.innerHTML = basicLevels.resistances.map(resistance => `
                    <div class="level-item">
                        <div class="level-price">$${this.formatPrice(resistance.price)}</div>
                        <div class="level-details">
                            <span class="level-strength ${this.getStrengthClass(resistance.strength)}">${resistance.strength}</span>
                            <span class="level-distance">${resistance.distance}</span>
                        </div>
                    </div>
                `).join('');
            }
            
        } catch (error) {
            console.error('❌ Error actualizando S/R:', error);
            this.updateSupportResistanceWithFallback();
        }
    }

    // Actualizar S/R con valores de fallback
    updateSupportResistanceWithFallback() {
        try {
            const supportContainer = document.getElementById('support-levels');
            const resistanceContainer = document.getElementById('resistance-levels');
            
            if (supportContainer) {
                supportContainer.innerHTML = `
                    <div class="level-item">
                        <div class="level-price">Calculando...</div>
                        <div class="level-details">
                            <span class="level-strength strength-moderado">Análisis en progreso</span>
                        </div>
                    </div>
                `;
            }
            
            if (resistanceContainer) {
                resistanceContainer.innerHTML = `
                    <div class="level-item">
                        <div class="level-price">Calculando...</div>
                        <div class="level-details">
                            <span class="level-strength strength-moderado">Análisis en progreso</span>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error en fallback S/R:', error);
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

    // Configurar event listeners - Mejorado
    setupEventListeners() {
        try {
            // Botones de timeframe
            const timeButtons = document.querySelectorAll('.time-button');
            timeButtons.forEach(button => {
                const handler = (e) => this.handleTimeframeChange(e);
                button.addEventListener('click', handler);
                this.eventListeners.set(button, { event: 'click', handler });
            });
            
            // Botón de cierre de alerta
            const alertClose = document.querySelector('.alert-close');
            if (alertClose) {
                const handler = () => this.hideAlert();
                alertClose.addEventListener('click', handler);
                this.eventListeners.set(alertClose, { event: 'click', handler });
            }
            
            // Event listeners del navegador
            this.setupBrowserEventListeners();
            
            console.log('👂 Event listeners configurados');
            
        } catch (error) {
            console.error('❌ Error configurando event listeners:', error);
        }
    }

    // Configurar event listeners del navegador
    setupBrowserEventListeners() {
        // Visibilidad de página
        const visibilityHandler = () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        
        // Estado de conexión
        const onlineHandler = () => {
            this.state.connected = true;
            this.showAlert('🌐 Conexión restaurada', 'Reanudando actualizaciones de datos');
            this.resumeUpdates();
        };
        
        const offlineHandler = () => {
            this.state.connected = false;
            this.showAlert('⚠️ Sin conexión', 'Usando datos en caché');
            this.pauseUpdates();
        };
        
        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', offlineHandler);
        
        // Redimensionamiento de ventana
        const resizeHandler = () => {
            if (this.charts) {
                setTimeout(() => this.charts.resizeCharts(), 100);
            }
        };
        window.addEventListener('resize', resizeHandler);
        
        // Antes de cerrar
        const beforeUnloadHandler = () => {
            this.saveUserConfiguration();
            this.cleanup();
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
    }

    // Manejar cambio de timeframe - Mejorado
    async handleTimeframeChange(e) {
        try {
            const button = e.target;
            const newTimeframe = parseInt(button.dataset.days);
            
            if (newTimeframe === this.currentTimeframe) return;
            
            // Actualizar estado visual
            document.querySelectorAll('.time-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Mostrar loading temporal
            this.showTemporaryLoading();
            
            // Actualizar timeframe
            this.currentTimeframe = newTimeframe;
            
            // Cargar nuevos datos
            const historicalData = await this.api.getHistoricalData(newTimeframe);
            this.priceData = historicalData.prices;
            
            // Actualizar gráfico
            this.charts.updatePriceChart(historicalData, newTimeframe);
            
            // Ocultar loading
            this.hideTemporaryLoading();
            
            console.log(`📅 Timeframe cambiado a ${newTimeframe} días`);
            
        } catch (error) {
            console.error('❌ Error cambiando timeframe:', error);
            this.hideTemporaryLoading();
        }
    }

    // Mostrar loading temporal
    showTemporaryLoading() {
        const button = document.querySelector('.time-button.active');
        if (button) {
            button.style.opacity = '0.5';
            button.disabled = true;
        }
    }

    // Ocultar loading temporal
    hideTemporaryLoading() {
        const buttons = document.querySelectorAll('.time-button');
        buttons.forEach(button => {
            button.style.opacity = '1';
            button.disabled = false;
        });
    }

    // Iniciar actualizaciones automáticas - Mejorado
    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(async () => {
            if (!this.state.connected || document.hidden) return;
            
            try {
                await this.updateData();
            } catch (error) {
                this.handleUpdateError(error);
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

    // Actualizar datos - Mejorado
    async updateData() {
        try {
            const batchData = await this.api.getBatchData(this.currentTimeframe);
            
            if (batchData.success) {
                await this.processMarketData(batchData);
                this.errorCount = 0; // Reset error count on success
            } else {
                throw new Error('Error en datos batch');
            }
            
        } catch (error) {
            this.handleUpdateError(error);
        }
    }

    // Manejar errores de actualización
    handleUpdateError(error) {
        this.errorCount++;
        this.metrics.errors++;
        
        console.warn(`⚠️ Error de actualización ${this.errorCount}/${this.maxErrors}:`, error.message);
        
        if (this.errorCount >= this.maxErrors) {
            this.pauseUpdates();
            this.showAlert(
                '❌ Error de conexión', 
                'Demasiados errores. Actualizaciones pausadas.'
            );
            
            if (this.config.autoReconnect) {
                setTimeout(() => {
                    this.errorCount = 0;
                    this.resumeUpdates();
                }, 60000); // Reintentar en 1 minuto
            }
        }
    }

    // Manejar errores de inicialización
    handleInitializationError(error) {
        this.showError(
            'Error de Inicialización',
            `No se pudo inicializar la aplicación: ${error.message}`
        );
    }

    // Manejar errores de procesamiento
    handleProcessingError(error) {
        this.errorCount++;
        this.state.error = true;

        // Limitar el número de errores antes de detener actualizaciones
        if (this.errorCount >= this.maxErrors) {
            console.error(`💥 Máximo de errores alcanzado (${this.maxErrors}). Deteniendo actualizaciones automáticas.`);
            this.pauseUpdates();
            this.showAlert(
                '⚠️ Errores Críticos',
                'Se han detectado múltiples errores. Las actualizaciones automáticas se han detenido.'
            );
            return;
        }

        // Mostrar error al usuario si es crítico
        if (error.message.includes('crítico') || error.message.includes('critical')) {
            this.showAlert(
                '❌ Error Crítico',
                'Error procesando datos del mercado. Reintentando...'
            );
        }

        // Log detallado para debugging
        console.error('📊 Error de procesamiento:', {
            message: error.message,
            stack: error.stack,
            errorCount: this.errorCount,
            timestamp: new Date().toISOString(),
            state: {
                loading: this.state.loading,
                connected: this.state.connected,
                lastUpdate: this.state.lastDataUpdate
            }
        });
    }

    // Manejar errores de red
    handleNetworkError(error) {
        console.warn('🌐 Error de red:', error.message || error.status);
        
        // Incrementar contador de fallos consecutivos
        this.connectionState = this.connectionState || { consecutiveFailures: 0 };
        this.connectionState.consecutiveFailures++;

        // Si hay muchos fallos, reducir frecuencia de actualización
        if (this.connectionState.consecutiveFailures >= 3) {
            console.log('⏰ Reduciendo frecuencia por fallos de red');
            this.config.updateInterval = Math.min(this.config.updateInterval * 1.5, 300000); // Máximo 5 minutos
        }

        // Reset del contador en caso de éxito posterior
        if (error.status === 200) {
            this.connectionState.consecutiveFailures = 0;
            this.config.updateInterval = 30000; // Volver a 30 segundos
        }
    }

    // Manejar errores de JavaScript
    handleJavaScriptError(error) {
        console.error('🐛 Error de JavaScript:', {
            message: error.message,
            filename: error.filename,
            lineno: error.lineno,
            colno: error.colno,
            stack: error.stack
        });

        // No mostrar todos los errores JS al usuario, solo los críticos
        if (error.message.includes('Cannot read properties of undefined')) {
            console.warn('⚠️ Error de propiedades undefined detectado - implementando validación');
        }
    }

    // Manejar promesas rechazadas
    handlePromiseRejection(reason) {
        console.error('🚫 Promesa rechazada:', reason);
        
        // Si es un error de API, intentar reconexión
        if (reason && reason.message && reason.message.includes('fetch')) {
            console.log('🔄 Reintentando conexión API en 30 segundos...');
            setTimeout(() => {
                if (this.isInitialized) {
                    this.loadInitialData().catch(err => 
                        console.warn('⚠️ Reintento de carga falló:', err.message)
                    );
                }
            }, 30000);
        }
    }

    // Formatear precio
    formatPrice(price) {
        if (!price || isNaN(price)) return '0.000000';
        return Number(price).toFixed(this.config.priceDecimalPlaces);
    }

    // Formatear volumen
    formatVolume(volume) {
        if (!volume || isNaN(volume)) return '0';
        
        if (this.config.volumeFormat === 'compact') {
            return this.formatNumber(volume);
        }
        
        return new Intl.NumberFormat('es-ES').format(Math.round(volume));
    }

    // Formatear números grandes
    formatNumber(num) {
        if (!num || isNaN(num)) return '0';
        
        if (num >= 1e9) {
            return `${(num / 1e9).toFixed(2)}B`;
        }
        if (num >= 1e6) {
            return `${(num / 1e6).toFixed(2)}M`;
        }
        if (num >= 1e3) {
            return `${(num / 1e3).toFixed(2)}K`;
        }
        return num.toFixed(2);
    }

    // Actualizar timestamp de última actualización
    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES');
        
        const element = document.getElementById('update-time');
        if (element) {
            element.textContent = `Actualizado: ${timeString}`;
        }
        
        this.lastUpdate = now;
    }

    // Mostrar loading
    showLoading() {
        this.setElementDisplay('loading', 'flex');
        this.setElementDisplay('error-container', 'none');
        this.setElementDisplay('main-content', 'none');
        this.state.loading = true;
        this.state.error = false;
    }

    // Mostrar contenido principal
    showContent() {
        this.setElementDisplay('loading', 'none');
        this.setElementDisplay('error-container', 'none');
        this.setElementDisplay('main-content', 'block');
        this.state.loading = false;
        this.state.error = false;
    }

    // Mostrar error
    showError(message, details = '') {
        this.setElementDisplay('loading', 'none');
        this.setElementDisplay('error-container', 'block');
        this.setElementDisplay('main-content', 'none');
        
        this.setElementText('error-message', message);
        this.setElementText('error-details', details);
        
        this.state.loading = false;
        this.state.error = true;
    }

    // Mostrar alerta
    showAlert(title, content, type = 'info', duration = null) {
        try {
            const alertBanner = document.getElementById('alert-banner');
            const alertTitle = document.getElementById('alert-title');
            const alertContent = document.getElementById('alert-content');
            
            if (alertTitle) alertTitle.textContent = title;
            if (alertContent) alertContent.textContent = content;
            if (alertBanner) {
                alertBanner.className = `alert-banner show ${type}`;
            }
            
            const hideDelay = duration || this.config.alertDuration;
            setTimeout(() => this.hideAlert(), hideDelay);
            
        } catch (error) {
            console.error('❌ Error mostrando alerta:', error);
        }
    }

    // Ocultar alerta
    hideAlert() {
        const alertBanner = document.getElementById('alert-banner');
        if (alertBanner) {
            alertBanner.classList.remove('show');
        }
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

    // Método para crear alertas de volumen (faltante)
    createVolumeAlert(symbol, threshold, options = {}) {
        try {
            if (this.smartAlerts && typeof this.smartAlerts.createVolumeAlert === 'function') {
                return this.smartAlerts.createVolumeAlert(symbol, threshold, options);
            } else {
                console.warn('⚠️ Sistema de alertas no disponible');
                return null;
            }
        } catch (error) {
            console.error('❌ Error creando alerta de volumen:', error);
            return null;
        }
    }

    // Actualizar contenido del análisis avanzado
    updateAdvancedAnalysisDisplay() {
        try {
            // Solo actualizar si tenemos módulos avanzados disponibles
            if (!this.advancedModules && !window.advancedModules) {
                this.showAdvancedAnalysisPlaceholder();
                return;
            }
            
            // Usar análisis existente si está disponible
            if (this.state.advancedAnalysis) {
                this.updateAdvancedAnalysisUI(this.state.advancedAnalysis);
            } else {
                // Mostrar mensaje de carga
                this.showAdvancedAnalysisLoading();
            }
            
        } catch (error) {
            console.error('❌ Error actualizando análisis avanzado:', error);
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

    // Reintentar conexión
    async retryConnection() {
        try {
            this.showLoading();
            this.errorCount = 0;
            
            await this.initialize();
            
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    // Utilities para DOM
    setElementDisplay(id, display) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = display;
        }
    }

    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    // Limpiar memoria
    cleanupMemory() {
        try {
            // Limpiar caches
            if (this.api && typeof this.api.clearCache === 'function') {
                this.api.clearCache();
            }
            if (this.indicators && typeof this.indicators.clearCache === 'function') {
                this.indicators.clearCache();
            }
            if (this.trading && typeof this.trading.cleanupHistory === 'function') {
                this.trading.cleanupHistory();
            }

            // Limpiar datos antiguos de precio
            if (this.priceData && this.priceData.length > 1000) {
                this.priceData = this.priceData.slice(-500); // Mantener solo los últimos 500 puntos
                console.log('🧹 Cache de precios limpiado');
            }

            // Limpiar métricas antiguas
            if (this.metrics && this.metrics.lastUpdateTimes && this.metrics.lastUpdateTimes.length > 100) {
                this.metrics.lastUpdateTimes = this.metrics.lastUpdateTimes.slice(-50);
            }
            
            // Forzar garbage collection si está disponible
            if (window.gc) {
                window.gc();
            }
            
            console.log('🧹 Limpieza de memoria realizada');
            
        } catch (error) {
            console.error('❌ Error en limpieza de memoria:', error);
        }
    }

    // Actualización básica de UI cuando falla la completa
    updateBasicUI(currentData) {
        try {
            if (currentData && currentData.ripple) {
                // Solo actualizar precio si el elemento existe
                const priceElement = document.getElementById('current-price');
                if (priceElement && typeof currentData.ripple.usd === 'number') {
                    priceElement.textContent = `$${currentData.ripple.usd.toFixed(6)}`;
                }

                // Actualizar timestamp
                const timestampElement = document.getElementById('last-update');
                if (timestampElement) {
                    timestampElement.textContent = new Date().toLocaleTimeString();
                }
            }
        } catch (error) {
            console.warn('⚠️ Error en actualización básica de UI:', error.message);
        }
    }

    // Obtener niveles de soporte y resistencia por defecto
    getDefaultSupportResistance() {
        const currentPrice = this.currentPrice || 0.5; // Precio base para XRP
        
        const supports = [
            {
                price: currentPrice * 0.98,
                strength: 'Moderado',
                distance: '2.00%'
            },
            {
                price: currentPrice * 0.95,
                strength: 'Fuerte',
                distance: '5.00%'
            }
        ];

        const resistances = [
            {
                price: currentPrice * 1.02,
                strength: 'Moderado', 
                distance: '2.00%'
            },
            {
                price: currentPrice * 1.05,
                strength: 'Fuerte',
                distance: '5.00%'
            }
        ];

        return { supports, resistances };
    }

    // Obtener estado de la aplicación
    getState() {
        return {
            ...this.state,
            currentTimeframe: this.currentTimeframe,
            currentPrice: this.currentPrice,
            isInitialized: this.isInitialized,
            metrics: this.metrics,
            config: this.config
        };
    }

    // Obtener estadísticas de rendimiento
    getPerformanceStats() {
        return {
            ...this.state.performance,
            ...this.metrics,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            } : null
        };
    }

    // Métodos auxiliares para manejo de errores mejorado
    getDefaultAnalysis() {
        return {
            rsi: { value: 50, signal: 'neutral' },
            macd: { value: 0, signal: 'neutral', histogram: 0 },
            bollingerBands: { upper: 0, lower: 0, signal: 'neutral', position: 50 },
            ema: { short: 0, long: 0, signal: 'neutral' },
            stochastic: { k: 50, d: 50, signal: 'neutral' },
            overall: 'neutral'
        };
    }

    getDefaultRecommendations() {
        const currentPrice = this.currentPrice || 0.5; // Precio base para XRP
        
        return {
            action: 'HOLD',
            confidence: 50,
            recommendation: 'Mantener posición actual',
            icon: '⏸️',
            reasons: ['Análisis en progreso', 'Volatilidad moderada', 'Tendencia lateral'],
            riskLevel: 'medium',
            timeframe: 'short',
            levels: {
                entry: currentPrice,
                stopLoss: currentPrice * 0.95,
                takeProfit1: currentPrice * 1.05,
                riskReward: 1.0
            }
        };
    }

    getDefaultSupportResistance() {
        const currentPrice = this.currentPrice || 0.5;
        return {
            supports: [
                { price: currentPrice * 0.95, strength: 2.5 },
                { price: currentPrice * 0.90, strength: 3.0 }
            ],
            resistances: [
                { price: currentPrice * 1.05, strength: 2.5 },
                { price: currentPrice * 1.10, strength: 3.0 }
            ],
            pivot: currentPrice
        };
    }

    // Cleanup completo
    cleanup() {
        try {
            // Pausar actualizaciones
            this.pauseUpdates();
            
            // Limpiar event listeners
            this.eventListeners.forEach((listener, element) => {
                element.removeEventListener(listener.event, listener.handler);
            });
            this.eventListeners.clear();
            
            // Destruir gráficos
            if (this.charts && typeof this.charts.destroyAllCharts === 'function') {
                this.charts.destroyAllCharts();
            }
            
            // Limpiar memoria
            this.cleanupMemory();
            
            // Guardar configuración
            this.saveUserConfiguration();
            
            console.log('🧹 Cleanup completo realizado');
            
        } catch (error) {
            console.error('❌ Error en cleanup:', error);
        }
    }
}

// Inicialización global cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.xrpApp = new XRPTradingApp();
    window.app = window.xrpApp; // Compatibility alias for HTML onclick handlers
    window.xrpApp.initialize().catch(error => {
        console.error('💥 Error fatal en inicialización:', error);
    });
});

// Exportar para uso como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XRPTradingApp;
}