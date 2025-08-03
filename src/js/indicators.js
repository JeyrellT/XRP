// indicators.js - Cálculos de indicadores técnicos

class TechnicalIndicators {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minuto
    }

    // Cache para evitar recálculos innecesarios
    getCached(key, data, calculator) {
        const cacheKey = `${key}_${JSON.stringify(data).length}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.value;
        }
        
        const result = calculator();
        this.cache.set(cacheKey, {
            value: result,
            timestamp: Date.now()
        });
        
        return result;
    }

    // RSI (Relative Strength Index)
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        
        return this.getCached(`rsi_${period}`, prices, () => {
            const changes = [];
            for (let i = 1; i < prices.length; i++) {
                const current = Array.isArray(prices[i]) ? prices[i][1] : prices[i];
                const previous = Array.isArray(prices[i-1]) ? prices[i-1][1] : prices[i-1];
                changes.push(current - previous);
            }
            
            const gains = changes.map(change => change > 0 ? change : 0);
            const losses = changes.map(change => change < 0 ? -change : 0);
            
            // Usar SMA para el cálculo inicial
            let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
            let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
            
            // Usar EMA para períodos subsecuentes
            for (let i = period; i < gains.length; i++) {
                avgGain = (avgGain * (period - 1) + gains[i]) / period;
                avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
            }
            
            if (avgLoss === 0) return 100;
            
            const rs = avgGain / avgLoss;
            return 100 - (100 / (1 + rs));
        });
    }

    // SMA (Simple Moving Average)
    calculateSMA(data, period) {
        if (data.length < period) return data.map(() => null);
        
        return this.getCached(`sma_${period}`, data, () => {
            const sma = [];
            for (let i = 0; i < data.length; i++) {
                if (i < period - 1) {
                    sma.push(null);
                } else {
                    const slice = data.slice(i - period + 1, i + 1);
                    const values = slice.map(item => Array.isArray(item) ? item[1] : item);
                    const sum = values.reduce((a, b) => a + b, 0);
                    sma.push(sum / period);
                }
            }
            return sma;
        });
    }

    // EMA (Exponential Moving Average)
    calculateEMA(data, period) {
        if (data.length < period) return null;
        
        return this.getCached(`ema_${period}`, data, () => {
            const values = data.map(item => Array.isArray(item) ? item[1] : item);
            const multiplier = 2 / (period + 1);
            
            // Comenzar con SMA
            let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
            
            // Calcular EMA
            for (let i = period; i < values.length; i++) {
                ema = (values[i] - ema) * multiplier + ema;
            }
            
            return ema;
        });
    }

    // MACD (Moving Average Convergence Divergence)
    calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        if (prices.length < slowPeriod) {
            return { macdLine: 0, signalLine: 0, histogram: 0, trend: 'neutral' };
        }
        
        return this.getCached(`macd_${fastPeriod}_${slowPeriod}_${signalPeriod}`, prices, () => {
            const values = prices.map(p => Array.isArray(p) ? p[1] : p);
            
            // Calcular EMAs
            const ema12 = this.calculateEMAArray(values, fastPeriod);
            const ema26 = this.calculateEMAArray(values, slowPeriod);
            
            if (!ema12 || !ema26) return { macdLine: 0, signalLine: 0, histogram: 0, trend: 'neutral' };
            
            // MACD Line
            const macdLines = [];
            for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
                if (ema12[i] !== null && ema26[i] !== null) {
                    macdLines.push(ema12[i] - ema26[i]);
                }
            }
            
            const macdLine = macdLines[macdLines.length - 1] || 0;
            
            // Signal Line (EMA del MACD)
            const signalLine = this.calculateEMAFromArray(macdLines, signalPeriod);
            
            // Histogram
            const histogram = macdLine - (signalLine || 0);
            
            // Determinar tendencia
            let trend = 'neutral';
            if (macdLines.length > 1) {
                const prevMacd = macdLines[macdLines.length - 2];
                trend = macdLine > prevMacd ? 'up' : 'down';
            }
            
            return { macdLine, signalLine: signalLine || 0, histogram, trend };
        });
    }

    // Calcular EMA como array
    calculateEMAArray(data, period) {
        if (data.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        const emaArray = new Array(data.length).fill(null);
        
        // Primer valor es SMA
        const sma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
        emaArray[period - 1] = sma;
        
        // Calcular resto con EMA
        for (let i = period; i < data.length; i++) {
            emaArray[i] = (data[i] - emaArray[i - 1]) * multiplier + emaArray[i - 1];
        }
        
        return emaArray;
    }

    // Calcular EMA desde un array existente
    calculateEMAFromArray(data, period) {
        if (data.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = period; i < data.length; i++) {
            ema = (data[i] - ema) * multiplier + ema;
        }
        
        return ema;
    }

    // Bollinger Bands
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (prices.length < period) {
            return { upper: 0, middle: 0, lower: 0, position: 50 };
        }
        
        return this.getCached(`bb_${period}_${stdDev}`, prices, () => {
            const values = prices.slice(-period).map(p => Array.isArray(p) ? p[1] : p);
            const sma = values.reduce((a, b) => a + b, 0) / period;
            
            // Calcular desviación estándar
            const variance = values.reduce((acc, price) => {
                return acc + Math.pow(price - sma, 2);
            }, 0) / period;
            
            const standardDeviation = Math.sqrt(variance);
            
            const upper = sma + (standardDeviation * stdDev);
            const lower = sma - (standardDeviation * stdDev);
            const currentPrice = values[values.length - 1];
            const position = ((currentPrice - lower) / (upper - lower)) * 100;
            
            return { upper, middle: sma, lower, position };
        });
    }

    // Stochastic Oscillator
    calculateStochastic(prices, kPeriod = 14, dPeriod = 3) {
        if (prices.length < kPeriod) {
            return { k: 50, d: 50, signal: 'neutral' };
        }
        
        return this.getCached(`stoch_${kPeriod}_${dPeriod}`, prices, () => {
            const values = prices.map(p => Array.isArray(p) ? p[1] : p);
            const recentPrices = values.slice(-kPeriod);
            
            const highest = Math.max(...recentPrices);
            const lowest = Math.min(...recentPrices);
            const currentPrice = values[values.length - 1];
            
            const k = ((currentPrice - lowest) / (highest - lowest)) * 100;
            
            // Para %D, normalmente se usa SMA de %K, aquí simplificamos
            const d = k * 0.7 + (Math.random() * 20 + 40); // Simulado para demo
            
            let signal = 'neutral';
            if (k > 80 && d > 80) signal = 'overbought';
            else if (k < 20 && d < 20) signal = 'oversold';
            else if (k > d && k > 50) signal = 'bullish';
            else if (k < d && k < 50) signal = 'bearish';
            
            return { k: Math.max(0, Math.min(100, k)), d: Math.max(0, Math.min(100, d)), signal };
        });
    }

    // ATR (Average True Range)
    calculateATR(ohlcData, period = 14) {
        if (ohlcData.length < period + 1) return 0.01;
        
        return this.getCached(`atr_${period}`, ohlcData, () => {
            const trueRanges = [];
            
            for (let i = 1; i < ohlcData.length; i++) {
                const current = ohlcData[i];
                const previous = ohlcData[i - 1];
                
                // [timestamp, open, high, low, close] o [timestamp, price]
                let high, low, prevClose;
                
                if (current.length === 5) {
                    // OHLC data
                    high = current[2];
                    low = current[3];
                    prevClose = previous[4];
                } else {
                    // Price data - simular OHLC
                    high = current[1];
                    low = current[1];
                    prevClose = previous[1];
                }
                
                const tr = Math.max(
                    Math.abs(high - low),
                    Math.abs(high - prevClose),
                    Math.abs(low - prevClose)
                );
                
                trueRanges.push(tr);
            }
            
            // Calcular ATR como SMA de True Range
            const recentTR = trueRanges.slice(-period);
            return recentTR.reduce((a, b) => a + b, 0) / period;
        });
    }

    // Williams %R
    calculateWilliamsR(prices, period = 14) {
        if (prices.length < period) return -50;
        
        return this.getCached(`williamsr_${period}`, prices, () => {
            const values = prices.slice(-period).map(p => Array.isArray(p) ? p[1] : p);
            const highest = Math.max(...values);
            const lowest = Math.min(...values);
            const currentPrice = values[values.length - 1];
            
            return ((highest - currentPrice) / (highest - lowest)) * -100;
        });
    }

    // Commodity Channel Index (CCI)
    calculateCCI(prices, period = 20) {
        if (prices.length < period) return 0;
        
        return this.getCached(`cci_${period}`, prices, () => {
            const typicalPrices = prices.map(p => Array.isArray(p) ? p[1] : p);
            const sma = this.calculateSMA(typicalPrices, period);
            const currentSMA = sma[sma.length - 1];
            
            if (!currentSMA) return 0;
            
            // Calcular desviación media
            const recentPrices = typicalPrices.slice(-period);
            const meanDeviation = recentPrices.reduce((sum, price) => {
                return sum + Math.abs(price - currentSMA);
            }, 0) / period;
            
            const currentPrice = typicalPrices[typicalPrices.length - 1];
            return (currentPrice - currentSMA) / (0.015 * meanDeviation);
        });
    }

    // Momentum
    calculateMomentum(prices, period = 10) {
        if (prices.length < period + 1) return 0;
        
        return this.getCached(`momentum_${period}`, prices, () => {
            const values = prices.map(p => Array.isArray(p) ? p[1] : p);
            const current = values[values.length - 1];
            const previous = values[values.length - 1 - period];
            
            return ((current - previous) / previous) * 100;
        });
    }

    // Análisis de tendencia
    analyzeTrend(prices, shortPeriod = 10, longPeriod = 30) {
        if (prices.length < longPeriod) return { direction: 'neutral', strength: 0 };
        
        return this.getCached(`trend_${shortPeriod}_${longPeriod}`, prices, () => {
            const values = prices.map(p => Array.isArray(p) ? p[1] : p);
            
            const shortSMA = this.calculateSMA(values, shortPeriod);
            const longSMA = this.calculateSMA(values, longPeriod);
            
            const currentShort = shortSMA[shortSMA.length - 1];
            const currentLong = longSMA[longSMA.length - 1];
            
            if (!currentShort || !currentLong) {
                return { direction: 'neutral', strength: 0 };
            }
            
            const difference = ((currentShort - currentLong) / currentLong) * 100;
            
            let direction = 'neutral';
            let strength = Math.abs(difference);
            
            if (difference > 0.5) direction = 'bullish';
            else if (difference < -0.5) direction = 'bearish';
            
            return { direction, strength: Math.min(strength, 100) };
        });
    }

    // Volatilidad
    calculateVolatility(prices, period = 20) {
        if (prices.length < period) return 0;
        
        return this.getCached(`volatility_${period}`, prices, () => {
            const values = prices.slice(-period).map(p => Array.isArray(p) ? p[1] : p);
            const returns = [];
            
            for (let i = 1; i < values.length; i++) {
                returns.push((values[i] - values[i-1]) / values[i-1]);
            }
            
            const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((acc, ret) => {
                return acc + Math.pow(ret - mean, 2);
            }, 0) / returns.length;
            
            return Math.sqrt(variance) * 100; // Convertir a porcentaje
        });
    }

    // Limpiar cache
    clearCache() {
        this.cache.clear();
    }

    // Obtener análisis completo
    getCompleteAnalysis(prices, ohlcData = null) {
        if (prices.length < 20) {
            return this.getMinimalAnalysis();
        }

        try {
            const rsi = this.calculateRSI(prices);
            const macd = this.calculateMACD(prices);
            const bb = this.calculateBollingerBands(prices);
            const stoch = this.calculateStochastic(prices);
            const trend = this.analyzeTrend(prices);
            const volatility = this.calculateVolatility(prices);
            const momentum = this.calculateMomentum(prices);
            const atr = this.calculateATR(ohlcData || prices);

            return {
                rsi,
                macd,
                bollingerBands: bb,
                stochastic: stoch,
                trend,
                volatility,
                momentum,
                atr,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error en análisis completo:', error);
            return this.getMinimalAnalysis();
        }
    }

    getMinimalAnalysis() {
        return {
            rsi: 50,
            macd: { macdLine: 0, signalLine: 0, histogram: 0, trend: 'neutral' },
            bollingerBands: { upper: 0, middle: 0, lower: 0, position: 50 },
            stochastic: { k: 50, d: 50, signal: 'neutral' },
            trend: { direction: 'neutral', strength: 0 },
            volatility: 0,
            momentum: 0,
            atr: 0.01,
            timestamp: Date.now()
        };
    }
}

// Crear instancia global
window.technicalIndicators = new TechnicalIndicators();
