// advanced-integration.js - Integración de módulos avanzados con la aplicación principal

class AdvancedTradingIntegration {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.eventListeners = new Map();
        
        this.initializeModules();
    }

    async initializeModules() {
        console.log('🚀 Inicializando módulos avanzados...');

        try {
            // Verificar que módulos están disponibles
            this.checkModuleAvailability();

            // Configurar módulos disponibles
            await this.configureModules();

            // Establecer conexiones entre módulos disponibles
            this.setupModuleConnections();

            // Configurar event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            
            const availableModules = Object.keys(this.modules).length;
            console.log(`✅ ${availableModules} módulos avanzados inicializados correctamente`);

            // Crear instancias globales disponibles para la app principal
            this.createGlobalInstances();

            // Notificar a la aplicación principal
            this.notifyMainApp();

        } catch (error) {
            console.warn('⚠️ Inicialización parcial de módulos avanzados:', error.message);
            // Intentar inicialización parcial en lugar de fallar completamente
            this.tryPartialInitialization();
        }
    }

    createGlobalInstances() {
        // Hacer disponibles las instancias para la aplicación principal
        window.advancedModules = this.modules;
        window.advancedIntegration = this;
        
        // Crear métodos de conveniencia
        window.getAdvancedAnalysis = () => this.getComprehensiveAnalysis();
        window.getPerformanceMetrics = () => this.modules.performance?.getMetrics();
        window.getPortfolioStats = () => this.modules.portfolio?.getCurrentStats();
    }

    waitForInitialization() {
        return new Promise((resolve) => {
            if (this.isInitialized) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (this.isInitialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    checkModuleAvailability() {
        // Verificar disponibilidad de módulos usando sus nombres de variable global reales
        const moduleChecks = {
            performance: window.performanceMonitor,
            parallel: window.parallelProcessor,
            dataManager: window.cryptoDataManager,
            volatility: window.volatilityAnalyzer,
            arbitrage: window.arbitrageDetector,
            whales: window.whaleActivityDetector,
            alerts: window.smartAlertSystem,
            portfolio: window.portfolioAnalytics,
            backtesting: window.backtestingEngine
        };

        const missingModules = [];
        Object.entries(moduleChecks).forEach(([key, module]) => {
            if (!module) {
                missingModules.push(key);
            }
        });

        if (missingModules.length > 0) {
            console.warn(`⚠️ Módulos no disponibles: ${missingModules.join(', ')}`);
            // No lanzar error, continuar con módulos disponibles
        }

        // Almacenar referencias a los módulos disponibles
        this.modules = {
            performance: window.performanceMonitor,
            parallel: window.parallelProcessor,
            dataManager: window.cryptoDataManager,
            volatility: window.volatilityAnalyzer,
            arbitrage: window.arbitrageDetector,
            whales: window.whaleActivityDetector,
            alerts: window.smartAlertSystem,
            portfolio: window.portfolioAnalytics,
            backtesting: window.backtestingEngine
        };

        // Filtrar módulos no disponibles
        Object.keys(this.modules).forEach(key => {
            if (!this.modules[key]) {
                delete this.modules[key];
            }
        });
    }

    async configureModules() {
        // Configurar Performance Monitor
        if (this.modules.performance) {
            this.modules.performance.startGlobalMonitoring();
        }

        // Configurar Data Manager con configuración de cache
        if (this.modules.dataManager) {
            await this.modules.dataManager.initialize({
                maxCacheSize: 500, // MB
                compressionLevel: 6,
                autoCleanup: true,
                cleanupInterval: 3600000 // 1 hora
            });
        }

        // Configurar Alert System
        if (this.modules.alerts) {
            await this.modules.alerts.initialize({
                enableBrowserNotifications: true,
                enableDesktopNotifications: true,
                enableAudioAlerts: true,
                defaultRateLimit: 5 // máx 5 alertas por minuto
            });
        }

        // Configurar Volatility Analyzer - Verificar si el método existe
        if (this.modules.volatility && typeof this.modules.volatility.configure === 'function') {
            this.modules.volatility.configure({
                riskFreeRate: 0.02,
                confidenceLevel: 0.95,
                backtestPeriods: 252
            });
        } else if (this.modules.volatility) {
            console.log('⚠️ El método configure no está disponible en el módulo volatility');
        }

        // Configurar Arbitrage Detector - Verificar si el método existe
        if (this.modules.arbitrage && typeof this.modules.arbitrage.configure === 'function') {
            this.modules.arbitrage.configure({
                minProfitThreshold: 0.5, // 0.5%
                maxExecutionTime: 30000, // 30 segundos
                enableAutoAlert: true
            });
        } else if (this.modules.arbitrage) {
            console.log('⚠️ El método configure no está disponible en el módulo arbitrage');
        }

        // Configurar Whale Detector - Verificar si el método existe
        if (this.modules.whales && typeof this.modules.whales.configure === 'function') {
            this.modules.whales.configure({
                volumeThreshold: 1000000, // $1M
                priceImpactThreshold: 0.01, // 1%
                detectionInterval: 60000 // 1 minuto
            });
        } else if (this.modules.whales) {
            console.log('⚠️ El método configure no está disponible en el módulo whales');
        }
    }

    setupModuleConnections() {
        // Conectar Performance Monitor con otros módulos
        Object.values(this.modules).forEach(module => {
            if (module && module.setPerformanceMonitor) {
                module.setPerformanceMonitor(this.modules.performance);
            }
        });

        // Conectar Data Manager con analyzers
        [this.modules.volatility, this.modules.arbitrage, this.modules.whales].forEach(analyzer => {
            if (analyzer && analyzer.setDataSource) {
                analyzer.setDataSource(this.modules.dataManager);
            }
        });

        // Conectar Alert System con detectores
        [this.modules.volatility, this.modules.arbitrage, this.modules.whales].forEach(detector => {
            if (detector && detector.setAlertSystem) {
                detector.setAlertSystem(this.modules.alerts);
            }
        });

        // Conectar Portfolio Analytics con data manager
        if (this.modules.portfolio && this.modules.dataManager) {
            if (typeof this.modules.portfolio.setDataManager === 'function') {
                this.modules.portfolio.setDataManager(this.modules.dataManager);
            } else {
                // Establecer conexión directa si el método no existe
                this.modules.portfolio.dataManager = this.modules.dataManager;
                console.log('🔗 Data Manager conectado directamente al Portfolio Analytics');
            }
        }
    }

    setupEventListeners() {
        // Listener para nuevos datos de precio
        this.addEventListener('price-update', (data) => {
            this.handlePriceUpdate(data);
        });

        // Listener para alertas críticas
        this.addEventListener('critical-alert', (alert) => {
            this.handleCriticalAlert(alert);
        });

        // Listener para cambios de portfolio
        this.addEventListener('portfolio-change', (change) => {
            this.handlePortfolioChange(change);
        });

        // Listener para nuevas oportunidades de arbitraje
        this.addEventListener('arbitrage-opportunity', (opportunity) => {
            this.handleArbitrageOpportunity(opportunity);
        });

        // Listener para actividad de ballenas
        this.addEventListener('whale-activity', (activity) => {
            this.handleWhaleActivity(activity);
        });
    }

    // ============ EVENT HANDLERS ============

    async handlePriceUpdate(data) {
        const tasks = [];

        // Analizar volatilidad
        if (this.modules.volatility) {
            tasks.push(
                this.modules.volatility.analyzePriceData(data)
                    .catch(error => console.warn('Error en análisis de volatilidad:', error))
            );
        }

        // Detectar arbitraje
        if (this.modules.arbitrage) {
            tasks.push(
                this.modules.arbitrage.checkArbitrageOpportunities(data)
                    .catch(error => console.warn('Error en detección de arbitraje:', error))
            );
        }

        // Detectar actividad de ballenas
        if (this.modules.whales) {
            tasks.push(
                this.modules.whales.analyzeVolumeData(data)
                    .catch(error => console.warn('Error en detección de ballenas:', error))
            );
        }

        // Ejecutar análisis en paralelo
        if (this.modules.parallel && tasks.length > 0) {
            await this.modules.parallel.executeInParallel(tasks);
        }

        // Almacenar datos
        if (this.modules.dataManager) {
            await this.modules.dataManager.storePriceData(data);
        }
    }

    handleCriticalAlert(alert) {
        console.warn('🚨 Alerta crítica:', alert);
        
        // Mostrar en UI si está disponible
        if (window.app && window.app.showAlert) {
            window.app.showAlert(alert.message, 'error');
        }

        // Enviar notificación
        if (this.modules.alerts) {
            this.modules.alerts.sendCriticalAlert(alert);
        }
    }

    handlePortfolioChange(change) {
        // Actualizar analytics de portfolio
        if (this.modules.portfolio) {
            this.modules.portfolio.updatePortfolioValue(change.portfolioId, change.prices);
        }

        // Recalcular métricas de riesgo
        this.calculateRiskMetrics(change.portfolioId);
    }

    handleArbitrageOpportunity(opportunity) {
        console.log('💰 Oportunidad de arbitraje detectada:', opportunity);

        // Enviar alerta
        if (this.modules.alerts) {
            this.modules.alerts.sendAlert({
                type: 'arbitrage',
                title: 'Oportunidad de Arbitraje',
                message: `${opportunity.profit.toFixed(2)}% profit potential`,
                data: opportunity,
                priority: 'high'
            });
        }

        // Notificar a la aplicación principal
        if (window.app && window.app.handleArbitrageOpportunity) {
            window.app.handleArbitrageOpportunity(opportunity);
        }
    }

    handleWhaleActivity(activity) {
        console.log('🐋 Actividad de ballena detectada:', activity);

        // Enviar alerta si es significativa
        if (activity.impact > 0.02) { // >2% impacto
            if (this.modules.alerts) {
                this.modules.alerts.sendAlert({
                    type: 'whale',
                    title: 'Actividad de Ballena',
                    message: `Large transaction detected: ${activity.volume}`,
                    data: activity,
                    priority: 'medium'
                });
            }
        }

        // Actualizar análisis de mercado
        if (window.app && window.app.updateMarketAnalysis) {
            window.app.updateMarketAnalysis(activity);
        }
    }

    // ============ UTILIDADES PÚBLICAS ============

    async analyzeMarket(symbol = 'XRP') {
        const analysis = {};

        try {
            // Análisis de volatilidad
            if (this.modules.volatility) {
                analysis.volatility = await this.modules.volatility.getLatestAnalysis(symbol);
            }

            // Oportunidades de arbitraje
            if (this.modules.arbitrage) {
                analysis.arbitrage = await this.modules.arbitrage.getActiveOpportunities(symbol);
            }

            // Actividad de ballenas
            if (this.modules.whales) {
                analysis.whales = await this.modules.whales.getRecentActivity(symbol);
            }

            // Métricas de portfolio si existe
            const portfolios = this.getActivePortfolios();
            if (portfolios.length > 0) {
                analysis.portfolio = portfolios.map(id => 
                    this.modules.portfolio.calculateRiskMetrics(id)
                );
            }

            return analysis;

        } catch (error) {
            console.error('Error en análisis de mercado:', error);
            return { error: error.message };
        }
    }

    async runBacktest(config) {
        if (!this.modules.backtesting) {
            throw new Error('Módulo de backtesting no disponible');
        }

        return await this.modules.backtesting.runBacktest(config);
    }

    async optimizeStrategy(config) {
        if (!this.modules.backtesting) {
            throw new Error('Módulo de backtesting no disponible');
        }

        return await this.modules.backtesting.optimizeStrategy(config);
    }

    createPortfolio(name, holdings = {}, initialValue = 10000) {
        if (!this.modules.portfolio) {
            throw new Error('Módulo de portfolio no disponible');
        }

        return this.modules.portfolio.createPortfolio(name, holdings, initialValue);
    }

    getPortfolioAnalytics(portfolioId) {
        if (!this.modules.portfolio) {
            return null;
        }

        return this.modules.portfolio.calculateRiskMetrics(portfolioId);
    }

    async calculateRiskMetrics(portfolioId) {
        if (!this.modules.portfolio) return null;

        const metrics = this.modules.portfolio.calculateRiskMetrics(portfolioId);
        
        // Agregar análisis de volatilidad si está disponible
        if (this.modules.volatility && metrics) {
            const volatilityData = await this.modules.volatility.getPortfolioVolatility(portfolioId);
            metrics.advancedVolatility = volatilityData;
        }

        return metrics;
    }

    getSystemStatus() {
        const status = {
            initialized: this.isInitialized,
            modules: {},
            performance: null,
            errors: []
        };

        // Estado de cada módulo
        Object.entries(this.modules).forEach(([name, module]) => {
            status.modules[name] = {
                available: !!module,
                initialized: module?.isInitialized || false,
                lastActivity: module?.lastActivity || null
            };
        });

        // Métricas de performance
        if (this.modules.performance) {
            status.performance = this.modules.performance.getGlobalMetrics();
        }

        return status;
    }

    getActivePortfolios() {
        if (!this.modules.portfolio) return [];
        
        return Array.from(this.modules.portfolio.portfolios.keys());
    }

    // ============ EVENT SYSTEM ============

    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en event listener ${event}:`, error);
                }
            });
        }
    }

    // ============ ERROR HANDLING ============

    handleInitializationError(error) {
        console.error('Fallo en inicialización de módulos avanzados:', error);
        
        // Intentar inicialización parcial
        this.tryPartialInitialization();
    }

    tryPartialInitialization() {
        console.log('🔄 Intentando inicialización parcial...');

        // Simplemente marcar como inicializado y crear instancias globales
        this.isInitialized = true;
        
        // Crear instancias globales con los módulos disponibles
        this.createGlobalInstances();
        
        // Notificar a la aplicación principal
        this.notifyMainApp();
        
        const availableModules = Object.keys(this.modules).length;
        console.log(`✅ Inicialización parcial completada con ${availableModules} módulos`);
    }

    notifyMainApp() {
        // Notificar a la aplicación principal que los módulos están listos
        if (window.app && window.app.onAdvancedModulesReady) {
            window.app.onAdvancedModulesReady(this);
        }

        // Emitir evento global
        window.dispatchEvent(new CustomEvent('advancedModulesReady', {
            detail: this
        }));
    }

    // ============ CLEANUP ============

    cleanup() {
        // Limpiar event listeners
        this.eventListeners.clear();

        // Cleanup de módulos
        Object.values(this.modules).forEach(module => {
            if (module && module.cleanup) {
                try {
                    module.cleanup();
                } catch (error) {
                    console.warn('Error durante cleanup de módulo:', error);
                }
            }
        });

        this.isInitialized = false;
        console.log('🧹 Cleanup de módulos avanzados completado');
    }
}

// Crear instancia global e inicializar
window.advancedIntegration = new AdvancedTradingIntegration();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.advancedIntegration.initializeModules();
    });
} else {
    // DOM ya está listo
    setTimeout(() => {
        window.advancedIntegration.initializeModules();
    }, 100);
}

console.log('🔗 Advanced Trading Integration cargado');
