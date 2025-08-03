// backtesting-engine.js - Motor de backtesting avanzado para estrategias de trading

class BacktestingEngine {
    constructor() {
        this.strategies = new Map();
        this.backtests = new Map();
        this.marketData = new Map();
        this.performance = new PerformanceMonitor();
        
        this.defaultCommission = 0.001; // 0.1%
        this.defaultSlippage = 0.0005; // 0.05%
        this.startingCapital = 10000;
        
        this.initializeDefaultStrategies();
    }

    initializeDefaultStrategies() {
        // RSI Mean Reversion Strategy
        this.registerStrategy('rsi_mean_reversion', {
            name: 'RSI Mean Reversion',
            description: 'Compra cuando RSI < 30, vende cuando RSI > 70',
            parameters: {
                rsiPeriod: 14,
                oversold: 30,
                overbought: 70,
                stopLoss: 0.05,
                takeProfit: 0.10
            },
            execute: this.rsiMeanReversionStrategy.bind(this)
        });

        // Moving Average Crossover
        this.registerStrategy('ma_crossover', {
            name: 'Moving Average Crossover',
            description: 'Crossover de medias móviles rápida y lenta',
            parameters: {
                fastPeriod: 10,
                slowPeriod: 30,
                stopLoss: 0.03,
                takeProfit: 0.08
            },
            execute: this.movingAverageCrossoverStrategy.bind(this)
        });

        // Bollinger Bands Strategy
        this.registerStrategy('bollinger_bands', {
            name: 'Bollinger Bands',
            description: 'Trading basado en bandas de Bollinger',
            parameters: {
                period: 20,
                multiplier: 2,
                stopLoss: 0.04,
                takeProfit: 0.12
            },
            execute: this.bollingerBandsStrategy.bind(this)
        });

        // MACD Strategy
        this.registerStrategy('macd', {
            name: 'MACD Strategy',
            description: 'Señales basadas en MACD',
            parameters: {
                fastEMA: 12,
                slowEMA: 26,
                signalLine: 9,
                stopLoss: 0.06,
                takeProfit: 0.15
            },
            execute: this.macdStrategy.bind(this)
        });
    }

    // ============ GESTIÓN DE ESTRATEGIAS ============

    registerStrategy(id, strategy) {
        this.strategies.set(id, {
            ...strategy,
            id,
            registered: Date.now()
        });
        console.log(`📈 Estrategia "${strategy.name}" registrada`);
    }

    getStrategy(id) {
        return this.strategies.get(id);
    }

    listStrategies() {
        return Array.from(this.strategies.values());
    }

    // ============ MOTOR DE BACKTESTING ============

    async runBacktest(config) {
        const profile = this.performance.startProfile('run_backtest');
        
        try {
            const {
                strategyId,
                symbol,
                startDate,
                endDate,
                initialCapital = this.startingCapital,
                commission = this.defaultCommission,
                slippage = this.defaultSlippage,
                parameters = {}
            } = config;

            const strategy = this.strategies.get(strategyId);
            if (!strategy) {
                throw new Error(`Estrategia ${strategyId} no encontrada`);
            }

            // Preparar datos históricos
            const marketData = await this.prepareMarketData(symbol, startDate, endDate);
            if (marketData.length < 50) {
                throw new Error('Datos insuficientes para backtesting');
            }

            // Configuración del backtest
            const backtestConfig = {
                id: this.generateId(),
                strategy: { ...strategy, parameters: { ...strategy.parameters, ...parameters } },
                symbol,
                startDate,
                endDate,
                initialCapital,
                commission,
                slippage,
                marketData: marketData.length,
                started: Date.now()
            };

            // Estado del portfolio
            const portfolio = {
                cash: initialCapital,
                position: 0,
                positionValue: 0,
                totalValue: initialCapital,
                trades: [],
                equity: [initialCapital],
                drawdowns: [],
                highWaterMark: initialCapital
            };

            // Ejecutar backtesting
            const results = await this.executeBacktest(backtestConfig, marketData, portfolio);
            
            // Calcular métricas
            const metrics = this.calculateBacktestMetrics(results);
            
            // Guardar resultados
            const backtest = {
                ...backtestConfig,
                results,
                metrics,
                completed: Date.now(),
                duration: Date.now() - backtestConfig.started
            };

            this.backtests.set(backtest.id, backtest);
            
            profile.end();
            console.log(`✅ Backtest completado: ${backtest.id}`);
            return backtest;

        } catch (error) {
            profile.end();
            console.error('Error en backtesting:', error);
            throw error;
        }
    }

