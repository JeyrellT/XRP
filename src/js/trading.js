// trading.js - Lógica de trading, señales y análisis

class TradingEngine {
    constructor() {
        this.signals = [];
        this.recommendations = {};
        this.supportResistanceLevels = { supports: [], resistances: [] };
        this.alertThresholds = {
            priceChange: 2, // % change to trigger alert
            volumeSpike: 150, // % of average volume
            rsiExtreme: { overbought: 75, oversold: 25 }
        };
        this.previousPrice = 0;
        this.priceAlerts = [];
    }

    // Analizar señales de trading basadas en indicadores técnicos
    analyzeSignals(prices, analysis) {
        if (!prices || prices.length < 20 || !analysis) {
            return this.generateNeutralSignals();
        }

        const signals = [];
        const currentPrice = prices[prices.length - 1][1];
        
        let bullishSignals = 0;
        let bearishSignals = 0;
        let signalStrength = 0;

        // Análisis RSI
        const rsiSignal = this.analyzeRSI(analysis.rsi);
        if (rsiSignal.type !== 'neutral') {
            signals.push(rsiSignal);
            if (rsiSignal.type === 'buy') bullishSignals++;
            else bearishSignals++;
            signalStrength += rsiSignal.strength;
        }

        // Análisis MACD
        const macdSignal = this.analyzeMacd(analysis.macd);
        if (macdSignal.type !== 'neutral') {
            signals.push(macdSignal);
            if (macdSignal.type === 'buy') bullishSignals++;
            else bearishSignals++;
            signalStrength += macdSignal.strength;
        }

        // Análisis Bollinger Bands
        const bbSignal = this.analyzeBollingerBands(analysis.bollingerBands, currentPrice);
        if (bbSignal.type !== 'neutral') {
            signals.push(bbSignal);
            if (bbSignal.type === 'buy') bullishSignals++;
            else bearishSignals++;
            signalStrength += bbSignal.strength;
        }

        // Análisis Stochastic
        const stochSignal = this.analyzeStochastic(analysis.stochastic);
        if (stochSignal.type !== 'neutral') {
            signals.push(stochSignal);
            if (stochSignal.type === 'buy') bullishSignals++;
            else bearishSignals++;
            signalStrength += stochSignal.strength;
        }

        // Análisis de tendencia
        const trendSignal = this.analyzeTrend(analysis.trend);
        if (trendSignal.type !== 'neutral') {
            signals.push(trendSignal);
            if (trendSignal.type === 'buy') bullishSignals++;
            else bearishSignals++;
            signalStrength += trendSignal.strength;
        }

        // Análisis de momentum
        const momentumSignal = this.analyzeMomentum(analysis.momentum);
        if (momentumSignal.type !== 'neutral') {
            signals.push(momentumSignal);
            if (momentumSignal.type === 'buy') bullishSignals++;
            else bearishSignals++;
            signalStrength += momentumSignal.strength;
        }

        // Generar señal de consenso
        const consensusSignal = this.generateConsensusSignal(bullishSignals, bearishSignals, signalStrength);
        if (consensusSignal) {
            signals.unshift(consensusSignal);
        }

        // Agregar señal de volatilidad si es significativa
        const volatilitySignal = this.analyzeVolatility(analysis.volatility);
        if (volatilitySignal.type !== 'neutral') {
            signals.push(volatilitySignal);
        }

        this.signals = signals;
        return signals;
    }

    // Análisis individual de RSI
    analyzeRSI(rsi) {
        if (rsi > this.alertThresholds.rsiExtreme.overbought) {
            return {
                type: 'sell',
                title: 'RSI Sobrecomprado',
                description: `RSI en ${rsi.toFixed(2)} indica condición de sobrecompra`,
                strength: Math.min(5, Math.floor((rsi - 70) / 5) + 3),
                timeframe: 'corto plazo',
                confidence: 85
            };
        } else if (rsi < this.alertThresholds.rsiExtreme.oversold) {
            return {
                type: 'buy',
                title: 'RSI Sobrevendido',
                description: `RSI en ${rsi.toFixed(2)} indica condición de sobreventa`,
                strength: Math.min(5, Math.floor((30 - rsi) / 5) + 3),
                timeframe: 'corto plazo',
                confidence: 85
            };
        } else if (rsi > 65 && rsi <= 70) {
            return {
                type: 'sell',
                title: 'RSI Elevado',
                description: `RSI en ${rsi.toFixed(2)} se acerca a zona de sobrecompra`,
                strength: 2,
                timeframe: 'corto plazo',
                confidence: 60
            };
        } else if (rsi < 35 && rsi >= 30) {
            return {
                type: 'buy',
                title: 'RSI Bajo',
                description: `RSI en ${rsi.toFixed(2)} se acerca a zona de sobreventa`,
                strength: 2,
                timeframe: 'corto plazo',
                confidence: 60
            };
        }
        
        return { type: 'neutral', title: 'RSI Neutral', description: 'Sin señales claras', strength: 0 };
    }

