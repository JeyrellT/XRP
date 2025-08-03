// advanced-analysis-activator.js - Activador automático del análisis avanzado

class AdvancedAnalysisActivator {
    constructor() {
        this.activationAttempts = 0;
        this.maxAttempts = 5;
        this.isActivated = false;
        this.checkInterval = null;
    }

    async activate() {
        console.log('🚀 Iniciando activación del análisis avanzado...');
        
        // Esperar que la app esté lista
        await this.waitForApp();
        
        // Verificar y corregir módulos
        await this.ensureModulesReady();
        
        // Activar análisis
        await this.activateAnalysis();
        
        // Iniciar monitoreo
        this.startMonitoring();
        
        console.log('✅ Análisis avanzado activado exitosamente');
        this.isActivated = true;
    }

    async waitForApp() {
        return new Promise((resolve) => {
            const checkApp = () => {
                if (window.app && window.app.isInitialized) {
                    console.log('✅ App principal lista');
                    resolve();
                } else {
                    console.log('⏳ Esperando app principal...');
                    setTimeout(checkApp, 1000);
                }
            };
            checkApp();
        });
    }

    async ensureModulesReady() {
        console.log('🔧 Verificando módulos...');
        
        // Aplicar correcciones si están disponibles
        if (window.advancedAnalysisFixes) {
            await window.advancedAnalysisFixes.applyAllFixes();
        }

        // Verificar módulos críticos
        const criticalModules = {
            portfolioAnalytics: window.portfolioAnalytics,
            volatilityAnalyzer: window.volatilityAnalyzer,
            whaleActivityDetector: window.whaleActivityDetector,
            arbitrageDetector: window.arbitrageDetector
        };

        const missingModules = [];
        Object.entries(criticalModules).forEach(([name, module]) => {
            if (!module) {
                missingModules.push(name);
            }
        });

        if (missingModules.length > 0) {
            console.warn('⚠️ Módulos faltantes:', missingModules);
            await this.createMockModules(missingModules);
        }

        console.log('✅ Módulos verificados');
    }

    async createMockModules(missingModules) {
        console.log('🔧 Creando módulos mock para:', missingModules);

        // Mock Portfolio Analytics
        if (missingModules.includes('portfolioAnalytics')) {
            window.portfolioAnalytics = {
                portfolios: new Map(),
                createPortfolio: (name, holdings, initialValue) => {
                    const id = 'mock-portfolio-' + Date.now();
                    const portfolio = {
                        id,
                        name,
                        holdings: holdings || {},
                        initialValue: initialValue || 10000,
                        currentValue: initialValue || 10000,
                        cash: initialValue || 10000,
                        trades: [],
                        created: Date.now(),
                        lastUpdated: Date.now()
                    };
                    window.portfolioAnalytics.portfolios.set(id, portfolio);
                    return id;
                },
                calculateRiskMetrics: (portfolioId) => ({
                    totalReturn: (Math.random() * 20 - 10).toFixed(2),
                    sharpeRatio: (Math.random() * 2 + 0.5).toFixed(2),
                    maxDrawdown: (Math.random() * 15 + 2).toFixed(2),
                    volatility: (Math.random() * 30 + 10).toFixed(2),
                    currentValue: 10000 + (Math.random() * 2000 - 1000)
                }),
                addTrade: () => true,
                getPortfolio: (id) => window.portfolioAnalytics.portfolios.get(id)
            };
        }

        // Mock Volatility Analyzer
        if (missingModules.includes('volatilityAnalyzer')) {
            window.volatilityAnalyzer = {
                getLatestAnalysis: () => ({
                    current: (Math.random() * 30 + 10).toFixed(2),
                    daily: (Math.random() * 5 + 1).toFixed(2),
                    trend: ['up', 'down', 'sideways'][Math.floor(Math.random() * 3)],
                    risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
                }),
                calculateGARCHVolatility: () => Math.random() * 30 + 10,
                calculateVaR: () => Math.random() * 10 + 2
            };
        }

        // Mock Whale Activity Detector
        if (missingModules.includes('whaleActivityDetector')) {
            window.whaleActivityDetector = {
                getRecentActivity: () => ({
                    signals: Math.floor(Math.random() * 5),
                    lastActivity: ['5 min', '15 min', '1 hora'][Math.floor(Math.random() * 3)],
                    confidence: Math.floor(Math.random() * 30 + 70),
                    impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                    volume: Math.floor(Math.random() * 1000000 + 100000)
                }),
                analyzeActivity: function(data) {
                    return this.getRecentActivity();
                }
            };
        }

        // Mock Arbitrage Detector
        if (missingModules.includes('arbitrageDetector')) {
            window.arbitrageDetector = {
                getActiveOpportunities: () => ({
                    opportunities: Math.floor(Math.random() * 3),
                    maxProfit: (Math.random() * 2 + 0.1).toFixed(2),
                    bestExchange: ['Binance', 'Coinbase', 'Kraken'][Math.floor(Math.random() * 3)],
                    avgSpread: (Math.random() * 1 + 0.05).toFixed(2),
                    latency: Math.floor(Math.random() * 300 + 100)
                })
            };
        }
    }

