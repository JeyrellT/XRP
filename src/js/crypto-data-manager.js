// crypto-data-manager.js - Gestión de datos con IndexedDB optimizado

class CryptoDataManager {
    constructor() {
        this.dbName = 'CryptoAnalyticsDB';
        this.version = 1;
        this.db = null;
        this.cache = new Map();
        this.performance = new PerformanceMonitor();
        this.compressionEnabled = true;
        this.maxCacheSize = 100; // MB
        
        this.stores = {
            priceData: 'priceData',
            indicators: 'indicators',
            patterns: 'patterns',
            analysis: 'analysis',
            portfolios: 'portfolios',
            alerts: 'alerts',
            metadata: 'metadata'
        };
    }

    async initialize() {
        const profile = this.performance.startProfile('indexeddb_init');
        
        try {
            const db = await this.openDatabase();
            this.db = db;
            
            // Configurar limpieza automática
            this.scheduleCleanup();
            
            profile.end();
            console.log('🗄️ CryptoDataManager inicializado');
            return db;
            
        } catch (error) {
            profile.end();
            console.error('Error inicializando IndexedDB:', error);
            throw error;
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store para datos OHLCV
                if (!db.objectStoreNames.contains(this.stores.priceData)) {
                    const priceStore = db.createObjectStore(this.stores.priceData, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    priceStore.createIndex('symbol_timestamp', ['symbol', 'timestamp'], {unique: true});
                    priceStore.createIndex('symbol', 'symbol');
                    priceStore.createIndex('timestamp', 'timestamp');
                    priceStore.createIndex('timeframe', 'timeframe');
                }

                // Store para indicadores calculados
                if (!db.objectStoreNames.contains(this.stores.indicators)) {
                    const indicatorStore = db.createObjectStore(this.stores.indicators, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    indicatorStore.createIndex('symbol_indicator_period', 
                        ['symbol', 'indicator', 'period'], {unique: true});
                    indicatorStore.createIndex('symbol_timestamp', ['symbol', 'timestamp']);
                }
                
                // Store para patrones detectados
                if (!db.objectStoreNames.contains(this.stores.patterns)) {
                    const patternStore = db.createObjectStore(this.stores.patterns, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    patternStore.createIndex('symbol_date', ['symbol', 'date']);
                    patternStore.createIndex('pattern_type', 'patternType');
                    patternStore.createIndex('confidence', 'confidence');
                }

                // Store para análisis completo
                if (!db.objectStoreNames.contains(this.stores.analysis)) {
                    const analysisStore = db.createObjectStore(this.stores.analysis, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    analysisStore.createIndex('symbol_timestamp', ['symbol', 'timestamp']);
                    analysisStore.createIndex('analysisType', 'analysisType');
                }

                // Store para carteras/portfolios
                if (!db.objectStoreNames.contains(this.stores.portfolios)) {
                    const portfolioStore = db.createObjectStore(this.stores.portfolios, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    portfolioStore.createIndex('name', 'name', {unique: true});
                    portfolioStore.createIndex('created', 'created');
                }

                // Store para alertas
                if (!db.objectStoreNames.contains(this.stores.alerts)) {
                    const alertStore = db.createObjectStore(this.stores.alerts, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    alertStore.createIndex('symbol', 'symbol');
                    alertStore.createIndex('active', 'active');
                    alertStore.createIndex('triggerTime', 'triggerTime');
                }

                // Store para metadata y configuración
                if (!db.objectStoreNames.contains(this.stores.metadata)) {
                    const metadataStore = db.createObjectStore(this.stores.metadata, {
                        keyPath: 'key'
                    });
                }
            };
        });
    }

    // ============ OPERACIONES DE DATOS DE PRECIOS ============

    async storePriceData(symbol, data, timeframe = '1h') {
        const profile = this.performance.startProfile('store_price_data');
        
        try {
            if (!this.db) await this.initialize();
            
            const transaction = this.db.transaction([this.stores.priceData], 'readwrite');
            const store = transaction.objectStore('priceData');
            
            const promises = data.map(candle => {
                const record = {
                    symbol,
                    timeframe,
                    timestamp: candle.timestamp || candle[0],
                    open: candle.open || candle[1],
                    high: candle.high || candle[2],
                    low: candle.low || candle[3],
                    close: candle.close || candle[4],
                    volume: candle.volume || candle[5] || 0,
                    compressed: this.compressionEnabled ? this.compressCandle(candle) : null,
                    created: Date.now()
                };
                
                return this.addRecord(store, record);
            });

            await Promise.all(promises);
            
            // Actualizar cache
            const cacheKey = `prices_${symbol}_${timeframe}`;
            this.updateCache(cacheKey, data);
            
            profile.end();
            return data.length;
            
        } catch (error) {
            profile.end();
            console.error('Error storing price data:', error);
            throw error;
        }
    }

    async getHistoricalData(symbol, startDate, endDate, timeframe = '1h') {
        const profile = this.performance.startProfile('get_historical_data');
        
        try {
            const cacheKey = `prices_${symbol}_${timeframe}_${startDate}_${endDate}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos cache
                profile.end();
                return cached.data;
            }

            if (!this.db) await this.initialize();
            
            const transaction = this.db.transaction([this.stores.priceData], 'readonly');
            const store = transaction.objectStore('priceData');
            const index = store.index('symbol_timestamp');
            
            const range = IDBKeyRange.bound(
                [symbol, startDate.getTime ? startDate.getTime() : startDate],
                [symbol, endDate.getTime ? endDate.getTime() : endDate]
            );

            const results = await this.getCursorResults(index, range);
            
            // Descomprimir si es necesario
            const decompressedResults = results.map(record => {
                if (record.compressed) {
                    return this.decompressCandle(record.compressed);
                }
                return {
                    timestamp: record.timestamp,
                    open: record.open,
                    high: record.high,
                    low: record.low,
                    close: record.close,
                    volume: record.volume
                };
            });

            // Actualizar cache
            this.updateCache(cacheKey, decompressedResults);
            
            profile.end();
            return decompressedResults;
            
        } catch (error) {
            profile.end();
            console.error('Error getting historical data:', error);
            return [];
        }
    }

    // ============ OPERACIONES DE INDICADORES ============

    async storeIndicators(symbol, indicatorData, timestamp = Date.now()) {
        const profile = this.performance.startProfile('store_indicators');
        
        try {
            if (!this.db) await this.initialize();
            
            const transaction = this.db.transaction([this.stores.indicators], 'readwrite');
            const store = transaction.objectStore('indicators');
            
            const promises = Object.entries(indicatorData).map(([indicator, data]) => {
                const record = {
                    symbol,
                    indicator,
                    period: data.period || 14,
                    timestamp,
                    values: data.values || data,
                    metadata: data.metadata || {},
                    compressed: this.compressionEnabled ? this.compressData(data) : null,
                    created: Date.now()
                };
                
                return this.addRecord(store, record);
            });

            await Promise.all(promises);
            
            profile.end();
            return Object.keys(indicatorData).length;
            
        } catch (error) {
            profile.end();
            console.error('Error storing indicators:', error);
            throw error;
        }
    }

    async getIndicators(symbol, indicators = [], maxAge = 3600000) { // 1 hora por defecto
        const profile = this.performance.startProfile('get_indicators');
        
        try {
            if (!this.db) await this.initialize();
            
            const transaction = this.db.transaction([this.stores.indicators], 'readonly');
            const store = transaction.objectStore('indicators');
            const index = store.index('symbol_timestamp');
            
            const minTimestamp = Date.now() - maxAge;
            const range = IDBKeyRange.bound([symbol, minTimestamp], [symbol, Date.now()]);
            
            const results = await this.getCursorResults(index, range);
            
            // Filtrar por indicadores específicos si se proporcionan
            const filteredResults = indicators.length > 0 
                ? results.filter(record => indicators.includes(record.indicator))
                : results;
            
            // Organizar por indicador
            const indicatorData = {};
            filteredResults.forEach(record => {
                const data = record.compressed 
                    ? this.decompressData(record.compressed)
                    : record.values;
                    
                indicatorData[record.indicator] = {
                    values: data,
                    period: record.period,
                    timestamp: record.timestamp,
                    metadata: record.metadata
                };
            });
            
            profile.end();
            return indicatorData;
            
        } catch (error) {
            profile.end();
            console.error('Error getting indicators:', error);
            return {};
        }
    }

    // ============ OPERACIONES DE PATRONES ============

    async storePatterns(symbol, patterns, timestamp = Date.now()) {
        const profile = this.performance.startProfile('store_patterns');
        
        try {
            if (!this.db) await this.initialize();
            
            const transaction = this.db.transaction([this.stores.patterns], 'readwrite');
            const store = transaction.objectStore('patterns');
            
            const promises = patterns.map(pattern => {
                const record = {
                    symbol,
                    patternType: pattern.pattern || pattern.type,
                    signal: pattern.signal,
                    confidence: pattern.confidence || pattern.strength,
                    index: pattern.index,
                    timestamp,
                    date: new Date(timestamp).toISOString().split('T')[0],
                    metadata: pattern.metadata || {},
                    created: Date.now()
                };
                
                return this.addRecord(store, record);
            });

            await Promise.all(promises);
            
            profile.end();
            return patterns.length;
            
        } catch (error) {
            profile.end();
            console.error('Error storing patterns:', error);
            throw error;
        }
    }

    async getPatterns(symbol, patternTypes = [], days = 30) {
        const profile = this.performance.startProfile('get_patterns');
        
        try {
            if (!this.db) await this.initialize();
            
            const transaction = this.db.transaction([this.stores.patterns], 'readonly');
            const store = transaction.objectStore('patterns');
            const index = store.index('symbol_date');
            
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = new Date().toISOString().split('T')[0];
            
            const range = IDBKeyRange.bound([symbol, startDateStr], [symbol, endDateStr]);
            const results = await this.getCursorResults(index, range);
            
            // Filtrar por tipos de patrón si se especifican
            const filteredResults = patternTypes.length > 0 
                ? results.filter(record => patternTypes.includes(record.patternType))
                : results;
            
            profile.end();
            return filteredResults;
            
        } catch (error) {
            profile.end();
            console.error('Error getting patterns:', error);
            return [];
        }
    }

    // ============ OPERACIONES DE ANÁLISIS ============

    async storeAnalysis(symbol, analysisData, analysisType = 'complete') {
        const profile = this.performance.startProfile('store_analysis');
        
        try {
            if (!this.db) await this.initialize();
            
            const transaction = this.db.transaction([this.stores.analysis], 'readwrite');
            const store = transaction.objectStore('analysis');
            
            const record = {
                symbol,
                analysisType,
                timestamp: Date.now(),
                data: analysisData,
                compressed: this.compressionEnabled ? this.compressData(analysisData) : null,
                created: Date.now()
            };
            
            await this.addRecord(store, record);
            
            profile.end();
            return record;
            
        } catch (error) {
            profile.end();
            console.error('Error storing analysis:', error);
            throw error;
        }
    }

    async getLatestAnalysis(symbol, analysisType = 'complete', maxAge = 1800000) { // 30 minutos
        const profile = this.performance.startProfile('get_latest_analysis');
        
        try {
            if (!this.db) await this.initialize();
            
            const transaction = this.db.transaction([this.stores.analysis], 'readonly');
            const store = transaction.objectStore('analysis');
            const index = store.index('symbol_timestamp');
            
            const minTimestamp = Date.now() - maxAge;
            const range = IDBKeyRange.bound([symbol, minTimestamp], [symbol, Date.now()]);
            
            const results = await this.getCursorResults(index, range);
            const filteredResults = results.filter(record => record.analysisType === analysisType);
            
            if (filteredResults.length === 0) {
                profile.end();
                return null;
            }
            
            // Obtener el más reciente
            const latest = filteredResults.sort((a, b) => b.timestamp - a.timestamp)[0];
            const data = latest.compressed 
                ? this.decompressData(latest.compressed)
                : latest.data;
            
            profile.end();
            return { ...latest, data };
            
        } catch (error) {
            profile.end();
            console.error('Error getting latest analysis:', error);
            return null;
        }
    }

    // ============ UTILIDADES HELPER ============

    addRecord(store, record) {
        return new Promise((resolve, reject) => {
            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getCursorResults(indexOrStore, range = null) {
        return new Promise((resolve, reject) => {
            const results = [];
            const request = range 
                ? indexOrStore.openCursor(range)
                : indexOrStore.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // ============ COMPRESIÓN DE DATOS ============

    compressCandle(candle) {
        // Compresión delta simple para velas
        const base = candle.open || candle[1];
        return {
            base,
            high_delta: ((candle.high || candle[2]) - base) / base,
            low_delta: ((candle.low || candle[3]) - base) / base,
            close_delta: ((candle.close || candle[4]) - base) / base,
            volume: candle.volume || candle[5] || 0,
            timestamp: candle.timestamp || candle[0]
        };
    }

    decompressCandle(compressed) {
        const base = compressed.base;
        return {
            timestamp: compressed.timestamp,
            open: base,
            high: base * (1 + compressed.high_delta),
            low: base * (1 + compressed.low_delta),
            close: base * (1 + compressed.close_delta),
            volume: compressed.volume
        };
    }

    compressData(data) {
        // Compresión JSON con deflate (si está disponible)
        try {
            const jsonStr = JSON.stringify(data);
            return this.compressionEnabled && window.CompressionStream 
                ? this.deflateString(jsonStr)
                : jsonStr;
        } catch (error) {
            return JSON.stringify(data);
        }
    }

    decompressData(compressed) {
        try {
            const jsonStr = typeof compressed === 'string' 
                ? compressed 
                : this.inflateString(compressed);
            return JSON.parse(jsonStr);
        } catch (error) {
            console.warn('Error decompressing data:', error);
            return compressed;
        }
    }

    deflateString(str) {
        // Implementación básica de compresión
        // En un entorno real, usar CompressionStream
        return str;
    }

    inflateString(compressed) {
        // Implementación básica de descompresión
        return compressed;
    }

    // ============ GESTIÓN DE CACHE ============

    updateCache(key, data, ttl = 300000) { // 5 minutos por defecto
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        
        // Limpiar cache si es demasiado grande
        if (this.cache.size > 1000) {
            this.cleanupCache();
        }
    }

    cleanupCache() {
        const now = Date.now();
        const keysToDelete = [];
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > value.ttl) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    // ============ LIMPIEZA Y MANTENIMIENTO ============

    scheduleCleanup() {
        // Limpiar datos antiguos cada hora
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000);
    }

    async cleanupOldData() {
        try {
            const cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 días
            
            // Limpiar datos de precios antiguos
            await this.deleteOldRecords(this.stores.priceData, 'timestamp', cutoffDate);
            
            // Limpiar indicadores antiguos
            await this.deleteOldRecords(this.stores.indicators, 'timestamp', cutoffDate);
            
            // Limpiar patrones antiguos
            await this.deleteOldRecords(this.stores.patterns, 'timestamp', cutoffDate);
            
            // Limpiar análisis antiguos
            await this.deleteOldRecords(this.stores.analysis, 'timestamp', cutoffDate);
            
            console.log('🧹 Limpieza de datos antiguos completada');
            
        } catch (error) {
            console.error('Error en limpieza automática:', error);
        }
    }

    async deleteOldRecords(storeName, indexName, cutoffDate) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        
        const range = IDBKeyRange.upperBound(cutoffDate);
        const request = index.openCursor(range);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // ============ ESTADÍSTICAS Y MÉTRICAS ============

    async getDatabaseStats() {
        if (!this.db) return {};
        
        const stats = {};
        
        for (const storeName of Object.values(this.stores)) {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const count = await this.getRecordCount(store);
                
                stats[storeName] = {
                    recordCount: count,
                    estimatedSize: count * 1024 // Estimación básica
                };
            } catch (error) {
                stats[storeName] = { error: error.message };
            }
        }
        
        return {
            stores: stats,
            cacheSize: this.cache.size,
            totalEstimatedSize: Object.values(stats)
                .reduce((sum, stat) => sum + (stat.estimatedSize || 0), 0)
        };
    }

    getRecordCount(store) {
        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ============ EXPORTACIÓN E IMPORTACIÓN ============

    async exportData(symbols = [], types = []) {
        const exportData = {};
        
        for (const symbol of symbols) {
            exportData[symbol] = {};
            
            if (types.includes('prices') || types.length === 0) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                exportData[symbol].prices = await this.getHistoricalData(symbol, thirtyDaysAgo, new Date());
            }
            
            if (types.includes('indicators') || types.length === 0) {
                exportData[symbol].indicators = await this.getIndicators(symbol);
            }
            
            if (types.includes('patterns') || types.length === 0) {
                exportData[symbol].patterns = await this.getPatterns(symbol);
            }
        }
        
        return exportData;
    }

    async importData(data) {
        for (const [symbol, symbolData] of Object.entries(data)) {
            if (symbolData.prices) {
                await this.storePriceData(symbol, symbolData.prices);
            }
            
            if (symbolData.indicators) {
                await this.storeIndicators(symbol, symbolData.indicators);
            }
            
            if (symbolData.patterns) {
                await this.storePatterns(symbol, symbolData.patterns);
            }
        }
    }

    // ============ CLEANUP ============

    cleanup() {
        this.cache.clear();
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Crear instancia global
window.cryptoDataManager = new CryptoDataManager();

console.log('🗄️ Crypto Data Manager cargado');
