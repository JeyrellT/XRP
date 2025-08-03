// parallel-processor.js - Procesamiento paralelo con Web Workers

class ParallelFinancialProcessor {
    constructor() {
        this.workers = [];
        this.taskQueue = [];
        this.maxWorkers = navigator.hardwareConcurrency || 4;
        this.activeWorkers = 0;
        this.performance = new PerformanceMonitor();
        this.workerCode = null;
        
        this.initializeWorkerPool();
    }

    initializeWorkerPool() {
        // Crear el código del worker como blob
        this.workerCode = this.createWorkerCode();
        
        // Inicializar pool de workers
        for (let i = 0; i < this.maxWorkers; i++) {
            try {
                const worker = new Worker(this.workerCode);
                worker.id = i;
                worker.busy = false;
                worker.lastUsed = Date.now();
                
                this.workers.push(worker);
                console.log(`💼 Worker ${i} inicializado`);
            } catch (error) {
                console.warn(`No se pudo crear worker ${i}:`, error);
            }
        }
        
        console.log(`🔧 Pool de ${this.workers.length} workers inicializado`);
    }

    createWorkerCode() {
        const workerScript = `
        // financial-worker.js - Worker para cálculos financieros intensivos
        
        class FinancialCalculator {
            constructor() {
                this.cache = new Map();
            }

            calculateRSI(prices, period = 14) {
                if (prices.length < period + 1) return [];
                
                const changes = [];
                for (let i = 1; i < prices.length; i++) {
                    changes.push(prices[i] - prices[i - 1]);
                }
                
                const gains = changes.map(change => change > 0 ? change : 0);
                const losses = changes.map(change => change < 0 ? -change : 0);
                
                let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
                let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
                
                const rsiValues = [];
                
                for (let i = period; i < gains.length; i++) {
                    avgGain = (avgGain * (period - 1) + gains[i]) / period;
                    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
                    
                    if (avgLoss === 0) {
                        rsiValues.push(100);
                    } else {
                        const rs = avgGain / avgLoss;
                        rsiValues.push(100 - (100 / (1 + rs)));
                    }
                }
                
                return rsiValues;
            }

            calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
                if (prices.length < slowPeriod) return { macd: [], signal: [], histogram: [] };
                
                const emaFast = this.calculateEMA(prices, fastPeriod);
                const emaSlow = this.calculateEMA(prices, slowPeriod);
                
                const macdLine = [];
                for (let i = 0; i < Math.min(emaFast.length, emaSlow.length); i++) {
                    macdLine.push(emaFast[i] - emaSlow[i]);
                }
                
                const signalLine = this.calculateEMA(macdLine, signalPeriod);
                
                const histogram = [];
                for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
                    histogram.push(macdLine[i] - signalLine[i]);
                }
                
                return { macd: macdLine, signal: signalLine, histogram };
            }

            calculateEMA(data, period) {
                if (data.length < period) return [];
                
                const multiplier = 2 / (period + 1);
                const emaArray = [];
                
                // Primer valor es SMA
                const sma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
                emaArray.push(sma);
                
                // Calcular resto con EMA
                for (let i = period; i < data.length; i++) {
                    const ema = (data[i] * multiplier) + (emaArray[emaArray.length - 1] * (1 - multiplier));
                    emaArray.push(ema);
                }
                
                return emaArray;
            }

            calculateBollingerBands(prices, period = 20, stdDev = 2) {
                if (prices.length < period) return { upper: [], middle: [], lower: [] };
                
                const sma = [];
                const upper = [];
                const lower = [];
                
                for (let i = period - 1; i < prices.length; i++) {
                    const slice = prices.slice(i - period + 1, i + 1);
                    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
                    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / slice.length;
                    const standardDeviation = Math.sqrt(variance);
                    
                    sma.push(mean);
                    upper.push(mean + (standardDeviation * stdDev));
                    lower.push(mean - (standardDeviation * stdDev));
                }
                
                return { upper, middle: sma, lower };
            }

            detectCandlestickPatterns(ohlcData) {
                const patterns = [];
                
                for (let i = 2; i < ohlcData.length; i++) {
                    const current = ohlcData[i];
                    const previous = ohlcData[i - 1];
                    const beforePrevious = ohlcData[i - 2];
                    
                    // Doji
                    if (this.isDoji(current)) {
                        patterns.push({
                            index: i,
                            pattern: 'doji',
                            signal: 'neutral',
                            strength: this.calculateDojiStrength(current)
                        });
                    }
                    
                    // Hammer
                    if (this.isHammer(current, previous)) {
                        patterns.push({
                            index: i,
                            pattern: 'hammer',
                            signal: 'bullish',
                            strength: this.calculateHammerStrength(current)
                        });
                    }
                    
                    // Shooting Star
                    if (this.isShootingStar(current, previous)) {
                        patterns.push({
                            index: i,
                            pattern: 'shooting_star',
                            signal: 'bearish',
                            strength: this.calculateShootingStarStrength(current)
                        });
                    }
                    
                    // Engulfing patterns
                    if (this.isBullishEngulfing(current, previous)) {
                        patterns.push({
                            index: i,
                            pattern: 'bullish_engulfing',
                            signal: 'bullish',
                            strength: this.calculateEngulfingStrength(current, previous)
                        });
                    }
                    
                    if (this.isBearishEngulfing(current, previous)) {
                        patterns.push({
                            index: i,
                            pattern: 'bearish_engulfing',
                            signal: 'bearish',
                            strength: this.calculateEngulfingStrength(current, previous)
                        });
                    }
                }
                
                return patterns;
            }

            isDoji(candle) {
                const bodySize = Math.abs(candle.close - candle.open);
                const totalRange = candle.high - candle.low;
                return bodySize <= totalRange * 0.1; // Body is 10% or less of total range
            }

            isHammer(current, previous) {
                const bodySize = Math.abs(current.close - current.open);
                const lowerShadow = Math.min(current.open, current.close) - current.low;
                const upperShadow = current.high - Math.max(current.open, current.close);
                
                return lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5;
            }

            isShootingStar(current, previous) {
                const bodySize = Math.abs(current.close - current.open);
                const lowerShadow = Math.min(current.open, current.close) - current.low;
                const upperShadow = current.high - Math.max(current.open, current.close);
                
                return upperShadow > bodySize * 2 && lowerShadow < bodySize * 0.5;
            }

            isBullishEngulfing(current, previous) {
                return previous.close < previous.open && // Previous red
                       current.close > current.open && // Current green
                       current.open < previous.close && // Current opens below previous close
                       current.close > previous.open; // Current closes above previous open
            }

            isBearishEngulfing(current, previous) {
                return previous.close > previous.open && // Previous green
                       current.close < current.open && // Current red
                       current.open > previous.close && // Current opens above previous close
                       current.close < previous.open; // Current closes below previous open
            }

            calculateDojiStrength(candle) {
                const bodySize = Math.abs(candle.close - candle.open);
                const totalRange = candle.high - candle.low;
                return 1 - (bodySize / totalRange);
            }

            calculateHammerStrength(candle) {
                const bodySize = Math.abs(candle.close - candle.open);
                const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
                return Math.min(1, lowerShadow / (bodySize * 3));
            }

            calculateShootingStarStrength(candle) {
                const bodySize = Math.abs(candle.close - candle.open);
                const upperShadow = candle.high - Math.max(candle.open, candle.close);
                return Math.min(1, upperShadow / (bodySize * 3));
            }

            calculateEngulfingStrength(current, previous) {
                const currentBody = Math.abs(current.close - current.open);
                const previousBody = Math.abs(previous.close - previous.open);
                return Math.min(1, currentBody / previousBody);
            }

            runBacktest(data, strategy) {
                const trades = [];
                let position = null;
                let equity = 10000; // Starting equity
                
                for (let i = 1; i < data.length; i++) {
                    const signal = this.evaluateStrategy(data, i, strategy);
                    
                    if (signal === 'buy' && !position) {
                        position = {
                            type: 'long',
                            entry: data[i].close,
                            entryIndex: i,
                            quantity: Math.floor(equity / data[i].close)
                        };
                    } else if (signal === 'sell' && position && position.type === 'long') {
                        const profit = (data[i].close - position.entry) * position.quantity;
                        equity += profit;
                        
                        trades.push({
                            ...position,
                            exit: data[i].close,
                            exitIndex: i,
                            profit,
                            return: (data[i].close / position.entry - 1) * 100
                        });
                        
                        position = null;
                    }
                }
                
                return { trades, finalEquity: equity, totalReturn: (equity / 10000 - 1) * 100 };
            }

            evaluateStrategy(data, index, strategy) {
                // Estrategia simple de ejemplo: RSI
                if (strategy.type === 'rsi') {
                    const prices = data.slice(0, index + 1).map(d => d.close);
                    const rsi = this.calculateRSI(prices, strategy.period || 14);
                    const currentRSI = rsi[rsi.length - 1];
                    
                    if (currentRSI < strategy.oversold) return 'buy';
                    if (currentRSI > strategy.overbought) return 'sell';
                }
                
                return 'hold';
            }

            calculateValueAtRisk(returns, confidence = 0.95) {
                if (returns.length === 0) return 0;
                
                const sortedReturns = [...returns].sort((a, b) => a - b);
                const index = Math.floor((1 - confidence) * sortedReturns.length);
                
                return Math.abs(sortedReturns[index] || 0);
            }

            optimizePortfolio(assets, returns, constraints = {}) {
                // Optimización simple de cartera usando Markowitz
                const numAssets = assets.length;
                if (numAssets === 0) return [];
                
                // Calcular matriz de covarianza
                const covariance = this.calculateCovarianceMatrix(returns);
                
                // Optimización básica (equal weight como baseline)
                const weights = new Array(numAssets).fill(1 / numAssets);
                
                // Aplicar restricciones básicas
                if (constraints.maxWeight) {
                    for (let i = 0; i < weights.length; i++) {
                        weights[i] = Math.min(weights[i], constraints.maxWeight);
                    }
                    
                    // Renormalizar
                    const sum = weights.reduce((a, b) => a + b, 0);
                    for (let i = 0; i < weights.length; i++) {
                        weights[i] /= sum;
                    }
                }
                
                return weights.map((weight, index) => ({
                    asset: assets[index],
                    weight,
                    allocation: weight * 100
                }));
            }

            calculateCovarianceMatrix(returns) {
                const numAssets = returns[0].length;
                const matrix = Array(numAssets).fill().map(() => Array(numAssets).fill(0));
                
                for (let i = 0; i < numAssets; i++) {
                    for (let j = 0; j < numAssets; j++) {
                        matrix[i][j] = this.calculateCovariance(
                            returns.map(r => r[i]),
                            returns.map(r => r[j])
                        );
                    }
                }
                
                return matrix;
            }

            calculateCovariance(x, y) {
                const meanX = x.reduce((a, b) => a + b, 0) / x.length;
                const meanY = y.reduce((a, b) => a + b, 0) / y.length;
                
                let covariance = 0;
                for (let i = 0; i < x.length; i++) {
                    covariance += (x[i] - meanX) * (y[i] - meanY);
                }
                
                return covariance / (x.length - 1);
            }
        }

        // Instancia del calculador
        const calculator = new FinancialCalculator();
        
        // Event listener para mensajes del hilo principal
        self.onmessage = function(event) {
            const { operation, data, workerId, taskId } = event.data;
            const startTime = performance.now();
            
            try {
                let result;
                
                switch(operation) {
                    case 'calculateRSI':
                        result = calculator.calculateRSI(data.prices, data.period);
                        break;
                    case 'calculateMACD':
                        result = calculator.calculateMACD(data.prices, data.fastPeriod, data.slowPeriod, data.signalPeriod);
                        break;
                    case 'calculateBollingerBands':
                        result = calculator.calculateBollingerBands(data.prices, data.period, data.stdDev);
                        break;
                    case 'detectPatterns':
                        result = calculator.detectCandlestickPatterns(data.ohlcData);
                        break;
                    case 'runBacktest':
                        result = calculator.runBacktest(data.ohlcData, data.strategy);
                        break;
                    case 'calculateVaR':
                        result = calculator.calculateValueAtRisk(data.returns, data.confidence);
                        break;
                    case 'optimizePortfolio':
                        result = calculator.optimizePortfolio(data.assets, data.returns, data.constraints);
                        break;
                    default:
                        throw new Error(\`Unknown operation: \${operation}\`);
                }

                const processingTime = performance.now() - startTime;

                self.postMessage({
                    workerId,
                    taskId,
                    operation,
                    result,
                    processingTime,
                    success: true
                });
            } catch (error) {
                self.postMessage({
                    workerId,
                    taskId,
                    operation,
                    error: error.message,
                    processingTime: performance.now() - startTime,
                    success: false
                });
            }
        };
        `;
        
        return URL.createObjectURL(new Blob([workerScript], { type: 'application/javascript' }));
    }

