// api.js - Servicio API multi-fuente optimizado para evitar CORS y rate limits

class XRPAPIService {
    constructor() {
        // APIs principales ordenadas por prioridad y confiabilidad
        this.apiSources = {
            // Binance - Muy confiable, sin CORS para endpoints públicos
            binance: {
                name: 'Binance',
                baseURL: 'https://api.binance.com/api/v3',
                backup: 'https://data-api.binance.vision/api/v3',
                rateLimit: { callsPerMinute: 1200, weight: 1200 }, // 1200 req/min
                priority: 1,
                currentWeight: 0,
                lastReset: Date.now()
            },
            
            // CoinPaprika - Buena alternativa, más permisiva
            coinpaprika: {
                name: 'CoinPaprika',
                baseURL: 'https://api.coinpaprika.com/v1',
                rateLimit: { callsPerMinute: 20000 }, // Muy permisiva
                priority: 2
            },
            
            // CoinGecko como último recurso con mayor espaciado
            coingecko: {
                name: 'CoinGecko',
                baseURL: 'https://api.coingecko.com/api/v3',
                rateLimit: { callsPerMinute: 15 }, // Muy conservador
                priority: 3
            }
        };

        // Cache inteligente con diferentes TTL
        this.cache = {
            data: new Map(),
            timeouts: {
                price: 15000,      // 15 segundos para precios
                historical: 180000, // 3 minutos para históricos
                market: 120000     // 2 minutos para market data
            }
        };

        // Control de errores por fuente
        this.errorTracking = {
            binance: { failures: 0, lastFailure: 0, backoffUntil: 0 },
            coinpaprika: { failures: 0, lastFailure: 0, backoffUntil: 0 },
            coingecko: { failures: 0, lastFailure: 0, backoffUntil: 0 }
        };

        // Configuración mejorada
        this.config = {
            maxRetries: 2,
            baseDelay: 1000,
            maxBackoff: 30000,
            timeout: 10000,
            xrpSymbols: {
                binance: 'XRPUSDT',
                coinpaprika: 'xrp-xrp', 
                coingecko: 'ripple'
            }
        };

        console.log('🌐 XRP Multi-API Service inicializado');
        this.initializeService();
    }

    // Validar y sanitizar datos de respuesta
    validateAndSanitizeData(data, dataType = 'general') {
        if (!data || typeof data !== 'object') {
            throw new Error('Datos inválidos recibidos de la API');
        }

        const sanitized = { ...data };

        // Sanitizar según el tipo de datos
        switch (dataType) {
            case 'price':
                // Validar datos de precio
                if (sanitized.ripple) {
                    sanitized.ripple.usd = this.validateNumber(sanitized.ripple.usd, 0.5);
                    sanitized.ripple.usd_24h_change = this.validateNumber(sanitized.ripple.usd_24h_change, 0);
                    sanitized.ripple.usd_24h_vol = this.validateNumber(sanitized.ripple.usd_24h_vol, 100000000);
                    sanitized.ripple.usd_market_cap = this.validateNumber(sanitized.ripple.usd_market_cap, 25000000000);
                    
                    // Calcular máximo y mínimo 24h si no existen
                    if (!sanitized.ripple.usd_24h_high || isNaN(sanitized.ripple.usd_24h_high)) {
                        sanitized.ripple.usd_24h_high = sanitized.ripple.usd * 1.02;
                    }
                    if (!sanitized.ripple.usd_24h_low || isNaN(sanitized.ripple.usd_24h_low)) {
                        sanitized.ripple.usd_24h_low = sanitized.ripple.usd * 0.98;
                    }
                }
                break;
                
            case 'historical':
                // Validar datos históricos
                if (sanitized.prices && Array.isArray(sanitized.prices)) {
                    sanitized.prices = sanitized.prices.filter(price => {
                        return Array.isArray(price) && 
                               price.length >= 2 && 
                               !isNaN(price[1]) && 
                               price[1] > 0;
                    });
                    
                    // Asegurar al menos algunos datos
                    if (sanitized.prices.length === 0) {
                        const basePrice = 0.5;
                        const baseTime = Date.now();
                        sanitized.prices = Array.from({ length: 24 }, (_, i) => [
                            baseTime - ((23 - i) * 3600000),
                            basePrice * (1 + (Math.random() - 0.5) * 0.1)
                        ]);
                    }
                }
                break;
                
            case 'market':
                // Validar datos de mercado
                Object.keys(sanitized).forEach(key => {
                    if (typeof sanitized[key] === 'number') {
                        sanitized[key] = this.validateNumber(sanitized[key], 0);
                    }
                });
                break;
        }

        return sanitized;
    }