    async executeBacktest(config, marketData, portfolio) {
        const signals = [];
        const equity = [config.initialCapital];
        const strategy = config.strategy;

        // Inicializar indicadores
        const indicators = this.initializeIndicators(marketData, strategy.parameters);

        for (let i = 50; i < marketData.length; i++) { // Skip inicial para indicadores
            const currentBar = marketData[i];
            const historicalData = marketData.slice(0, i + 1);

            // Actualizar indicadores
            this.updateIndicators(indicators, currentBar, i);

            // Ejecutar estrategia
            const signal = strategy.execute(
                currentBar,
                historicalData,
                indicators,
                portfolio,
                i
            );

            if (signal) {
                // Procesar señal
                const trade = this.processSignal(
                    signal,
                    currentBar,
                    portfolio,
                    config,
                    i
                );

                if (trade) {
                    portfolio.trades.push(trade);
                    signals.push({ ...signal, bar: i, timestamp: currentBar.timestamp });
                }
            }

            // Actualizar valor del portfolio
            this.updatePortfolioValue(portfolio, currentBar);
            equity.push(portfolio.totalValue);

            // Calcular drawdown
            if (portfolio.totalValue > portfolio.highWaterMark) {
                portfolio.highWaterMark = portfolio.totalValue;
            }
            const drawdown = (portfolio.highWaterMark - portfolio.totalValue) / portfolio.highWaterMark;
            portfolio.drawdowns.push(drawdown);

            // Control de riesgo
            await this.checkRiskControls(portfolio, config);
        }

        return {
            portfolio,
            signals,
            equity,
            finalValue: portfolio.totalValue,
            totalReturn: ((portfolio.totalValue / config.initialCapital) - 1) * 100,
            totalTrades: portfolio.trades.length
        };
    }

    processSignal(signal, bar, portfolio, config, barIndex) {
        const { type, size, price, stopLoss, takeProfit } = signal;
        
        if (type === 'BUY' && portfolio.cash > 0) {
            const sharesAffordable = Math.floor(portfolio.cash / (price * (1 + config.slippage)));
            const sharesToBuy = size ? Math.min(size, sharesAffordable) : sharesAffordable;
            
            if (sharesToBuy > 0) {
                const executionPrice = price * (1 + config.slippage);
                const cost = sharesToBuy * executionPrice;
                const commission = cost * config.commission;
                const totalCost = cost + commission;

                if (portfolio.cash >= totalCost) {
                    portfolio.cash -= totalCost;
                    portfolio.position += sharesToBuy;

                    return {
                        id: this.generateId(),
                        type: 'BUY',
                        timestamp: bar.timestamp,
                        bar: barIndex,
                        shares: sharesToBuy,
                        price: executionPrice,
                        commission,
                        cost: totalCost,
                        stopLoss,
                        takeProfit,
                        portfolioValue: portfolio.totalValue
                    };
                }
            }
        } 
        else if (type === 'SELL' && portfolio.position > 0) {
            const sharesToSell = size ? Math.min(size, portfolio.position) : portfolio.position;
            
            if (sharesToSell > 0) {
                const executionPrice = price * (1 - config.slippage);
                const proceeds = sharesToSell * executionPrice;
                const commission = proceeds * config.commission;
                const netProceeds = proceeds - commission;

                portfolio.cash += netProceeds;
                portfolio.position -= sharesToSell;

                return {
                    id: this.generateId(),
                    type: 'SELL',
                    timestamp: bar.timestamp,
                    bar: barIndex,
                    shares: sharesToSell,
                    price: executionPrice,
                    commission,
                    proceeds: netProceeds,
                    portfolioValue: portfolio.totalValue
                };
            }
        }

        return null;
    }