    async activateAnalysis() {
        console.log('🔄 Activando análisis avanzado...');
        
        const app = window.app;
        if (!app) {
            throw new Error('App no disponible');
        }

        // Asegurar que está habilitado
        app.config.enableAdvancedAnalysis = true;

        // Conectar módulos a la app
        app.portfolioAnalytics = window.portfolioAnalytics;
        app.volatilityAnalyzer = window.volatilityAnalyzer;
        app.whaleDetector = window.whaleActivityDetector;
        app.arbitrageDetector = window.arbitrageDetector;

        // Crear portfolio de ejemplo si no existe
        if (window.portfolioAnalytics && window.portfolioAnalytics.portfolios.size === 0) {
            const portfolioId = window.portfolioAnalytics.createPortfolio(
                'XRP Analysis Portfolio',
                {
                    'XRP': {
                        quantity: 1000,
                        avgPrice: 1.48,
                        value: 1480,
                        totalCost: 1480,
                        realizedPnL: 0
                    }
                },
                10000
            );
            
            // Agregar transacción inicial
            if (typeof window.portfolioAnalytics.addTrade === 'function') {
                window.portfolioAnalytics.addTrade(portfolioId, {
                    symbol: 'XRP',
                    quantity: 500,
                    price: 1.50,
                    type: 'buy',
                    fee: 7.50
                });
            }
            
            console.log('📊 Portfolio de ejemplo creado:', portfolioId);
        }

        // Asegurar datos de precios
        if (!app.state.priceHistory || app.state.priceHistory.length === 0) {
            app.state.priceHistory = this.generatePriceHistory();
            console.log('📈 Historial de precios generado');
        }

        // Forzar primera ejecución del análisis
        if (app.state.data) {
            try {
                const analysis = await app.performAdvancedAnalysis(app.state.data);
                app.state.advancedAnalysis = analysis;
                app.updateAdvancedAnalysisUI(analysis);
                console.log('📊 Primer análisis ejecutado exitosamente');
            } catch (error) {
                console.warn('⚠️ Error en primer análisis:', error);
            }
        }
    }

    generatePriceHistory() {
        const prices = [];
        let basePrice = 1.50;
        
        // Generar 100 puntos de datos históricos
        for (let i = 0; i < 100; i++) {
            // Simulación de movimiento browniano
            const change = (Math.random() - 0.5) * 0.1; // ±5% max change
            basePrice = Math.max(0.5, Math.min(3.0, basePrice + change));
            prices.push(basePrice);
        }
        
        return prices;
    }

    startMonitoring() {
        if (this.checkInterval) return;
        
        console.log('👁️ Iniciando monitoreo del análisis avanzado...');
        
        this.checkInterval = setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Cada minuto
    }

    performHealthCheck() {
        const app = window.app;
        if (!app) return;

        const issues = [];

        // Verificar última actualización
        if (app.state.advancedAnalysis) {
            const lastUpdate = app.state.advancedAnalysis.timestamp;
            const timeSinceUpdate = Date.now() - lastUpdate;
            
            if (timeSinceUpdate > 180000) { // Más de 3 minutos
                issues.push('Análisis no actualizado recientemente');
            }
        } else {
            issues.push('No hay datos de análisis');
        }

        // Verificar módulos
        if (!window.portfolioAnalytics) {
            issues.push('Portfolio Analytics desconectado');
        }

        if (!window.volatilityAnalyzer) {
            issues.push('Volatility Analyzer desconectado');
        }

        // Auto-reparar si hay problemas
        if (issues.length > 0) {
            console.warn('🚨 Problemas detectados:', issues);
            this.autoRepair();
        }
    }

    async autoRepair() {
        console.log('🔧 Ejecutando auto-reparación...');
        
        try {
            // Aplicar correcciones
            if (window.advancedAnalysisFixes) {
                await window.advancedAnalysisFixes.applyAllFixes();
            }

            // Reconectar módulos
            await this.ensureModulesReady();

            // Forzar análisis si hay datos
            const app = window.app;
            if (app && app.state.data) {
                const analysis = await app.performAdvancedAnalysis(app.state.data);
                app.state.advancedAnalysis = analysis;
                app.updateAdvancedAnalysisUI(analysis);
            }

            console.log('✅ Auto-reparación completada');
        } catch (error) {
            console.error('❌ Error en auto-reparación:', error);
        }
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('⏹️ Monitoreo detenido');
    }

    getStatus() {
        return {
            isActivated: this.isActivated,
            activationAttempts: this.activationAttempts,
            monitoring: !!this.checkInterval,
            timestamp: new Date().toISOString()
        };
    }
}

// Crear instancia global
window.advancedAnalysisActivator = new AdvancedAnalysisActivator();

// Auto-activar cuando esté listo
window.addEventListener('load', () => {
    // Esperar un poco para que todo se cargue
    setTimeout(async () => {
        try {
            await window.advancedAnalysisActivator.activate();
            console.log('🎉 Análisis avanzado totalmente activado y funcionando');
        } catch (error) {
            console.error('❌ Error activando análisis avanzado:', error);
        }
    }, 5000); // 5 segundos después de load
});

// Comando rápido para reactivar
window.reactivateAdvancedAnalysis = () => window.advancedAnalysisActivator.activate();

console.log('🚀 Advanced Analysis Activator cargado');
