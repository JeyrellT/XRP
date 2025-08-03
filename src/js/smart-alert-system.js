// smart-alert-system.js - Sistema de alertas inteligente multi-canal

class SmartAlertSystem {
    constructor() {
        this.alerts = new Map();
        this.subscribers = new Map();
        this.rateLimiter = new Map();
        this.alertHistory = [];
        this.performance = new PerformanceMonitor();
        this.notificationPermission = 'default';
        
        this.config = {
            maxAlertsPerMinute: 10,
            cooldownPeriod: 300000, // 5 minutos
            historyRetention: 86400000, // 24 horas
            soundEnabled: true,
            pushEnabled: true,
            emailEnabled: false
        };
        
        this.channels = {
            browser: new BrowserNotificationChannel(),
            sound: new SoundNotificationChannel(),
            visual: new VisualNotificationChannel(),
            webhook: new WebhookNotificationChannel(),
            console: new ConsoleNotificationChannel()
        };
        
        this.initialize();
    }

    async initialize() {
        // Solicitar permisos de notificación
        await this.requestNotificationPermission();
        
        // Configurar service worker si está disponible
        this.setupServiceWorker();
        
        // Configurar limpieza automática
        this.scheduleCleanup();
        
        console.log('🔔 Smart Alert System inicializado');
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            this.notificationPermission = await Notification.requestPermission();
            console.log(`🔔 Permisos de notificación: ${this.notificationPermission}`);
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('🔧 Service Worker registrado para notificaciones persistentes');
            }).catch(error => {
                console.warn('⚠️ Error registrando Service Worker:', error);
            });
        }
    }

    // ============ CREACIÓN DE ALERTAS ============

    createPriceAlert(config) {
        const alert = {
            id: this.generateId(),
            type: 'price',
            symbol: config.symbol,
            condition: config.condition,
            target: config.target,
            timeframe: config.timeframe || '1m',
            active: true,
            cooldown: config.cooldown || this.config.cooldownPeriod,
            lastTriggered: null,
            filters: config.filters || [],
            channels: config.channels || ['browser', 'sound'],
            priority: config.priority || 'medium',
            metadata: config.metadata || {},
            created: Date.now()
        };

        this.alerts.set(alert.id, alert);
        console.log(`✅ Alerta de precio creada: ${alert.symbol} ${alert.condition} ${alert.target}`);
        return alert.id;
    }

    createTechnicalAlert(symbol, indicator, condition, value, options = {}) {
        return this.createPriceAlert({
            symbol,
            condition: `${indicator}_${condition}`,
            target: value,
            timeframe: options.timeframe || '5m',
            filters: [
                { type: 'volume', min: options.volumeThreshold || '2x_average' },
                { type: 'volatility', max: options.volatilityThreshold || '3_std_dev' }
            ],
            channels: options.channels || ['browser', 'sound', 'visual'],
            priority: options.priority || 'high',
            metadata: { indicator, originalCondition: condition }
        });
    }

    createWhaleAlert(symbol, volumeThreshold, options = {}) {
        return this.createPriceAlert({
            symbol,
            condition: 'whale_activity',
            target: volumeThreshold,
            filters: [
                { type: 'volume', min: volumeThreshold },
                { type: 'impact', min: options.priceImpact || 0.5 }
            ],
            channels: options.channels || ['browser', 'sound', 'visual', 'webhook'],
            priority: 'critical',
            metadata: { alertType: 'whale_detection', ...options.metadata }
        });
    }

    createArbitrageAlert(minProfitPercent, options = {}) {
        return this.createPriceAlert({
            symbol: 'ARBITRAGE',
            condition: 'profit_opportunity',
            target: minProfitPercent,
            filters: [
                { type: 'confidence', min: options.minConfidence || 0.8 },
                { type: 'latency', max: options.maxLatency || 2000 }
            ],
            channels: options.channels || ['browser', 'sound', 'webhook'],
            priority: 'high',
            metadata: { alertType: 'arbitrage_opportunity' }
        });
    }

    createVolatilityAlert(symbol, threshold, direction = 'both', options = {}) {
        return this.createPriceAlert({
            symbol,
            condition: `volatility_${direction}`,
            target: threshold,
            timeframe: options.timeframe || '1m',
            filters: [
                { type: 'volume', min: options.volumeFilter || '1.5x_average' }
            ],
            channels: options.channels || ['browser', 'visual'],
            priority: options.priority || 'medium',
            metadata: { alertType: 'volatility_spike', direction }
        });
    }

    // ============ PROCESAMIENTO DE DATOS ============

    async processMarketData(marketData) {
        const profile = this.performance.startProfile('process_market_alerts');
        
        try {
            const triggeredAlerts = [];
            
            for (const [alertId, alert] of this.alerts) {
                if (!alert.active || !this.canTrigger(alert)) continue;
                
                const shouldTrigger = await this.evaluateAlert(alert, marketData);
                
                if (shouldTrigger) {
                    await this.triggerAlert(alert, marketData);
                    triggeredAlerts.push(alert);
                    this.updateCooldown(alert);
                }
            }
            
            profile.end();
            return triggeredAlerts;
            
        } catch (error) {
            profile.end();
            console.error('Error processing market alerts:', error);
            return [];
        }
    }

    async evaluateAlert(alert, marketData) {
        try {
            // Aplicar filtros primero
            if (!this.passesFilters(alert, marketData)) {
                return false;
            }
            
            // Evaluar condición principal
            return this.evaluateCondition(alert, marketData);
            
        } catch (error) {
            console.error(`Error evaluating alert ${alert.id}:`, error);
            return false;
        }
    }

    passesFilters(alert, marketData) {
        return alert.filters.every(filter => {
            switch (filter.type) {
                case 'volume':
                    return this.evaluateVolumeFilter(filter, marketData);
                case 'volatility':
                    return this.evaluateVolatilityFilter(filter, marketData);
                case 'confidence':
                    return this.evaluateConfidenceFilter(filter, marketData);
                case 'latency':
                    return this.evaluateLatencyFilter(filter, marketData);
                case 'impact':
                    return this.evaluateImpactFilter(filter, marketData);
                default:
                    return true;
            }
        });
    }

    evaluateVolumeFilter(filter, marketData) {
        const currentVolume = marketData.volume || 0;
        const avgVolume = marketData.avgVolume || currentVolume;
        
        if (typeof filter.min === 'string' && filter.min.includes('x_average')) {
            const multiplier = parseFloat(filter.min.split('x')[0]);
            return currentVolume >= avgVolume * multiplier;
        }
        
        return currentVolume >= (filter.min || 0);
    }

    evaluateVolatilityFilter(filter, marketData) {
        const volatility = marketData.volatility || 0;
        const avgVolatility = marketData.avgVolatility || volatility;
        
        if (typeof filter.max === 'string' && filter.max.includes('std_dev')) {
            const stdDevs = parseFloat(filter.max.split('_')[0]);
            return volatility <= avgVolatility + (marketData.volatilityStdDev || 0) * stdDevs;
        }
        
        return volatility <= (filter.max || Infinity);
    }

    evaluateConfidenceFilter(filter, marketData) {
        return (marketData.confidence || 1) >= (filter.min || 0);
    }

    evaluateLatencyFilter(filter, marketData) {
        return (marketData.latency || 0) <= (filter.max || Infinity);
    }

    evaluateImpactFilter(filter, marketData) {
        return Math.abs(marketData.priceImpact || 0) >= (filter.min || 0);
    }

    evaluateCondition(alert, marketData) {
        const { condition, target, symbol } = alert;
        const currentPrice = marketData.price || marketData.usd || 0;
        
        switch (condition) {
            case 'above':
                return currentPrice > target;
            case 'below':
                return currentPrice < target;
            case 'cross_above':
                return this.evaluateCrossover(alert, marketData, true);
            case 'cross_below':
                return this.evaluateCrossover(alert, marketData, false);
            case 'whale_activity':
                return this.evaluateWhaleActivity(alert, marketData);
            case 'profit_opportunity':
                return this.evaluateArbitrageOpportunity(alert, marketData);
            case 'volatility_spike':
            case 'volatility_both':
                return this.evaluateVolatilitySpike(alert, marketData);
            default:
                return this.evaluateTechnicalCondition(alert, marketData);
        }
    }

    evaluateCrossover(alert, marketData, isAbove) {
        const currentPrice = marketData.price || marketData.usd || 0;
        const previousPrice = marketData.previousPrice || currentPrice;
        
        if (isAbove) {
            return previousPrice <= alert.target && currentPrice > alert.target;
        } else {
            return previousPrice >= alert.target && currentPrice < alert.target;
        }
    }

    evaluateWhaleActivity(alert, marketData) {
        const volume = marketData.volume || 0;
        const priceImpact = Math.abs(marketData.priceChange || 0);
        
        return volume >= alert.target && priceImpact >= 0.5;
    }

    evaluateArbitrageOpportunity(alert, marketData) {
        return marketData.arbitrageProfit >= alert.target;
    }

    evaluateVolatilitySpike(alert, marketData) {
        const volatility = marketData.volatility || 0;
        return volatility >= alert.target;
    }

    evaluateTechnicalCondition(alert, marketData) {
        const [indicator, condition] = alert.condition.split('_');
        const indicatorValue = marketData.indicators?.[indicator] || 0;
        
        switch (condition) {
            case 'overbought':
                return indicatorValue >= alert.target;
            case 'oversold':
                return indicatorValue <= alert.target;
            case 'divergence':
                return this.evaluateDivergence(indicator, marketData);
            default:
                return false;
        }
    }

    evaluateDivergence(indicator, marketData) {
        // Implementación básica de detección de divergencias
        const indicatorTrend = marketData.indicators?.[indicator + '_trend'] || 'neutral';
        const priceTrend = marketData.priceTrend || 'neutral';
        
        return (indicatorTrend === 'up' && priceTrend === 'down') ||
               (indicatorTrend === 'down' && priceTrend === 'up');
    }

    // ============ DISPARO DE ALERTAS ============

    async triggerAlert(alert, data) {
        const profile = this.performance.startProfile('trigger_alert');
        
        try {
            const notification = this.createNotification(alert, data);
            
            // Enviar a todos los canales configurados
            const channelPromises = alert.channels.map(channelName => {
                const channel = this.channels[channelName];
                return channel ? channel.send(notification) : Promise.resolve();
            });

            await Promise.all(channelPromises);
            
            // Registrar en historial
            this.recordAlertHistory(alert, notification, data);
            
            // Notificar a suscriptores
            this.notifySubscribers(alert, notification);
            
            alert.lastTriggered = Date.now();
            
            profile.end();
            console.log(`🚨 Alerta disparada: ${alert.symbol} - ${alert.condition}`);
            
        } catch (error) {
            profile.end();
            console.error('Error triggering alert:', error);
        }
    }

    createNotification(alert, data) {
        const message = this.formatAlertMessage(alert, data);
        
        return {
            id: this.generateId(),
            alertId: alert.id,
            title: this.formatAlertTitle(alert),
            body: message,
            icon: this.getAlertIcon(alert),
            badge: './assets/crypto-badge.png',
            tag: alert.symbol,
            priority: alert.priority,
            timestamp: Date.now(),
            data: {
                alert,
                marketData: data,
                action: this.getRecommendedAction(alert, data)
            },
            actions: this.getNotificationActions(alert)
        };
    }

    formatAlertTitle(alert) {
        const symbols = {
            '🚨': 'critical',
            '⚠️': 'high',
            '📢': 'medium',
            'ℹ️': 'low'
        };
        
        const symbol = Object.keys(symbols).find(key => symbols[key] === alert.priority) || '📢';
        return `${symbol} ${alert.symbol} Alert`;
    }

    formatAlertMessage(alert, data) {
        const currentPrice = data.price || data.usd || 0;
        
        switch (alert.condition) {
            case 'above':
                return `Price crossed above $${alert.target.toFixed(6)} (current: $${currentPrice.toFixed(6)})`;
            case 'below':
                return `Price dropped below $${alert.target.toFixed(6)} (current: $${currentPrice.toFixed(6)})`;
            case 'whale_activity':
                return `Large volume detected: ${this.formatVolume(data.volume)} with ${data.priceChange?.toFixed(2)}% price impact`;
            case 'profit_opportunity':
                return `Arbitrage opportunity: ${data.arbitrageProfit?.toFixed(3)}% profit potential`;
            case 'volatility_spike':
                return `High volatility detected: ${data.volatility?.toFixed(2)}% (threshold: ${alert.target}%)`;
            default:
                return `Technical signal: ${alert.condition} triggered at $${currentPrice.toFixed(6)}`;
        }
    }

    formatVolume(volume) {
        if (volume >= 1e9) return `$${(volume/1e9).toFixed(2)}B`;
        if (volume >= 1e6) return `$${(volume/1e6).toFixed(2)}M`;
        if (volume >= 1e3) return `$${(volume/1e3).toFixed(2)}K`;
        return `$${volume.toFixed(2)}`;
    }

    getAlertIcon(alert) {
        const icons = {
            price: './assets/price-icon.png',
            whale_activity: './assets/whale-icon.png',
            profit_opportunity: './assets/arbitrage-icon.png',
            volatility: './assets/volatility-icon.png'
        };
        
        return icons[alert.type] || './assets/crypto-icon.png';
    }

    getRecommendedAction(alert, data) {
        switch (alert.condition) {
            case 'above':
            case 'cross_above':
                return 'CONSIDER_SELL';
            case 'below':
            case 'cross_below':
                return 'CONSIDER_BUY';
            case 'whale_activity':
                return data.priceChange > 0 ? 'MONITOR_MOMENTUM' : 'CAUTION_ADVISED';
            case 'profit_opportunity':
                return 'EXECUTE_ARBITRAGE';
            default:
                return 'MONITOR';
        }
    }

    getNotificationActions(alert) {
        const actions = [
            { action: 'view', title: 'View Details' }
        ];
        
        if (alert.type === 'price') {
            actions.push({ action: 'disable', title: 'Disable Alert' });
        }
        
        if (alert.condition === 'profit_opportunity') {
            actions.push({ action: 'execute', title: 'Execute Trade' });
        }
        
        return actions;
    }

    // ============ GESTIÓN DE CANALES ============

    addNotificationChannel(name, channel) {
        this.channels[name] = channel;
    }

    removeNotificationChannel(name) {
        delete this.channels[name];
    }

    // ============ GESTIÓN DE COOLDOWN ============

    canTrigger(alert) {
        if (!alert.lastTriggered) return true;
        
        const timeSinceLastTrigger = Date.now() - alert.lastTriggered;
        return timeSinceLastTrigger >= alert.cooldown;
    }

    updateCooldown(alert) {
        alert.lastTriggered = Date.now();
        
        // Rate limiting por tipo de alerta
        const rateLimitKey = `${alert.symbol}_${alert.type}`;
        const now = Date.now();
        
        if (!this.rateLimiter.has(rateLimitKey)) {
            this.rateLimiter.set(rateLimitKey, []);
        }
        
        const triggers = this.rateLimiter.get(rateLimitKey);
        triggers.push(now);
        
        // Limpiar triggers antiguos (más de 1 minuto)
        const filtered = triggers.filter(timestamp => now - timestamp < 60000);
        this.rateLimiter.set(rateLimitKey, filtered);
        
        // Deshabilitar temporalmente si hay demasiados triggers
        if (filtered.length > this.config.maxAlertsPerMinute) {
            alert.active = false;
            setTimeout(() => {
                alert.active = true;
            }, this.config.cooldownPeriod);
        }
    }

    // ============ HISTORIAL Y ESTADÍSTICAS ============

    recordAlertHistory(alert, notification, data) {
        this.alertHistory.push({
            alertId: alert.id,
            notificationId: notification.id,
            symbol: alert.symbol,
            condition: alert.condition,
            timestamp: Date.now(),
            marketData: {
                price: data.price || data.usd,
                volume: data.volume,
                change: data.priceChange
            }
        });
        
        // Mantener solo las últimas 1000 entradas
        if (this.alertHistory.length > 1000) {
            this.alertHistory.shift();
        }
    }

    getAlertStatistics(timeWindow = 86400000) { // 24 horas
        const cutoff = Date.now() - timeWindow;
        const recentAlerts = this.alertHistory.filter(h => h.timestamp > cutoff);
        
        const stats = {
            totalAlerts: recentAlerts.length,
            alertsBySymbol: {},
            alertsByCondition: {},
            alertsByHour: new Array(24).fill(0),
            avgFrequency: 0
        };
        
        recentAlerts.forEach(alert => {
            // Por símbolo
            stats.alertsBySymbol[alert.symbol] = (stats.alertsBySymbol[alert.symbol] || 0) + 1;
            
            // Por condición
            stats.alertsByCondition[alert.condition] = (stats.alertsByCondition[alert.condition] || 0) + 1;
            
            // Por hora
            const hour = new Date(alert.timestamp).getHours();
            stats.alertsByHour[hour]++;
        });
        
        stats.avgFrequency = recentAlerts.length / (timeWindow / 3600000); // alertas por hora
        
        return stats;
    }

    // ============ SUSCRIPTORES ============

    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        
        this.subscribers.get(eventType).add(callback);
        
        return () => {
            this.subscribers.get(eventType)?.delete(callback);
        };
    }

    notifySubscribers(alert, notification) {
        const subscribers = this.subscribers.get('alert_triggered');
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback({ alert, notification });
                } catch (error) {
                    console.error('Error in alert subscriber:', error);
                }
            });
        }
    }

    // ============ GESTIÓN DE ALERTAS ============

    enableAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.active = true;
            return true;
        }
        return false;
    }

    disableAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.active = false;
            return true;
        }
        return false;
    }

    deleteAlert(alertId) {
        return this.alerts.delete(alertId);
    }

    getAlert(alertId) {
        return this.alerts.get(alertId);
    }

    getAllAlerts() {
        return Array.from(this.alerts.values());
    }

    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => alert.active);
    }

    // ============ UTILIDADES ============

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    scheduleCleanup() {
        setInterval(() => {
            this.cleanupHistory();
        }, 3600000); // Cada hora
    }

    cleanupHistory() {
        const cutoff = Date.now() - this.config.historyRetention;
        this.alertHistory = this.alertHistory.filter(h => h.timestamp > cutoff);
    }

    // ============ CLEANUP ============

    cleanup() {
        this.alerts.clear();
        this.subscribers.clear();
        this.rateLimiter.clear();
        this.alertHistory = [];
        
        Object.values(this.channels).forEach(channel => {
            if (channel.cleanup) channel.cleanup();
        });
    }
}