    updatePortfolioValue(portfolio, currentBar) {
        portfolio.positionValue = portfolio.position * currentBar.close;
        portfolio.totalValue = portfolio.cash + portfolio.positionValue;
        portfolio.equity.push(portfolio.totalValue);
    }

    // ============ ESTRATEGIAS DE TRADING ============

    rsiMeanReversionStrategy(bar, history, indicators, portfolio, index) {
        const { rsiPeriod, oversold, overbought, stopLoss, takeProfit } = 
              this.strategies.get('rsi_mean_reversion').parameters;

        const rsi = indicators.rsi[index];
        if (!rsi) return null;

        const currentPrice = bar.close;

        // Señal de compra
        if (rsi < oversold && portfolio.position === 0) {
            return {
                type: 'BUY',
                price: currentPrice,
                stopLoss: currentPrice * (1 - stopLoss),
                takeProfit: currentPrice * (1 + takeProfit),
                reason: `RSI oversold: ${rsi.toFixed(2)}`
            };
        }

        // Señal de venta
        if (rsi > overbought && portfolio.position > 0) {
            return {
                type: 'SELL',
                price: currentPrice,
                reason: `RSI overbought: ${rsi.toFixed(2)}`
            };
        }

        return null;
    }

    movingAverageCrossoverStrategy(bar, history, indicators, portfolio, index) {
        const { fastPeriod, slowPeriod, stopLoss, takeProfit } = 
              this.strategies.get('ma_crossover').parameters;

        const fastMA = indicators.fastMA[index];
        const slowMA = indicators.slowMA[index];
        const prevFastMA = indicators.fastMA[index - 1];
        const prevSlowMA = indicators.slowMA[index - 1];

        if (!fastMA || !slowMA || !prevFastMA || !prevSlowMA) return null;

        const currentPrice = bar.close;

        // Golden Cross (compra)
        if (prevFastMA <= prevSlowMA && fastMA > slowMA && portfolio.position === 0) {
            return {
                type: 'BUY',
                price: currentPrice,
                stopLoss: currentPrice * (1 - stopLoss),
                takeProfit: currentPrice * (1 + takeProfit),
                reason: `Golden Cross: Fast MA ${fastMA.toFixed(2)} > Slow MA ${slowMA.toFixed(2)}`
            };
        }

        // Death Cross (venta)
        if (prevFastMA >= prevSlowMA && fastMA < slowMA && portfolio.position > 0) {
            return {
                type: 'SELL',
                price: currentPrice,
                reason: `Death Cross: Fast MA ${fastMA.toFixed(2)} < Slow MA ${slowMA.toFixed(2)}`
            };
        }

        return null;
    }

    bollingerBandsStrategy(bar, history, indicators, portfolio, index) {
        const { period, multiplier, stopLoss, takeProfit } = 
              this.strategies.get('bollinger_bands').parameters;

        const upperBand = indicators.upperBand[index];
        const lowerBand = indicators.lowerBand[index];
        const middleBand = indicators.middleBand[index];

        if (!upperBand || !lowerBand || !middleBand) return null;

        const currentPrice = bar.close;

        // Compra en banda inferior
        if (currentPrice <= lowerBand && portfolio.position === 0) {
            return {
                type: 'BUY',
                price: currentPrice,
                stopLoss: currentPrice * (1 - stopLoss),
                takeProfit: middleBand,
                reason: `Price hit lower band: ${currentPrice.toFixed(2)} <= ${lowerBand.toFixed(2)}`
            };
        }

        // Venta en banda superior
        if (currentPrice >= upperBand && portfolio.position > 0) {
            return {
                type: 'SELL',
                price: currentPrice,
                reason: `Price hit upper band: ${currentPrice.toFixed(2)} >= ${upperBand.toFixed(2)}`
            };
        }

        // Venta en banda media
        if (currentPrice >= middleBand && portfolio.position > 0) {
            return {
                type: 'SELL',
                price: currentPrice,
                reason: `Price reached middle band: ${currentPrice.toFixed(2)}`
            };
        }

        return null;
    }