    async processLargeDataset(data, operation, options = {}) {
        const profile = this.performance.startProfile(`parallel_${operation}`);
        
        try {
            // Dividir datos en chunks para procesamiento paralelo
            const chunkSize = Math.ceil(data.length / this.workers.length);
            const chunks = this.chunkArray(data, chunkSize);
            
            // Procesar chunks en paralelo
            const promises = chunks.map((chunk, index) => {
                return this.executeOnWorker(chunk, operation, options, index);
            });

            const results = await Promise.all(promises);
            const mergedResult = this.mergeResults(results, operation);

            profile.end();
            return mergedResult;
            
        } catch (error) {
            profile.end();
            throw error;
        }
    }

    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    async executeOnWorker(data, operation, options = {}, preferredWorkerId = null) {
        return new Promise((resolve, reject) => {
            const worker = this.getAvailableWorker(preferredWorkerId);
            
            if (!worker) {
                reject(new Error('No workers available'));
                return;
            }

            const taskId = this.generateTaskId();
            const timeout = setTimeout(() => {
                worker.busy = false;
                reject(new Error('Worker timeout'));
            }, options.timeout || 30000);

            const messageHandler = (event) => {
                if (event.data.taskId === taskId) {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', messageHandler);
                    worker.removeEventListener('error', errorHandler);
                    worker.busy = false;
                    worker.lastUsed = Date.now();

                    if (event.data.success) {
                        resolve(event.data);
                    } else {
                        reject(new Error(event.data.error));
                    }
                }
            };

            const errorHandler = (error) => {
                clearTimeout(timeout);
                worker.removeEventListener('message', messageHandler);
                worker.removeEventListener('error', errorHandler);
                worker.busy = false;
                reject(error);
            };

            worker.addEventListener('message', messageHandler);
            worker.addEventListener('error', errorHandler);
            worker.busy = true;

            worker.postMessage({
                operation,
                data: { ...data, ...options },
                workerId: worker.id,
                taskId
            });
        });
    }