// ============ CANALES DE NOTIFICACIÓN ============

class BrowserNotificationChannel {
    async send(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notif = new Notification(notification.title, {
                body: notification.body,
                icon: notification.icon,
                badge: notification.badge,
                tag: notification.tag,
                data: notification.data,
                actions: notification.actions
            });
            
            // Auto-cerrar después de 10 segundos
            setTimeout(() => notif.close(), 10000);
            
            notif.onclick = () => {
                window.focus();
                this.handleNotificationClick(notification);
                notif.close();
            };
        }
    }
    
    handleNotificationClick(notification) {
        // Destacar el asset en la UI
        if (window.app && notification.data.alert.symbol) {
            window.app.highlightAsset(notification.data.alert.symbol);
        }
    }
}

class SoundNotificationChannel {
    constructor() {
        this.sounds = {
            critical: './assets/sounds/critical.mp3',
            high: './assets/sounds/high.mp3',
            medium: './assets/sounds/medium.mp3',
            low: './assets/sounds/low.mp3'
        };
    }
    
    async send(notification) {
        try {
            const soundFile = this.sounds[notification.priority] || this.sounds.medium;
            const audio = new Audio(soundFile);
            audio.volume = 0.7;
            await audio.play();
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }
}

class VisualNotificationChannel {
    async send(notification) {
        // Crear notificación visual en la UI
        this.showVisualNotification(notification);
    }
    