    macdStrategy(bar, history, indicators, portfolio, index) {
        const { fastEMA, slowEMA, signalLine, stopLoss, takeProfit } = 
              this.strategies.get('macd').parameters;

        const macd = indicators.macd[index];
        const signal = indicators.macdSignal[index];
        const prevMacd = indicators.macd[index - 1];
        const prevSignal = indicators.macdSignal[index - 1];

        if (!macd || !signal || !prevMacd || !prevSignal) return null;

        const currentPrice = bar.close;

        // Bullish crossover
        if (prevMacd <= prevSignal && macd > signal && portfolio.position === 0) {
            return {
                type: 'BUY',
                price: currentPrice,
                stopLoss: currentPrice * (1 - stopLoss),
                takeProfit: currentPrice * (1 + takeProfit),
                reason: `MACD bullish crossover: ${macd.toFixed(4)} > ${signal.toFixed(4)}`
            };
        }

        // Bearish crossover
        if (prevMacd >= prevSignal && macd < signal && portfolio.position > 0) {
            return {
                type: 'SELL',
                price: currentPrice,
                reason: `MACD bearish crossover: ${macd.toFixed(4)} < ${signal.toFixed(4)}`
            };
        }

        return null;
    }

    // ============ INDICADORES TÉCNICOS ============

    initializeIndicators(marketData, parameters) {
        const indicators = {
            rsi: [],
            fastMA: [],
            slowMA: [],
            upperBand: [],
            lowerBand: [],
            middleBand: [],
            macd: [],
            macdSignal: [],
            ema12: [],
            ema26: []
        };

        // Pre-calcular indicadores
        this.calculateRSI(marketData, indicators, parameters.rsiPeriod || 14);
        this.calculateMovingAverages(marketData, indicators, parameters);
        this.calculateBollingerBands(marketData, indicators, parameters);
        this.calculateMACD(marketData, indicators, parameters);

        return indicators;
    }

    updateIndicators(indicators, bar, index) {
        // Los indicadores ya están pre-calculados
        // Esta función se mantiene para compatibilidad y futuras extensiones
    }

    calculateRSI(data, indicators, period = 14) {
        const gains = [];
        const losses = [];

        for (let i = 1; i < data.length; i++) {
            const change = data[i].close - data[i - 1].close;
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }

        for (let i = 0; i < period; i++) {
            indicators.rsi.push(null);
        }

        for (let i = period; i < data.length; i++) {
            const periodGains = gains.slice(i - period, i);
            const periodLosses = losses.slice(i - period, i);

            const avgGain = periodGains.reduce((a, b) => a + b, 0) / period;
            const avgLoss = periodLosses.reduce((a, b) => a + b, 0) / period;

            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));