    getAvailableWorker(preferredId = null) {
        // Buscar worker preferido si está disponible
        if (preferredId !== null) {
            const preferredWorker = this.workers.find(w => w.id === preferredId && !w.busy);
            if (preferredWorker) return preferredWorker;
        }

        // Buscar cualquier worker disponible
        return this.workers.find(worker => !worker.busy) || null;
    }

    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    mergeResults(results, operation) {
        switch (operation) {
            case 'calculateRSI':
            case 'calculateMACD':
            case 'calculateBollingerBands':
                // Para indicadores, concatenar arrays
                return results.reduce((acc, result) => {
                    if (Array.isArray(result.result)) {
                        return acc.concat(result.result);
                    } else if (result.result && typeof result.result === 'object') {
                        // Para MACD que retorna objeto con arrays
                        Object.keys(result.result).forEach(key => {
                            if (!acc[key]) acc[key] = [];
                            acc[key] = acc[key].concat(result.result[key]);
                        });
                        return acc;
                    }
                    return acc;
                }, Array.isArray(results[0]?.result) ? [] : {});

            case 'detectPatterns':
                // Para patrones, concatenar y ajustar índices
                let indexOffset = 0;
                return results.reduce((acc, result) => {
                    const patterns = result.result.map(pattern => ({
                        ...pattern,
                        index: pattern.index + indexOffset
                    }));
                    indexOffset += result.chunkSize || 0;
                    return acc.concat(patterns);
                }, []);

            case 'runBacktest':
                // Para backtests, combinar resultados
                return results.reduce((acc, result) => {
                    return {
                        trades: (acc.trades || []).concat(result.result.trades || []),
                        finalEquity: result.result.finalEquity || acc.finalEquity || 0,
                        totalReturn: result.result.totalReturn || acc.totalReturn || 0
                    };
                }, {});

            case 'calculateVaR':
                // Para VaR, promediar resultados
                const values = results.map(r => r.result).filter(v => typeof v === 'number');
                return values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;

            case 'optimizePortfolio':
                // Para optimización de cartera, usar el mejor resultado
                return results.sort((a, b) => (b.result.score || 0) - (a.result.score || 0))[0]?.result || [];

            default:
                return results;
        }
    }