    // Análisis de MACD
    analyzeMacd(macd) {
        const { histogram, trend, macdLine, signalLine } = macd;
        
        if (histogram > 0 && trend === 'up' && Math.abs(histogram) > 0.001) {
            return {
                type: 'buy',
                title: 'MACD Alcista',
                description: 'Cruce alcista del MACD detectado',
                strength: Math.min(5, Math.floor(Math.abs(histogram) * 5000) + 2),
                timeframe: 'medio plazo',
                confidence: 80
            };
        } else if (histogram < 0 && trend === 'down' && Math.abs(histogram) > 0.001) {
            return {
                type: 'sell',
                title: 'MACD Bajista',
                description: 'Cruce bajista del MACD detectado',
                strength: Math.min(5, Math.floor(Math.abs(histogram) * 5000) + 2),
                timeframe: 'medio plazo',
                confidence: 80
            };
        } else if (histogram > 0 && Math.abs(histogram) > 0.0005) {
            return {
                type: 'buy',
                title: 'MACD Positivo',
                description: 'Histograma MACD en territorio positivo',
                strength: 2,
                timeframe: 'medio plazo',
                confidence: 65
            };
        } else if (histogram < 0 && Math.abs(histogram) > 0.0005) {
            return {
                type: 'sell',
                title: 'MACD Negativo',
                description: 'Histograma MACD en territorio negativo',
                strength: 2,
                timeframe: 'medio plazo',
                confidence: 65
            };
        }
        
        return { type: 'neutral', title: 'MACD Neutral', description: 'Sin divergencias claras', strength: 0 };
    }

    // Análisis de Bollinger Bands
    analyzeBollingerBands(bb, currentPrice) {
        const position = bb.position;
        
        if (position < 10) {
            return {
                type: 'buy',
                title: 'Banda Inferior Bollinger',
                description: `Precio en el ${position.toFixed(1)}% de las bandas - posible rebote`,
                strength: Math.max(2, Math.floor((10 - position) / 2) + 2),
                timeframe: 'corto plazo',
                confidence: 75
            };
        } else if (position > 90) {
            return {
                type: 'sell',
                title: 'Banda Superior Bollinger',
                description: `Precio en el ${position.toFixed(1)}% de las bandas - posible corrección`,
                strength: Math.max(2, Math.floor((position - 90) / 2) + 2),
                timeframe: 'corto plazo',
                confidence: 75
            };
        } else if (position < 25) {
            return {
                type: 'buy',
                title: 'Acercándose a Banda Inferior',
                description: `Precio en el ${position.toFixed(1)}% de las bandas`,
                strength: 2,
                timeframe: 'corto plazo',
                confidence: 60
            };
        } else if (position > 75) {
            return {
                type: 'sell',
                title: 'Acercándose a Banda Superior',
                description: `Precio en el ${position.toFixed(1)}% de las bandas`,
                strength: 2,
                timeframe: 'corto plazo',
                confidence: 60
            };
        }
        
        return { type: 'neutral', title: 'BB Neutral', description: 'Precio en zona media', strength: 0 };
    }

    // Análisis de Stochastic
    analyzeStochastic(stoch) {
        const { k, d, signal } = stoch;
        
        if (signal === 'oversold') {
            return {
                type: 'buy',
                title: 'Estocástico Sobrevendido',
                description: `%K: ${k.toFixed(1)}, %D: ${d.toFixed(1)} - condición de sobreventa`,
                strength: 4,
                timeframe: 'corto plazo',
                confidence: 80
            };
        } else if (signal === 'overbought') {
            return {
                type: 'sell',
                title: 'Estocástico Sobrecomprado',
                description: `%K: ${k.toFixed(1)}, %D: ${d.toFixed(1)} - condición de sobrecompra`,
                strength: 4,
                timeframe: 'corto plazo',
                confidence: 80
            };
        } else if (signal === 'bullish') {
            return {
                type: 'buy',
                title: 'Estocástico Alcista',
                description: `%K cruza por encima de %D - señal alcista`,
                strength: 3,
                timeframe: 'corto plazo',
                confidence: 70
            };
        } else if (signal === 'bearish') {
            return {
                type: 'sell',
                title: 'Estocástico Bajista',
                description: `%K cruza por debajo de %D - señal bajista`,
                strength: 3,
                timeframe: 'corto plazo',
                confidence: 70
            };
        }
        
        return { type: 'neutral', title: 'Estocástico Neutral', description: 'Sin señales claras', strength: 0 };
    }