            indicators.rsi.push(rsi);
        }
    }

    calculateMovingAverages(data, indicators, parameters) {
        const fastPeriod = parameters.fastPeriod || 10;
        const slowPeriod = parameters.slowPeriod || 30;

        this.calculateSMA(data, indicators.fastMA, fastPeriod);
        this.calculateSMA(data, indicators.slowMA, slowPeriod);
    }

    calculateSMA(data, array, period) {
        for (let i = 0; i < period - 1; i++) {
            array.push(null);
        }

        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const average = slice.reduce((sum, bar) => sum + bar.close, 0) / period;
            array.push(average);
        }
    }

    calculateBollingerBands(data, indicators, parameters) {
        const period = parameters.period || 20;
        const multiplier = parameters.multiplier || 2;

        for (let i = 0; i < period - 1; i++) {
            indicators.upperBand.push(null);
            indicators.lowerBand.push(null);
            indicators.middleBand.push(null);
        }

        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const prices = slice.map(bar => bar.close);
            
            const sma = prices.reduce((a, b) => a + b, 0) / period;
            const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
            const stdDev = Math.sqrt(variance);

            indicators.middleBand.push(sma);
            indicators.upperBand.push(sma + (stdDev * multiplier));
            indicators.lowerBand.push(sma - (stdDev * multiplier));
        }
    }

    calculateMACD(data, indicators, parameters) {
        const fastEMA = parameters.fastEMA || 12;
        const slowEMA = parameters.slowEMA || 26;
        const signalLine = parameters.signalLine || 9;

        this.calculateEMA(data, indicators.ema12, fastEMA);
        this.calculateEMA(data, indicators.ema26, slowEMA);

        // MACD Line
        for (let i = 0; i < data.length; i++) {
            if (indicators.ema12[i] !== null && indicators.ema26[i] !== null) {
                indicators.macd.push(indicators.ema12[i] - indicators.ema26[i]);
            } else {
                indicators.macd.push(null);
            }
        }

        // Signal Line (EMA of MACD)
        this.calculateEMAFromArray(indicators.macd, indicators.macdSignal, signalLine);
    }

    calculateEMA(data, array, period) {
        const multiplier = 2 / (period + 1);

        for (let i = 0; i < period - 1; i++) {
            array.push(null);
        }

        // Primera EMA es SMA
        const firstSMA = data.slice(0, period).reduce((sum, bar) => sum + bar.close, 0) / period;
        array.push(firstSMA);

        for (let i = period; i < data.length; i++) {
            const ema = (data[i].close * multiplier) + (array[i - 1] * (1 - multiplier));
            array.push(ema);
        }
    }

    calculateEMAFromArray(sourceArray, targetArray, period) {
        const multiplier = 2 / (period + 1);

        for (let i = 0; i < sourceArray.length; i++) {
            if (sourceArray[i] === null) {
                targetArray.push(null);
            } else if (targetArray.length === 0 || targetArray[targetArray.length - 1] === null) {
                // Primera EMA válida
                const validValues = sourceArray.slice(0, i + 1).filter(v => v !== null);
                if (validValues.length >= period) {
                    const sma = validValues.slice(-period).reduce((a, b) => a + b, 0) / period;
                    targetArray.push(sma);
                } else {
                    targetArray.push(null);
                }
            } else {
                const ema = (sourceArray[i] * multiplier) + (targetArray[targetArray.length - 1] * (1 - multiplier));
                targetArray.push(ema);
            }
        }
    }

    // ============ MÉTRICAS DE BACKTEST ============

    calculateBacktestMetrics(results) {
        const { portfolio, equity } = results;
        const trades = portfolio.trades;
        
        if (trades.length === 0) {
            return this.getEmptyMetrics();
        }

        const returns = this.calculateReturns(equity);
        const winningTrades = trades.filter(t => this.isWinningTrade(t, trades));
        const losingTrades = trades.filter(t => this.isLosingTrade(t, trades));

        return {
            // Performance Metrics
            totalReturn: results.totalReturn,
            annualizedReturn: this.calculateAnnualizedReturn(equity),
            sharpeRatio: this.calculateSharpeRatio(returns),
            sortinoRatio: this.calculateSortinoRatio(returns),
            calmarRatio: this.calculateCalmarRatio(returns, portfolio.drawdowns),
            
            // Risk Metrics
            maxDrawdown: Math.max(...portfolio.drawdowns) * 100,
            volatility: this.calculateVolatility(returns) * 100,
            var95: this.calculateVaR(returns, 0.95),
            
            // Trade Metrics
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: (winningTrades.length / trades.length) * 100,
            
            // Profit Metrics
            avgWin: winningTrades.length > 0 ? 
                   winningTrades.reduce((sum, t) => sum + this.getTradePnL(t, trades), 0) / winningTrades.length : 0,
            avgLoss: losingTrades.length > 0 ? 
                    losingTrades.reduce((sum, t) => sum + this.getTradePnL(t, trades), 0) / losingTrades.length : 0,
            profitFactor: this.calculateProfitFactor(winningTrades, losingTrades, trades),
            
            // Efficiency Metrics
            expectancy: this.calculateExpectancy(winningTrades, losingTrades, trades),
            payoffRatio: this.calculatePayoffRatio(winningTrades, losingTrades, trades),
            
            // Portfolio Metrics
            finalValue: results.finalValue,
            equity: equity,
            drawdowns: portfolio.drawdowns
        };
    }

    calculateReturns(equity) {
        const returns = [];
        for (let i = 1; i < equity.length; i++) {
            if (equity[i - 1] > 0) {
                returns.push((equity[i] / equity[i - 1]) - 1);
            }
        }
        return returns;
    }

    calculateAnnualizedReturn(equity) {
        if (equity.length < 2) return 0;
        
        const totalReturn = (equity[equity.length - 1] / equity[0]) - 1;
        const years = equity.length / 252; // Trading days
        
        return (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
    }

    calculateSharpeRatio(returns) {
        if (returns.length === 0) return 0;
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const volatility = this.calculateVolatility(returns);
        const riskFreeRate = 0.02 / 252; // Daily risk-free rate
        
        return volatility === 0 ? 0 : (avgReturn - riskFreeRate) / volatility * Math.sqrt(252);
    }

    calculateSortinoRatio(returns) {
        if (returns.length === 0) return 0;
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const downside = returns.filter(r => r < 0);
        const downsideDeviation = downside.length > 0 ? 
            Math.sqrt(downside.reduce((sum, r) => sum + r * r, 0) / downside.length) : 0;
        const riskFreeRate = 0.02 / 252;
        
        return downsideDeviation === 0 ? 0 : (avgReturn - riskFreeRate) / downsideDeviation * Math.sqrt(252);
    }

    calculateCalmarRatio(returns, drawdowns) {
        const annualizedReturn = this.calculateAnnualizedReturn(returns);
        const maxDrawdown = Math.max(...drawdowns) * 100;
        
        return maxDrawdown === 0 ? 0 : annualizedReturn / maxDrawdown;
    }

    calculateVolatility(returns) {
        if (returns.length < 2) return 0;
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
        
        return Math.sqrt(variance);
    }

    calculateVaR(returns, confidence = 0.95) {
        if (returns.length === 0) return 0;
        
        const sorted = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidence) * sorted.length);
        
        return Math.abs(sorted[index] || 0) * 100;
    }

    isWinningTrade(trade, allTrades) {
        return this.getTradePnL(trade, allTrades) > 0;
    }

    isLosingTrade(trade, allTrades) {
        return this.getTradePnL(trade, allTrades) < 0;
    }

    getTradePnL(trade, allTrades) {
        if (trade.type === 'SELL') {
            // Encontrar la compra correspondiente
            const buyTrade = this.findMatchingBuy(trade, allTrades);
            if (buyTrade) {
                return (trade.price - buyTrade.price) * trade.shares - trade.commission - buyTrade.commission;
            }
        }
        return 0;
    }

    findMatchingBuy(sellTrade, allTrades) {
        // Buscar la última compra antes de esta venta
        for (let i = allTrades.indexOf(sellTrade) - 1; i >= 0; i--) {
            if (allTrades[i].type === 'BUY') {
                return allTrades[i];
            }
        }
        return null;
    }

    calculateProfitFactor(winningTrades, losingTrades, allTrades) {
        const totalWins = winningTrades.reduce((sum, t) => sum + this.getTradePnL(t, allTrades), 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + this.getTradePnL(t, allTrades), 0));
        
        return totalLosses === 0 ? Infinity : totalWins / totalLosses;
    }

    calculateExpectancy(winningTrades, losingTrades, allTrades) {
        const winRate = winningTrades.length / (winningTrades.length + losingTrades.length);
        const avgWin = winningTrades.length > 0 ? 
                     winningTrades.reduce((sum, t) => sum + this.getTradePnL(t, allTrades), 0) / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? 
                       losingTrades.reduce((sum, t) => sum + this.getTradePnL(t, allTrades), 0) / losingTrades.length : 0;
        
        return (winRate * avgWin) + ((1 - winRate) * avgLoss);
    }

    calculatePayoffRatio(winningTrades, losingTrades, allTrades) {
        const avgWin = winningTrades.length > 0 ? 
                     winningTrades.reduce((sum, t) => sum + this.getTradePnL(t, allTrades), 0) / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? 
                       Math.abs(losingTrades.reduce((sum, t) => sum + this.getTradePnL(t, allTrades), 0) / losingTrades.length) : 0;
        
        return avgLoss === 0 ? Infinity : avgWin / avgLoss;
    }

    getEmptyMetrics() {
        return {
            totalReturn: 0,
            annualizedReturn: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
            calmarRatio: 0,
            maxDrawdown: 0,
            volatility: 0,
            var95: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            avgWin: 0,
            avgLoss: 0,
            profitFactor: 0,
            expectancy: 0,
            payoffRatio: 0,
            finalValue: 0,
            equity: [],
            drawdowns: []
        };
    }

    // ============ OPTIMIZACIÓN DE PARÁMETROS ============

    async optimizeStrategy(config) {
        const {
            strategyId,
            symbol,
            startDate,
            endDate,
            parameterRanges,
            optimizationTarget = 'sharpeRatio',
            maxIterations = 100
        } = config;

        console.log(`🔧 Optimizando estrategia ${strategyId}...`);

        const results = [];
        const parameterKeys = Object.keys(parameterRanges);
        
        // Grid search simple
        for (let i = 0; i < maxIterations; i++) {
            const parameters = this.generateRandomParameters(parameterRanges);
            
            try {
                const backtest = await this.runBacktest({
                    strategyId,
                    symbol,
                    startDate,
                    endDate,
                    parameters
                });

                results.push({
                    parameters,
                    metrics: backtest.metrics,
                    score: backtest.metrics[optimizationTarget] || 0
                });

            } catch (error) {
                console.warn(`Iteración ${i} falló:`, error.message);
            }
        }

        // Ordenar por score
        results.sort((a, b) => b.score - a.score);

        return {
            bestParameters: results[0]?.parameters || {},
            bestScore: results[0]?.score || 0,
            allResults: results.slice(0, 20), // Top 20
            optimizationTarget,
            iterations: results.length
        };
    }

    generateRandomParameters(ranges) {
        const parameters = {};
        
        Object.entries(ranges).forEach(([key, range]) => {
            const { min, max, step = 1 } = range;
            const steps = Math.floor((max - min) / step) + 1;
            const randomStep = Math.floor(Math.random() * steps);
            parameters[key] = min + (randomStep * step);
        });

        return parameters;
    }

    // ============ UTILIDADES ============

    async prepareMarketData(symbol, startDate, endDate) {
        // Generar datos sintéticos para demo
        // En producción, obtener datos reales de APIs
        
        const data = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dayMs = 24 * 60 * 60 * 1000;
        
        let currentPrice = 1.0 + Math.random() * 2; // Precio inicial
        
        for (let d = start; d <= end; d = new Date(d.getTime() + dayMs)) {
            // Skip weekends
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            
            // Random walk con tendencia
            const trend = 0.0001; // Slight upward trend
            const volatility = 0.02;
            const change = trend + (Math.random() - 0.5) * volatility;
            
            currentPrice *= (1 + change);
            
            const open = currentPrice * (1 + (Math.random() - 0.5) * 0.001);
            const high = Math.max(open, currentPrice) * (1 + Math.random() * 0.01);
            const low = Math.min(open, currentPrice) * (1 - Math.random() * 0.01);
            const close = currentPrice;
            const volume = 1000000 + Math.random() * 9000000;
            
            data.push({
                timestamp: d.getTime(),
                date: d.toISOString().split('T')[0],
                open,
                high,
                low,
                close,
                volume
            });
        }
        
        return data;
    }

    async checkRiskControls(portfolio, config) {
        // Implementar controles de riesgo en tiempo real
        const drawdown = (portfolio.highWaterMark - portfolio.totalValue) / portfolio.highWaterMark;
        
        if (drawdown > 0.2) { // 20% max drawdown
            console.warn('⚠️ Máximo drawdown alcanzado');
            // Implementar stop automático si es necesario
        }
    }

    getBacktest(id) {
        return this.backtests.get(id);
    }

    listBacktests() {
        return Array.from(this.backtests.values());
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ============ CLEANUP ============

    cleanup() {
        this.strategies.clear();
        this.backtests.clear();
        this.marketData.clear();
    }
}

// Crear instancia global
window.backtestingEngine = new BacktestingEngine();

console.log('🔙 Backtesting Engine cargado');
