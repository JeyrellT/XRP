// config.js - Configuración centralizada de la aplicación

class AppConfig {
    constructor() {
        this.api = {
            baseURL: 'https://api.coingecko.com/api/v3',
            corsProxies: [
                '',  // Llamada directa primero
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?',
                'https://api.codetabs.com/v1/proxy?quest='
            ],
            // Rate limiting mejorado para CoinGecko
            rateLimiting: {
                callsPerMinute: 25,        // Margen de seguridad (de 30 máximo)
                minInterval: 2500,         // 2.5 segundos entre llamadas
                backoffMultiplier: 2,      // Multiplicador para backoff exponencial
                maxBackoffDelay: 60000     // Máximo 1 minuto de espera
            },
            maxRetries: 3,
            retryDelay: 2000,
            cacheTimeout: 60000, // 1 minuto
            timeout: 15000, // 15 segundos
            // Configuración específica para diferentes endpoints
            endpointConfig: {
                ping: { cacheTimeout: 600000, priority: 'low' },      // 10 minutos
                price: { cacheTimeout: 30000, priority: 'high' },     // 30 segundos
                historical: { cacheTimeout: 300000, priority: 'medium' }, // 5 minutos
                market: { cacheTimeout: 180000, priority: 'medium' }  // 3 minutos
            }
        };

        this.app = {
            updateInterval: 30000, // 30 segundos
            alertDuration: 5000,   // 5 segundos
            animationDuration: 300,
            maxDataPoints: 100,
            priceDecimalPlaces: 6,
            volumeFormat: 'compact',
            autoReconnect: true,
            performanceMonitoring: true,
            maxErrorsBeforeStop: 5,
            debounceTime: 300,
            // Configuración de validación de datos
            validation: {
                enableDataValidation: true,
                strictMode: false,              // Si es true, falla con datos inválidos
                autoCorrection: true,           // Intentar corregir datos automáticamente
                logValidationErrors: true,      // Log errores de validación
                minHistoricalPoints: 10,        // Mínimo de puntos históricos necesarios
                priceRangeLimits: {            // Límites razonables para XRP
                    min: 0.1,
                    max: 10.0
                }
            },
            // Configuración de manejo de errores
            errorHandling: {
                enableGlobalErrorCatch: true,
                showUserFriendlyErrors: true,
                enableErrorReporting: false,    // Para futuro analytics
                errorRetryStrategy: 'exponential', // 'exponential' | 'linear' | 'fixed'
                maxConsecutiveErrors: 3,
                errorCooldownPeriod: 30000      // 30 segundos entre reintentos
            }
        };

        this.charts = {
            colors: {
                primary: '#00d4ff',
                secondary: '#0099ff',
                success: '#00ff88',
                danger: '#ff3366',
                warning: '#ffcc00',
                background: 'rgba(21, 25, 35, 0.7)',
                border: 'rgba(255, 255, 255, 0.06)'
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            responsive: true,
            maintainAspectRatio: false
        };

        this.indicators = {
            rsi: {
                period: 14,
                overbought: 70,
                oversold: 30
            },
            macd: {
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9
            },
            bollinger: {
                period: 20,
                stdDev: 2
            },
            stochastic: {
                kPeriod: 14,
                dPeriod: 3,
                smooth: 3
            },
            ema: {
                shortPeriod: 12,
                longPeriod: 26
            }
        };

        this.trading = {
            riskRewardRatio: 2.0,
            stopLossPercent: 2.0,
            takeProfitPercent: 4.0,
            signalStrengthThreshold: 3,
            volumeThreshold: 1000000,
            priceChangeThreshold: 5.0 // porcentaje
        };

        this.storage = {
            prefix: 'xrp_monitor_',
            keys: {
                userConfig: 'user_config',
                watchlist: 'watchlist',
                alerts: 'alerts',
                cache: 'cache_data'
            }
        };

        this.notifications = {
            enabled: true,
            sound: true,
            desktop: true,
            types: {
                priceAlert: true,
                technicalSignal: true,
                systemError: true,
                connectionLost: false
            }
        };
    }

    // Obtener configuración completa
    getAll() {
        return {
            api: this.api,
            app: this.app,
            charts: this.charts,
            indicators: this.indicators,
            trading: this.trading,
            storage: this.storage,
            notifications: this.notifications
        };
    }

    // Actualizar configuración
    update(section, key, value) {
        if (this[section] && this[section][key] !== undefined) {
            this[section][key] = value;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Guardar en localStorage
    saveToStorage() {
        try {
            const config = this.getAll();
            localStorage.setItem(this.storage.prefix + 'config', JSON.stringify(config));
        } catch (error) {
            console.warn('No se pudo guardar la configuración:', error);
        }
    }

    // Cargar desde localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storage.prefix + 'config');
            if (stored) {
                const config = JSON.parse(stored);
                Object.assign(this, config);
            }
        } catch (error) {
            console.warn('No se pudo cargar la configuración guardada:', error);
        }
    }

    // Validar configuración
    validate() {
        const errors = [];
        
        if (this.app.updateInterval < 10000) {
            errors.push('Intervalo de actualización muy bajo (mínimo 10 segundos)');
        }
        
        if (this.api.maxRetries > 10) {
            errors.push('Demasiados reintentos configurados (máximo 10)');
        }
        
        if (this.trading.riskRewardRatio < 1) {
            errors.push('Ratio riesgo/beneficio debe ser mayor a 1');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Resetear a valores por defecto
    reset() {
        const defaultConfig = new AppConfig();
        Object.assign(this, defaultConfig);
        this.saveToStorage();
    }
}

// Instancia global de configuración
window.appConfig = new AppConfig();

// Cargar configuración guardada al inicializar
window.appConfig.loadFromStorage();

// Validar configuración
const validation = window.appConfig.validate();
if (!validation.valid) {
    console.warn('Problemas de configuración detectados:', validation.errors);
}

console.log('⚙️ Configuración de aplicación cargada');