    // Análisis de tendencia
    analyzeTrend(trend) {
        const { direction, strength } = trend;
        
        if (direction === 'bullish' && strength > 2) {
            return {
                type: 'buy',
                title: 'Tendencia Alcista Fuerte',
                description: `Tendencia alcista con fuerza de ${strength.toFixed(1)}%`,
                strength: Math.min(5, Math.floor(strength / 2) + 2),
                timeframe: 'largo plazo',
                confidence: 85
            };
        } else if (direction === 'bearish' && strength > 2) {
            return {
                type: 'sell',
                title: 'Tendencia Bajista Fuerte',
                description: `Tendencia bajista con fuerza de ${strength.toFixed(1)}%`,
                strength: Math.min(5, Math.floor(strength / 2) + 2),
                timeframe: 'largo plazo',
                confidence: 85
            };
        } else if (direction === 'bullish' && strength > 1) {
            return {
                type: 'buy',
                title: 'Tendencia Alcista',
                description: `Tendencia alcista moderada`,
                strength: 2,
                timeframe: 'medio plazo',
                confidence: 70
            };
        } else if (direction === 'bearish' && strength > 1) {
            return {
                type: 'sell',
                title: 'Tendencia Bajista',
                description: `Tendencia bajista moderada`,
                strength: 2,
                timeframe: 'medio plazo',
                confidence: 70
            };
        }
        
        return { type: 'neutral', title: 'Sin Tendencia Clara', description: 'Mercado lateral', strength: 0 };
    }

    // Análisis de momentum
    analyzeMomentum(momentum) {
        if (momentum > 3) {
            return {
                type: 'buy',
                title: 'Momentum Alcista',
                description: `Momentum positivo de ${momentum.toFixed(2)}%`,
                strength: Math.min(4, Math.floor(momentum / 2) + 1),
                timeframe: 'corto plazo',
                confidence: 75
            };
        } else if (momentum < -3) {
            return {
                type: 'sell',
                title: 'Momentum Bajista',
                description: `Momentum negativo de ${momentum.toFixed(2)}%`,
                strength: Math.min(4, Math.floor(Math.abs(momentum) / 2) + 1),
                timeframe: 'corto plazo',
                confidence: 75
            };
        }
        
        return { type: 'neutral', title: 'Momentum Neutral', description: 'Sin impulso claro', strength: 0 };
    }

    // Análisis de volatilidad
    analyzeVolatility(volatility) {
        if (volatility > 5) {
            return {
                type: 'neutral',
                title: '⚠️ Alta Volatilidad',
                description: `Volatilidad elevada del ${volatility.toFixed(2)}% - precaución`,
                strength: 3,
                timeframe: 'inmediato',
                confidence: 90
            };
        } else if (volatility < 1) {
            return {
                type: 'neutral',
                title: '📊 Baja Volatilidad',
                description: `Mercado estable - volatilidad del ${volatility.toFixed(2)}%`,
                strength: 1,
                timeframe: 'inmediato',
                confidence: 80
            };
        }
        
        return { type: 'neutral', title: 'Volatilidad Normal', description: 'Condiciones normales', strength: 0 };
    }