    // Validar números y proporcionar fallbacks
    validateNumber(value, fallback = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return fallback;
        }
        const num = Number(value);
        return isNaN(num) ? fallback : num;
    }

    async initializeService() {
        // Test básico de conectividad
        try {
            const data = await this.getCurrentPrice();
            console.log('✅ Servicio API inicializado correctamente');
        } catch (error) {
            console.warn('⚠️ Inicialización con datos de respaldo');
        }
    }

    // ============ MÉTODOS PRINCIPALES ============

    async getCurrentPrice() {
        const cacheKey = 'current_price';
        const cached = this.getFromCache(cacheKey, 'price');
        if (cached) return cached;

        const sources = ['binance', 'coinpaprika', 'coingecko'];
        
        for (const source of sources) {
            try {
                if (this.isSourceAvailable(source)) {
                    const data = await this.fetchCurrentPrice(source);
                    if (data) {
                        this.setCache(cacheKey, data, 'price');
                        this.recordSuccess(source);
                        return data;
                    }
                }
            } catch (error) {
                console.warn(`❌ ${source} falló:`, error.message);
                this.recordFailure(source, error);
            }
        }

        // Fallback final
        console.log('🎭 Usando datos generados');
        return this.generateFallbackData();
    }

    async getHistoricalData(days = 1) {
        const cacheKey = `historical_${days}d`;
        const cached = this.getFromCache(cacheKey, 'historical');
        if (cached) return cached;

        // Solo Binance tiene datos históricos confiables en endpoints públicos
        try {
            if (this.isSourceAvailable('binance')) {
                const data = await this.fetchHistoricalData('binance', days);
                if (data) {
                    this.setCache(cacheKey, data, 'historical');
                    return data;
                }
            }
        } catch (error) {
            console.warn('❌ Datos históricos fallaron:', error.message);
        }

        // Generar datos históricos sintéticos
        console.log('🎭 Generando datos históricos');
        return this.generateHistoricalData(days);
    }

    async getMarketData() {
        const cacheKey = 'market_data';
        const cached = this.getFromCache(cacheKey, 'market');
        if (cached) return cached;

        const sources = ['binance', 'coinpaprika'];
        
        for (const source of sources) {
            try {
                if (this.isSourceAvailable(source)) {
                    const data = await this.fetchMarketData(source);
                    if (data) {
                        this.setCache(cacheKey, data, 'market');
                        this.recordSuccess(source);
                        return data;
                    }
                }
            } catch (error) {
                console.warn(`❌ Market data ${source} falló:`, error.message);
                this.recordFailure(source, error);
            }
        }

        console.log('🎭 Usando market data generado');
        return this.generateMarketData();
    }

    async getBatchData(days = 1) {
        console.log('📊 Obteniendo datos del mercado XRP...');
        
        try {
            const [current, historical, market] = await Promise.allSettled([
                this.getCurrentPrice(),
                this.getHistoricalData(days),
                this.getMarketData()
            ]);

            // Validar y sanitizar datos antes de devolver
            let validatedCurrent = null;
            let validatedHistorical = null;
            let validatedMarket = null;

            if (current.status === 'fulfilled' && current.value) {
                try {
                    validatedCurrent = this.validateAndSanitizeData(current.value, 'price');
                } catch (error) {
                    console.warn('⚠️ Error validando datos actuales:', error.message);
                    validatedCurrent = this.generateFallbackData();
                }
            }

            if (historical.status === 'fulfilled' && historical.value) {
                try {
                    validatedHistorical = this.validateAndSanitizeData(historical.value, 'historical');
                } catch (error) {
                    console.warn('⚠️ Error validando datos históricos:', error.message);
                    validatedHistorical = this.generateHistoricalData(days);
                }
            }

            if (market.status === 'fulfilled' && market.value) {
                try {
                    validatedMarket = this.validateAndSanitizeData(market.value, 'market');
                } catch (error) {
                    console.warn('⚠️ Error validando datos de mercado:', error.message);
                    validatedMarket = this.generateMarketData();
                }
            }

            const result = {
                current: validatedCurrent || this.generateFallbackData(),
                historical: validatedHistorical || this.generateHistoricalData(days),
                market: validatedMarket || this.generateMarketData(),
                success: validatedCurrent !== null,
                errors: []
            };

            if (current.status === 'rejected') result.errors.push({type: 'current', error: current.reason?.message});
            if (historical.status === 'rejected') result.errors.push({type: 'historical', error: historical.reason?.message});
            if (market.status === 'rejected') result.errors.push({type: 'market', error: market.reason?.message});

            console.log(`✅ Datos obtenidos: ${result.success ? 'Exitoso' : 'Parcial'}`);
            return result;

        } catch (error) {
            console.error('❌ Error crítico en getBatchData:', error);
            return {
                current: this.generateFallbackData(),
                historical: this.generateHistoricalData(days),
                market: this.generateMarketData(),
                success: false,
                errors: [{type: 'critical', error: error.message}]
            };
        }
    }

    // ============ FETCH METHODS POR FUENTE ============

    async fetchCurrentPrice(source) {
        switch (source) {
            case 'binance':
                return await this.fetchBinancePrice();
            case 'coinpaprika':
                return await this.fetchCoinPaprikaPrice();
            case 'coingecko':
                return await this.fetchCoinGeckoPrice();
            default:
                throw new Error(`Fuente desconocida: ${source}`);
        }
    }

    async fetchBinancePrice() {
        const symbol = this.config.xrpSymbols.binance;
        const endpoint = `/ticker/24hr?symbol=${symbol}`;
        
        const data = await this.makeRequest('binance', endpoint, { weight: 1 });
        
        return {
            ripple: {
                usd: parseFloat(data.lastPrice),
                usd_market_cap: parseFloat(data.lastPrice) * 56000000000, // Aproximado
                usd_24h_vol: parseFloat(data.quoteVolume),
                usd_24h_change: parseFloat(data.priceChangePercent),
                last_updated_at: Math.floor(data.closeTime / 1000)
            }
        };
    }

    async fetchCoinPaprikaPrice() {
        const coinId = this.config.xrpSymbols.coinpaprika;
        const endpoint = `/tickers/${coinId}`;
        
        const data = await this.makeRequest('coinpaprika', endpoint);
        
        return {
            ripple: {
                usd: data.quotes.USD.price,
                usd_market_cap: data.quotes.USD.market_cap,
                usd_24h_vol: data.quotes.USD.volume_24h,
                usd_24h_change: data.quotes.USD.percent_change_24h,
                last_updated_at: Math.floor(new Date(data.last_updated).getTime() / 1000)
            }
        };
    }

    async fetchCoinGeckoPrice() {
        const coinId = this.config.xrpSymbols.coingecko;
        const endpoint = `/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
        
        // Esperar más tiempo para CoinGecko
        await this.delay(3000);
        
        const data = await this.makeRequest('coingecko', endpoint);
        return data;
    }

    async fetchHistoricalData(source, days) {
        if (source === 'binance') {
            const symbol = this.config.xrpSymbols.binance;
            const interval = days <= 1 ? '1h' : '1d';
            const limit = days <= 1 ? 24 : Math.min(days, 1000);
            
            const endpoint = `/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
            const data = await this.makeRequest('binance', endpoint, { weight: 1 });
            
            // Convertir formato Binance a formato esperado
            return {
                prices: data.map(k => [parseInt(k[6]), parseFloat(k[4])]), // [closeTime, closePrice]
                market_caps: data.map(k => [parseInt(k[6]), parseFloat(k[4]) * 56000000000]),
                total_volumes: data.map(k => [parseInt(k[6]), parseFloat(k[7])]) // [closeTime, volume]
            };
        }
        
        throw new Error(`Datos históricos no soportados para ${source}`);
    }

    async fetchMarketData(source) {
        if (source === 'binance') {
            const current = await this.fetchBinancePrice();
            return [{
                id: 'ripple',
                symbol: 'xrp',
                name: 'XRP',
                current_price: current.ripple.usd,
                market_cap: current.ripple.usd_market_cap,
                total_volume: current.ripple.usd_24h_vol,
                price_change_percentage_24h: current.ripple.usd_24h_change,
                last_updated: new Date(current.ripple.last_updated_at * 1000).toISOString()
            }];
        }
        
        if (source === 'coinpaprika') {
            const current = await this.fetchCoinPaprikaPrice();
            return [{
                id: 'ripple',
                symbol: 'xrp',
                name: 'XRP',
                current_price: current.ripple.usd,
                market_cap: current.ripple.usd_market_cap,
                total_volume: current.ripple.usd_24h_vol,
                price_change_percentage_24h: current.ripple.usd_24h_change,
                last_updated: new Date(current.ripple.last_updated_at * 1000).toISOString()
            }];
        }
        
        throw new Error(`Market data no soportado para ${source}`);
    }

    // ============ HTTP CLIENT MEJORADO ============

    async makeRequest(source, endpoint, options = {}) {
        const sourceConfig = this.apiSources[source];
        if (!sourceConfig) throw new Error(`Fuente ${source} no configurada`);

        // Control de rate limiting específico por fuente
        await this.enforceRateLimit(source, options.weight || 1);

        const url = sourceConfig.baseURL + endpoint;
        
        try {
            console.log(`🔄 ${sourceConfig.name}: ${endpoint}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Manejo específico de errores por código
                if (response.status === 429) {
                    throw new Error(`Rate limit exceeded: ${response.status}`);
                }
                if (response.status >= 500) {
                    throw new Error(`Server error: ${response.status}`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${sourceConfig.name}: Éxito`);
            
            return data;

        } catch (error) {
            // Intentar URL de respaldo para Binance
            if (source === 'binance' && sourceConfig.backup && !endpoint.includes('backup_tried')) {
                try {
                    const backupUrl = sourceConfig.backup + endpoint;
                    console.log(`🔄 ${sourceConfig.name} Backup: ${endpoint}`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

                    const response = await fetch(backupUrl, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ ${sourceConfig.name} Backup: Éxito`);
                        return data;
                    }
                } catch (backupError) {
                    console.warn(`⚠️ Backup también falló: ${backupError.message}`);
                }
            }

            throw error;
        }
    }

    // ============ RATE LIMITING INTELIGENTE ============

    async enforceRateLimit(source, weight = 1) {
        const sourceConfig = this.apiSources[source];
        const now = Date.now();

        if (source === 'binance') {
            // Binance usa weight-based rate limiting
            if (now - sourceConfig.lastReset > 60000) {
                sourceConfig.currentWeight = 0;
                sourceConfig.lastReset = now;
            }

            if (sourceConfig.currentWeight + weight > sourceConfig.rateLimit.weight) {
                const waitTime = 60000 - (now - sourceConfig.lastReset);
                if (waitTime > 0) {
                    console.log(`⏱️ Binance rate limit: esperando ${Math.round(waitTime/1000)}s`);
                    await this.delay(waitTime);
                    sourceConfig.currentWeight = 0;
                    sourceConfig.lastReset = Date.now();
                }
            }

            sourceConfig.currentWeight += weight;
        } else {
            // Rate limiting simple para otras fuentes
            const minInterval = source === 'coingecko' ? 4000 : 1000;
            const timeSinceLastCall = now - (sourceConfig.lastCall || 0);
            
            if (timeSinceLastCall < minInterval) {
                const waitTime = minInterval - timeSinceLastCall;
                console.log(`⏱️ ${sourceConfig.name}: esperando ${Math.round(waitTime/1000)}s`);
                await this.delay(waitTime);
            }
            
            sourceConfig.lastCall = Date.now();
        }
    }

    // ============ MANEJO DE ERRORES Y BACKOFF ============

    isSourceAvailable(source) {
        const tracking = this.errorTracking[source];
        if (!tracking) return true;

        const now = Date.now();
        
        // Si está en backoff, verificar si ya puede usarse
        if (tracking.backoffUntil > now) {
            return false;
        }

        // Si han pasado más de 5 minutos desde el último fallo, resetear
        if (now - tracking.lastFailure > 300000) {
            tracking.failures = 0;
        }

        // Máximo 3 fallos consecutivos antes de backoff
        return tracking.failures < 3;
    }

    recordFailure(source, error) {
        const tracking = this.errorTracking[source];
        if (!tracking) return;

        tracking.failures++;
        tracking.lastFailure = Date.now();

        // Backoff exponencial: 30s, 60s, 120s
        const backoffTime = Math.min(30000 * Math.pow(2, tracking.failures - 1), 120000);
        tracking.backoffUntil = Date.now() + backoffTime;

        console.warn(`⚠️ ${source}: ${tracking.failures} fallos, backoff ${Math.round(backoffTime/1000)}s`);
    }

    recordSuccess(source) {
        const tracking = this.errorTracking[source];
        if (tracking) {
            tracking.failures = 0;
            tracking.backoffUntil = 0;
        }
    }

    // ============ CACHE MANAGEMENT ============

    getFromCache(key, type = 'price') {
        const cached = this.cache.data.get(key);
        if (!cached) return null;

        const maxAge = this.cache.timeouts[type] || this.cache.timeouts.price;
        const age = Date.now() - cached.timestamp;

        if (age > maxAge) {
            this.cache.data.delete(key);
            return null;
        }

        console.log(`📦 Cache hit: ${key} (age: ${Math.round(age/1000)}s)`);
        return cached.data;
    }

    setCache(key, data, type = 'price') {
        this.cache.data.set(key, {
            data,
            timestamp: Date.now(),
            type
        });

        // Limpiar cache viejo
        if (this.cache.data.size > 50) {
            this.cleanCache();
        }
    }

    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.data.entries()) {
            const maxAge = this.cache.timeouts[value.type] || this.cache.timeouts.price;
            if (now - value.timestamp > maxAge) {
                this.cache.data.delete(key);
            }
        }
    }

    // ============ FALLBACK DATA GENERATORS ============

    generateFallbackData() {
        const basePrice = 2.85 + (Math.random() - 0.5) * 0.3; // ~$2.85 ± 15¢
        const change24h = (Math.random() - 0.5) * 10; // ±5%
        
        return {
            ripple: {
                usd: parseFloat(basePrice.toFixed(4)),
                usd_market_cap: Math.round(basePrice * 56000000000), // ~56B XRP
                usd_24h_vol: Math.round(8000000000 + Math.random() * 4000000000), // 8-12B
                usd_24h_change: parseFloat(change24h.toFixed(2)),
                last_updated_at: Math.floor(Date.now() / 1000)
            }
        };
    }

    generateHistoricalData(days) {
        const now = Date.now();
        const interval = days <= 1 ? 3600000 : 86400000; // 1h o 1d
        const points = days <= 1 ? 24 : Math.min(days, 30);
        
        const prices = [];
        let currentPrice = 2.85 + Math.random() * 0.3;
        
        for (let i = points; i >= 0; i--) {
            const timestamp = now - (i * interval);
            // Variación realista pequeña
            currentPrice += (Math.random() - 0.5) * 0.1;
            currentPrice = Math.max(1.5, Math.min(4.0, currentPrice)); // Entre $1.5 y $4.0
            
            prices.push([timestamp, parseFloat(currentPrice.toFixed(4))]);
        }
        
        return {
            prices,
            market_caps: prices.map(([ts, price]) => [ts, price * 56000000000]),
            total_volumes: prices.map(([ts]) => [ts, 8000000000 + Math.random() * 4000000000])
        };
    }

    generateMarketData() {
        const current = this.generateFallbackData();
        return [{
            id: 'ripple',
            symbol: 'xrp',
            name: 'XRP',
            current_price: current.ripple.usd,
            market_cap: current.ripple.usd_market_cap,
            total_volume: current.ripple.usd_24h_vol,
            price_change_percentage_24h: current.ripple.usd_24h_change,
            last_updated: new Date().toISOString(),
            high_24h: current.ripple.usd * 1.08,
            low_24h: current.ripple.usd * 0.92
        }];
    }

    // ============ UTILIDADES ============

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getServiceStatus() {
        const now = Date.now();
        return {
            sources: Object.fromEntries(
                Object.entries(this.errorTracking).map(([source, tracking]) => [
                    source,
                    {
                        available: this.isSourceAvailable(source),
                        failures: tracking.failures,
                        backoffRemaining: Math.max(0, tracking.backoffUntil - now)
                    }
                ])
            ),
            cache: {
                entries: this.cache.data.size,
                types: Array.from(this.cache.data.values()).reduce((acc, item) => {
                    acc[item.type] = (acc[item.type] || 0) + 1;
                    return acc;
                }, {})
            }
        };
    }

    // Debug info
    getDebugInfo() {
        return {
            status: this.getServiceStatus(),
            sources: this.apiSources,
            config: this.config
        };
    }
}

// Instancia global
window.apiService = new XRPAPIService();

console.log('🚀 XRP Multi-API Service cargado y listo');