    // Métodos de conveniencia para operaciones específicas
    async calculateIndicators(prices, indicators = ['rsi', 'macd', 'bollinger']) {
        const tasks = indicators.map(indicator => {
            switch (indicator) {
                case 'rsi':
                    return this.executeOnWorker({ prices }, 'calculateRSI');
                case 'macd':
                    return this.executeOnWorker({ prices }, 'calculateMACD');
                case 'bollinger':
                    return this.executeOnWorker({ prices }, 'calculateBollingerBands');
                default:
                    return Promise.resolve(null);
            }
        });

        const results = await Promise.all(tasks);
        const indicatorResults = {};

        indicators.forEach((indicator, index) => {
            if (results[index]) {
                indicatorResults[indicator] = results[index].result;
            }
        });

        return indicatorResults;
    }

    async runParallelBacktest(ohlcData, strategies) {
        const tasks = strategies.map(strategy => 
            this.executeOnWorker({ ohlcData, strategy }, 'runBacktest')
        );

        const results = await Promise.all(tasks);
        
        return strategies.map((strategy, index) => ({
            strategy,
            result: results[index]?.result || null,
            performance: results[index]?.processingTime || 0
        }));
    }

    async detectPatternsParallel(ohlcData) {
        const chunkSize = Math.ceil(ohlcData.length / this.workers.length);
        const chunks = this.chunkArray(ohlcData, chunkSize);
        
        const tasks = chunks.map((chunk, index) => 
            this.executeOnWorker({ ohlcData: chunk, chunkSize: chunk.length }, 'detectPatterns', {}, index)
        );

        const results = await Promise.all(tasks);
        return this.mergeResults(results, 'detectPatterns');
    }

    // Estadísticas del pool de workers
    getWorkerStats() {
        return {
            totalWorkers: this.workers.length,
            busyWorkers: this.workers.filter(w => w.busy).length,
            availableWorkers: this.workers.filter(w => !w.busy).length,
            workerUtilization: (this.workers.filter(w => w.busy).length / this.workers.length) * 100
        };
    }

    // Cleanup del pool
    cleanup() {
        this.workers.forEach(worker => {
            worker.terminate();
        });
        this.workers = [];
        
        if (this.workerCode) {
            URL.revokeObjectURL(this.workerCode);
            this.workerCode = null;
        }
        
        console.log('🔄 Worker pool cleanup completed');
    }
}

// Crear instancia global
window.parallelProcessor = new ParallelFinancialProcessor();

console.log('⚡ Parallel Financial Processor cargado');