    // Generar señal de consenso
    generateConsensusSignal(bullish, bearish, totalStrength) {
        const netSignals = bullish - bearish;
        const totalSignals = bullish + bearish;
        
        if (totalSignals < 2) return null;
        
        if (netSignals >= 3) {
            return {
                type: 'buy',
                title: '🔥 SEÑAL FUERTE DE COMPRA',
                description: `${bullish} indicadores alcistas vs ${bearish} bajistas`,
                strength: 5,
                timeframe: 'múltiple',
                confidence: Math.min(95, 60 + (netSignals * 10))
            };
        } else if (netSignals <= -3) {
            return {
                type: 'sell',
                title: '⚠️ SEÑAL FUERTE DE VENTA',
                description: `${bearish} indicadores bajistas vs ${bullish} alcistas`,
                strength: 5,
                timeframe: 'múltiple',
                confidence: Math.min(95, 60 + (Math.abs(netSignals) * 10))
            };
        } else if (netSignals >= 2) {
            return {
                type: 'buy',
                title: '📈 Consenso Alcista',
                description: `Mayoría de indicadores sugieren compra`,
                strength: 3,
                timeframe: 'múltiple',
                confidence: 75
            };
        } else if (netSignals <= -2) {
            return {
                type: 'sell',
                title: '📉 Consenso Bajista',
                description: `Mayoría de indicadores sugieren venta`,
                strength: 3,
                timeframe: 'múltiple',
                confidence: 75
            };
        } else {
            return {
                type: 'neutral',
                title: '⏸️ MERCADO LATERAL',
                description: 'Señales mixtas - esperar confirmación',
                strength: 1,
                timeframe: 'múltiple',
                confidence: 60
            };
        }
    }

    // Generar señales neutrales por defecto
    generateNeutralSignals() {
        return [{
            type: 'neutral',
            title: '📊 Análisis en Curso',
            description: 'Recopilando datos para generar señales',
            strength: 1,
            timeframe: 'n/a',
            confidence: 50
        }];
    }

    // Generar recomendaciones de trading
    generateRecommendations(prices, currentData, analysis) {
        if (!prices || !currentData || !analysis) {
            return this.getDefaultRecommendations();
        }

        const currentPrice = currentData.usd;
        const atr = analysis.atr || 0.01;
        const signals = this.signals;
        
        // Determinar acción principal
        const bullishCount = signals.filter(s => s.type === 'buy').length;
        const bearishCount = signals.filter(s => s.type === 'sell').length;
        const totalStrength = signals.reduce((sum, s) => sum + (s.strength || 0), 0);
        
        let action = 'hold';
        let recommendation = '';
        let icon = '📊';
        let confidence = 50;

        if (bullishCount >= bearishCount + 2) {
            action = 'buy';
            recommendation = 'COMPRA RECOMENDADA - Condiciones favorables detectadas';
            icon = '🚀';
            confidence = Math.min(90, 60 + (bullishCount * 8));
        } else if (bearishCount >= bullishCount + 2) {
            action = 'sell';
            recommendation = 'VENTA RECOMENDADA - Señales de distribución';
            icon = '🛑';
            confidence = Math.min(90, 60 + (bearishCount * 8));
        } else if (bullishCount > bearishCount) {
            action = 'buy';
            recommendation = 'COMPRA GRADUAL - Acumulación progresiva';
            icon = '📈';
            confidence = Math.min(80, 55 + (bullishCount * 5));
        } else if (bearishCount > bullishCount) {
            action = 'sell';
            recommendation = 'REDUCIR EXPOSICIÓN - Toma parcial de ganancias';
            icon = '📉';
            confidence = Math.min(80, 55 + (bearishCount * 5));
        } else {
            recommendation = 'MANTENER POSICIÓN - Esperar señales más claras';
            icon = '⏸️';
            confidence = 60;
        }

        // Calcular niveles de trading
        const levels = this.calculateTradingLevels(currentPrice, atr, action, analysis);
        
        this.recommendations = {
            action,
            recommendation,
            icon,
            confidence,
            ...levels,
            signals: this.signals,
            timestamp: Date.now()
        };

        return this.recommendations;
    }

    // Calcular niveles de entrada, stop loss y take profit
    calculateTradingLevels(currentPrice, atr, action, analysis) {
        const riskMultiplier = 2;
        const rewardMultiplier = 3;
        
        let entryPrice = currentPrice;
        let stopLoss, takeProfit;
        
        // Ajustar entrada basado en Bollinger Bands si están disponibles
        if (analysis.bollingerBands) {
            const bb = analysis.bollingerBands;
            if (action === 'buy' && bb.position < 30) {
                entryPrice = Math.min(currentPrice, bb.lower * 1.002);
            } else if (action === 'sell' && bb.position > 70) {
                entryPrice = Math.max(currentPrice, bb.upper * 0.998);
            }
        }
        
        if (action === 'buy') {
            stopLoss = entryPrice - (atr * riskMultiplier);
            takeProfit = entryPrice + (atr * rewardMultiplier);
        } else if (action === 'sell') {
            stopLoss = entryPrice + (atr * riskMultiplier);
            takeProfit = entryPrice - (atr * rewardMultiplier);
        } else {
            stopLoss = entryPrice - (atr * riskMultiplier);
            takeProfit = entryPrice + (atr * rewardMultiplier);
        }
        
        const riskAmount = Math.abs(entryPrice - stopLoss);
        const rewardAmount = Math.abs(takeProfit - entryPrice);
        const riskReward = rewardAmount / riskAmount;
        
        return {
            entryPrice,
            stopLoss,
            takeProfit,
            riskReward
        };
    }