    showVisualNotification(notification) {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.priority}`;
        notificationEl.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${notification.title}</span>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-body">${notification.body}</div>
        `;
        
        container.appendChild(notificationEl);
        
        // Auto-remover después de 8 segundos
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.remove();
            }
        }, 8000);
        
        // Agregar listener de cierre
        notificationEl.querySelector('.notification-close').onclick = () => {
            notificationEl.remove();
        };
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }
}

class WebhookNotificationChannel {
    constructor() {
        this.webhookUrls = [];
    }
    
    addWebhook(url) {
        this.webhookUrls.push(url);
    }
    
    async send(notification) {
        const payload = {
            text: `${notification.title}: ${notification.body}`,
            timestamp: notification.timestamp,
            priority: notification.priority,
            data: notification.data
        };
        
        const promises = this.webhookUrls.map(url => 
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(error => console.warn('Webhook failed:', error))
        );
        
        await Promise.all(promises);
    }
}

class ConsoleNotificationChannel {
    async send(notification) {
        const style = this.getConsoleStyle(notification.priority);
        console.log(`%c${notification.title}`, style);
        console.log(notification.body);
        
        if (notification.data) {
            console.log('Data:', notification.data);
        }
    }
    
    getConsoleStyle(priority) {
        const styles = {
            critical: 'color: white; background: red; font-weight: bold; padding: 2px 6px;',
            high: 'color: white; background: orange; font-weight: bold; padding: 2px 6px;',
            medium: 'color: white; background: blue; padding: 2px 6px;',
            low: 'color: black; background: lightgray; padding: 2px 6px;'
        };
        
        return styles[priority] || styles.medium;
    }
}

// Crear instancia global
window.smartAlertSystem = new SmartAlertSystem();

console.log('🔔 Smart Alert System cargado');