    // Calcular niveles de soporte y resistencia - Mejorado con fallbacks
    calculateSupportResistance(prices) {
        try {
            if (!prices || prices.length === 0) {
                console.warn('⚠️ No hay datos de precios para calcular soporte/resistencia');
                return this.getDefaultSupportResistance();
            }

            // Extraer valores de precio válidos
            const priceValues = prices.map(p => {
                if (Array.isArray(p)) return p[1];
                if (typeof p === 'object' && p.price) return p.price;
                return p;
            }).filter(p => p && !isNaN(p) && p > 0);

            if (priceValues.length < 10) {
                console.warn('⚠️ Pocos datos para calcular soporte/resistencia, usando método simplificado');
                return this.calculateSimpleSupportResistance(priceValues);
            }

            const currentPrice = priceValues[priceValues.length - 1];
            
            if (priceValues.length >= 50) {
                // Método complejo para muchos datos
                const pivots = this.findPivotPoints(priceValues, 5);
                return this.processPivotLevels(pivots, currentPrice, priceValues);
            } else {
                // Método simplificado para pocos datos
                return this.calculateSimpleSupportResistance(priceValues);
            }

        } catch (error) {
            console.warn('⚠️ Error calculando soporte/resistencia:', error.message);
            return this.getDefaultSupportResistance();
        }
    }

    // Calcular soporte y resistencia simplificado
    calculateSimpleSupportResistance(priceValues) {
        if (!priceValues || priceValues.length === 0) {
            return this.getDefaultSupportResistance();
        }

        const currentPrice = priceValues[priceValues.length - 1];
        const maxPrice = Math.max(...priceValues);
        const minPrice = Math.min(...priceValues);

        // Calcular niveles basados en máximos y mínimos
        const priceRange = maxPrice - minPrice;
        const stepSize = priceRange / 4;

        const supports = [];
        const resistances = [];

        // Generar niveles de soporte debajo del precio actual
        for (let i = 1; i <= 3; i++) {
            const supportLevel = currentPrice - (stepSize * i * 0.3);
            if (supportLevel > minPrice && supportLevel < currentPrice) {
                supports.push({
                    price: supportLevel,
                    strength: i === 1 ? 'Fuerte' : i === 2 ? 'Moderado' : 'Débil',
                    distance: ((currentPrice - supportLevel) / currentPrice * 100).toFixed(2) + '%'
                });
            }
        }

        // Generar niveles de resistencia arriba del precio actual
        for (let i = 1; i <= 3; i++) {
            const resistanceLevel = currentPrice + (stepSize * i * 0.3);
            if (resistanceLevel < maxPrice && resistanceLevel > currentPrice) {
                resistances.push({
                    price: resistanceLevel,
                    strength: i === 1 ? 'Fuerte' : i === 2 ? 'Moderado' : 'Débil',
                    distance: ((resistanceLevel - currentPrice) / currentPrice * 100).toFixed(2) + '%'
                });
            }
        }

        return { supports, resistances };
    }

    // Procesar niveles de pivotes
    processPivotLevels(pivots, currentPrice, priceValues) {
        // Filtrar y clasificar niveles
        const supports = pivots.lows
            .filter(p => p.price < currentPrice)
            .sort((a, b) => b.price - a.price)
            .slice(0, 3)
            .map(p => ({
                price: p.price,
                strength: this.calculateLevelStrength(p, priceValues),
                distance: ((currentPrice - p.price) / currentPrice * 100).toFixed(2) + '%'
            }));
        
        const resistances = pivots.highs
            .filter(p => p.price > currentPrice)
            .sort((a, b) => a.price - b.price)
            .slice(0, 3)
            .map(p => ({
                price: p.price,
                strength: this.calculateLevelStrength(p, priceValues),
                distance: ((p.price - currentPrice) / currentPrice * 100).toFixed(2) + '%'
            }));
        
        this.supportResistanceLevels = { supports, resistances };
        return this.supportResistanceLevels;
    }

    // Obtener niveles de soporte y resistencia por defecto
    getDefaultSupportResistance() {
        // Si tenemos un precio actual, generar niveles básicos
        const currentPrice = this.currentPrice || 0.5; // Precio base para XRP
        
        const supports = [
            {
                price: currentPrice * 0.95,
                strength: 'Moderado',
                distance: '5.00%'
            },
            {
                price: currentPrice * 0.90,
                strength: 'Fuerte',
                distance: '10.00%'
            }
        ];

        const resistances = [
            {
                price: currentPrice * 1.05,
                strength: 'Moderado',
                distance: '5.00%'
            },
            {
                price: currentPrice * 1.10,
                strength: 'Fuerte',
                distance: '10.00%'
            }
        ];

        return { supports, resistances };
    }

    // Encontrar puntos pivote
    findPivotPoints(prices, lookback = 5) {
        const pivots = { highs: [], lows: [] };
        
        for (let i = lookback; i < prices.length - lookback; i++) {
            let isHigh = true;
            let isLow = true;
            
            // Verificar si es un máximo local
            for (let j = i - lookback; j <= i + lookback; j++) {
                if (j !== i) {
                    if (prices[j] >= prices[i]) isHigh = false;
                    if (prices[j] <= prices[i]) isLow = false;
                }
            }
            
            if (isHigh) {
                pivots.highs.push({
                    price: prices[i],
                    index: i,
                    timestamp: Date.now() - (prices.length - i) * 3600000
                });
            }
            
            if (isLow) {
                pivots.lows.push({
                    price: prices[i],
                    index: i,
                    timestamp: Date.now() - (prices.length - i) * 3600000
                });
            }
        }
        
        return pivots;
    }

    // Calcular fuerza del nivel
    calculateLevelStrength(pivot, prices) {
        const tolerance = 0.001; // 0.1% tolerance
        let touches = 0;
        
        for (let price of prices) {
            if (Math.abs(price - pivot.price) / pivot.price < tolerance) {
                touches++;
            }
        }
        
        if (touches >= 3) return 'Muy Fuerte';
        if (touches >= 2) return 'Fuerte';
        return 'Moderado';
    }

    // Verificar alertas de precio
    checkPriceAlerts(currentPrice, previousPrice) {
        const alerts = [];
        
        if (previousPrice > 0) {
            const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
            
            if (Math.abs(changePercent) >= this.alertThresholds.priceChange) {
                alerts.push({
                    type: changePercent > 0 ? 'price_up' : 'price_down',
                    title: changePercent > 0 ? '📈 Movimiento Alcista' : '📉 Movimiento Bajista',
                    message: `XRP ha cambiado ${changePercent.toFixed(2)}% a $${currentPrice.toFixed(4)}`,
                    timestamp: Date.now()
                });
            }
        }
        
        return alerts;
    }

    // Obtener recomendaciones por defecto
    getDefaultRecommendations() {
        return {
            action: 'hold',
            recommendation: 'ANALIZANDO MERCADO - Datos insuficientes',
            icon: '📊',
            confidence: 50,
            entryPrice: 0,
            stopLoss: 0,
            takeProfit: 0,
            riskReward: 1,
            signals: this.generateNeutralSignals(),
            timestamp: Date.now()
        };
    }

    // Obtener resumen de trading
    getTradingSummary() {
        const signalTypes = this.signals.reduce((acc, signal) => {
            acc[signal.type] = (acc[signal.type] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalSignals: this.signals.length,
            bullishSignals: signalTypes.buy || 0,
            bearishSignals: signalTypes.sell || 0,
            neutralSignals: signalTypes.neutral || 0,
            overallSentiment: this.getOverallSentiment(signalTypes),
            lastUpdate: Date.now()
        };
    }

    // Determinar sentimiento general
    getOverallSentiment(signalTypes) {
        const bullish = signalTypes.buy || 0;
        const bearish = signalTypes.sell || 0;
        
        if (bullish > bearish + 1) return 'bullish';
        if (bearish > bullish + 1) return 'bearish';
        return 'neutral';
    }
}

// Crear instancia global
window.tradingEngine = new TradingEngine();
