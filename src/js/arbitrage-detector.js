// arbitrage-detector.js - Sistema de detección de arbitraje cross-exchange

class ArbitrageDetector {
    constructor() {
        this.exchanges = this.initializeExchanges();
        this.opportunities = [];
        this.minProfitThreshold = 0.005; // 0.5% mínimo
        this.maxLatency = 2000; // 2 segundos máximo
        this.cache = new Map();
        this.performance = new PerformanceMonitor();
        this.fees = this.initializeFees();
        this.alertCallbacks = [];
        this.config = {
            enabled: true,
            minProfitThreshold: 0.005,
            maxLatency: 2000,
            scanInterval: 30000 // 30 segundos
        };
    }

    // ============ CONFIGURACIÓN ============

    configure(options = {}) {
        this.config = { ...this.config, ...options };
        this.minProfitThreshold = this.config.minProfitThreshold;
        this.maxLatency = this.config.maxLatency;
        console.log('⚖️ Arbitrage Detector configurado:', this.config);
    }

    initializeExchanges() {
        return [
            {
                name: 'Binance',
                api: 'https://api.binance.com/api/v3',
                symbol: 'XRPUSDT',
                active: true,
                reliability: 0.95
            },
            {
                name: 'CoinGecko',
                api: 'https://api.coingecko.com/api/v3',
                symbol: 'ripple',
                active: true,
                reliability: 0.85
            },
            {
                name: 'CoinPaprika',
                api: 'https://api.coinpaprika.com/v1',
                symbol: 'xrp-xrp',
                active: true,
                reliability: 0.90
            }
        ];
    }

    initializeFees() {
        return {
            'Binance': { maker: 0.001, taker: 0.001 }, // 0.1%
            'CoinGecko': { maker: 0.0025, taker: 0.0025 }, // 0.25% estimado
            'CoinPaprika': { maker: 0.002, taker: 0.002 }, // 0.2% estimado
            'transfer': 0.0001 // Fee de transferencia estimado
        };
    }

    async scanArbitrageOpportunities(symbol = 'XRP') {
        const profile = this.performance.startProfile('scanArbitrage');
        const startTime = performance.now();
        
        try {
            // Fetch paralelo de precios de todos los exchanges
            const pricePromises = this.exchanges
                .filter(exchange => exchange.active)
                .map(async (exchange) => {
                    try {
                        const price = await this.fetchPriceFromExchange(exchange, symbol);
                        return {
                            exchange: exchange.name,
                            bid: price.bid,
                            ask: price.ask,
                            timestamp: Date.now(),
                            volume: price.volume,
                            reliability: exchange.reliability,
                            spread: price.ask - price.bid,
                            midPrice: (price.bid + price.ask) / 2
                        };
                    } catch (error) {
                        console.warn(`Error fetching from ${exchange.name}:`, error.message);
                        return null;
                    }
                });

            const prices = (await Promise.all(pricePromises)).filter(p => p !== null);
            const latency = performance.now() - startTime;
            
            if (latency > this.maxLatency) {
                console.warn(`Latencia alta detectada: ${latency.toFixed(2)}ms`);
            }

            if (prices.length < 2) {
                console.warn('Insuficientes precios para análisis de arbitraje');
                return [];
            }

            const opportunities = this.findArbitrageOpportunities(prices, symbol);
            this.opportunities = opportunities;

            profile.end();
            return opportunities;
            
        } catch (error) {
            profile.end();
            console.error(`Error scanning arbitrage for ${symbol}:`, error);
            return [];
        }
    }

    async fetchPriceFromExchange(exchange, symbol) {
        const cacheKey = `${exchange.name}_${symbol}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 5000) { // 5 segundos cache
            return cached.data;
        }

        let price;
        
        switch (exchange.name) {
            case 'Binance':
                price = await this.fetchBinancePrice(exchange.symbol);
                break;
            case 'CoinGecko':
                price = await this.fetchCoinGeckoPrice(exchange.symbol);
                break;
            case 'CoinPaprika':
                price = await this.fetchCoinPaprikaPrice(exchange.symbol);
                break;
            default:
                throw new Error(`Exchange ${exchange.name} not supported`);
        }

        this.cache.set(cacheKey, {
            data: price,
            timestamp: Date.now()
        });

        return price;
    }

    async fetchBinancePrice(symbol) {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`);
        if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
        
        const data = await response.json();
        return {
            bid: parseFloat(data.bidPrice),
            ask: parseFloat(data.askPrice),
            volume: parseFloat(data.bidQty) + parseFloat(data.askQty)
        };
    }

    async fetchCoinGeckoPrice(symbol) {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_vol=true`);
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        
        const data = await response.json();
        const price = data[symbol]?.usd || 0;
        const spread = price * 0.001; // Estimamos 0.1% de spread
        
        return {
            bid: price - spread/2,
            ask: price + spread/2,
            volume: data[symbol]?.usd_24h_vol || 0
        };
    }

    async fetchCoinPaprikaPrice(symbol) {
        const response = await fetch(`https://api.coinpaprika.com/v1/tickers/${symbol}`);
        if (!response.ok) throw new Error(`CoinPaprika API error: ${response.status}`);
        
        const data = await response.json();
        const price = data.quotes?.USD?.price || 0;
        const spread = price * 0.0015; // Estimamos 0.15% de spread
        
        return {
            bid: price - spread/2,
            ask: price + spread/2,
            volume: data.quotes?.USD?.volume_24h || 0
        };
    }

    findArbitrageOpportunities(prices, symbol) {
        const opportunities = [];
        
        // Comparar todos los pares de exchanges
        for (let i = 0; i < prices.length; i++) {
            for (let j = i + 1; j < prices.length; j++) {
                const buyExchange = prices[i];
                const sellExchange = prices[j];
                
                // Calcular profit potencial (comprar en i, vender en j)
                const profit1 = this.calculateProfit(
                    buyExchange.ask, 
                    sellExchange.bid, 
                    buyExchange.exchange,
                    sellExchange.exchange,
                    symbol
                );
                
                // Calcular profit potencial (comprar en j, vender en i)
                const profit2 = this.calculateProfit(
                    sellExchange.ask, 
                    buyExchange.bid, 
                    sellExchange.exchange,
                    buyExchange.exchange,
                    symbol
                );

                if (profit1.percentage > this.minProfitThreshold) {
                    opportunities.push({
                        type: 'arbitrage',
                        symbol,
                        buyExchange: buyExchange.exchange,
                        sellExchange: sellExchange.exchange,
                        buyPrice: buyExchange.ask,
                        sellPrice: sellExchange.bid,
                        profit: profit1,
                        confidence: this.calculateConfidence(buyExchange, sellExchange),
                        latency: profit1.latency,
                        risk: this.calculateRisk(buyExchange, sellExchange),
                        timestamp: Date.now()
                    });
                }

                if (profit2.percentage > this.minProfitThreshold) {
                    opportunities.push({
                        type: 'arbitrage',
                        symbol,
                        buyExchange: sellExchange.exchange,
                        sellExchange: buyExchange.exchange,
                        buyPrice: sellExchange.ask,
                        sellPrice: buyExchange.bid,
                        profit: profit2,
                        confidence: this.calculateConfidence(sellExchange, buyExchange),
                        latency: profit2.latency,
                        risk: this.calculateRisk(sellExchange, buyExchange),
                        timestamp: Date.now()
                    });
                }
            }
        }

        // Ordenar por rentabilidad ajustada por riesgo
        return opportunities
            .sort((a, b) => (b.profit.percentage * b.confidence) - (a.profit.percentage * a.confidence))
            .slice(0, 10); // Top 10 oportunidades
    }

    calculateProfit(buyPrice, sellPrice, buyExchange, sellExchange, symbol) {
        const buyFee = this.fees[buyExchange]?.taker || 0.002;
        const sellFee = this.fees[sellExchange]?.taker || 0.002;
        const transferFee = this.fees.transfer;
        
        const grossProfit = sellPrice - buyPrice;
        const totalFees = (buyPrice * buyFee) + (sellPrice * sellFee) + (buyPrice * transferFee);
        const netProfit = grossProfit - totalFees;
        const percentage = (netProfit / buyPrice) * 100;
        
        return {
            gross: grossProfit,
            net: netProfit,
            percentage,
            fees: totalFees,
            buyFee: buyPrice * buyFee,
            sellFee: sellPrice * sellFee,
            transferFee: buyPrice * transferFee,
            latency: Date.now()
        };
    }

    calculateConfidence(buyExchange, sellExchange) {
        const reliabilityScore = (buyExchange.reliability + sellExchange.reliability) / 2;
        const volumeScore = Math.min(buyExchange.volume, sellExchange.volume) / 10000000; // Normalizar por 10M
        const spreadScore = 1 - Math.max(buyExchange.spread, sellExchange.spread) / 
                           Math.max(buyExchange.midPrice, sellExchange.midPrice);
        
        return Math.min(1, (reliabilityScore * 0.4 + volumeScore * 0.3 + spreadScore * 0.3));
    }

    calculateRisk(buyExchange, sellExchange) {
        const factors = {
            execution: 1 - Math.min(buyExchange.reliability, sellExchange.reliability),
            liquidity: 1 - Math.min(buyExchange.volume, sellExchange.volume) / 5000000,
            timing: Math.abs(buyExchange.timestamp - sellExchange.timestamp) / 10000,
            spread: (buyExchange.spread + sellExchange.spread) / 
                   (buyExchange.midPrice + sellExchange.midPrice)
        };
        
        return (factors.execution * 0.3 + factors.liquidity * 0.3 + 
                factors.timing * 0.2 + factors.spread * 0.2);
    }

    // Análisis histórico de oportunidades
    analyzeHistoricalOpportunities(timeWindow = 3600000) { // 1 hora
        const recent = this.opportunities.filter(
            opp => Date.now() - opp.timestamp < timeWindow
        );
        
        if (recent.length === 0) {
            return {
                count: 0,
                avgProfit: 0,
                maxProfit: 0,
                avgConfidence: 0,
                exchangePairs: {}
            };
        }

        const exchangePairs = {};
        recent.forEach(opp => {
            const pair = `${opp.buyExchange}-${opp.sellExchange}`;
            if (!exchangePairs[pair]) {
                exchangePairs[pair] = { count: 0, totalProfit: 0 };
            }
            exchangePairs[pair].count++;
            exchangePairs[pair].totalProfit += opp.profit.percentage;
        });

        // Calcular promedios para cada par
        Object.keys(exchangePairs).forEach(pair => {
            exchangePairs[pair].avgProfit = exchangePairs[pair].totalProfit / exchangePairs[pair].count;
        });

        return {
            count: recent.length,
            avgProfit: recent.reduce((sum, opp) => sum + opp.profit.percentage, 0) / recent.length,
            maxProfit: Math.max(...recent.map(opp => opp.profit.percentage)),
            avgConfidence: recent.reduce((sum, opp) => sum + opp.confidence, 0) / recent.length,
            exchangePairs,
            timeWindow: timeWindow / 60000 // en minutos
        };
    }

    // Simulación de ejecución de arbitraje
    simulateArbitrageExecution(opportunity, amount = 1000) {
        const { buyPrice, sellPrice, profit } = opportunity;
        const quantity = amount / buyPrice;
        
        const execution = {
            buyAmount: amount,
            sellAmount: quantity * sellPrice,
            quantity: quantity,
            grossProfit: profit.gross * quantity,
            netProfit: profit.net * quantity,
            roi: profit.percentage,
            fees: profit.fees * quantity,
            estimatedTime: this.estimateExecutionTime(opportunity),
            risk: opportunity.risk
        };

        return execution;
    }

    estimateExecutionTime(opportunity) {
        // Tiempo estimado basado en liquidez y confiabilidad
        const baseTime = 30; // 30 segundos base
        const riskMultiplier = 1 + opportunity.risk;
        const confidenceMultiplier = 2 - opportunity.confidence;
        
        return Math.round(baseTime * riskMultiplier * confidenceMultiplier);
    }

    // Sistema de alertas
    addAlertCallback(callback) {
        this.alertCallbacks.push(callback);
    }

    triggerAlert(opportunity) {
        const alert = {
            type: 'ARBITRAGE_OPPORTUNITY',
            opportunity,
            timestamp: Date.now(),
            message: `Arbitraje detectado: ${opportunity.profit.percentage.toFixed(3)}% entre ${opportunity.buyExchange} y ${opportunity.sellExchange}`
        };

        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Error in arbitrage alert callback:', error);
            }
        });
    }

    // Monitoreo continuo
    startContinuousMonitoring(interval = 30000) { // 30 segundos
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(async () => {
            try {
                const opportunities = await this.scanArbitrageOpportunities();
                
                // Alertar sobre oportunidades significativas
                opportunities
                    .filter(opp => opp.profit.percentage > this.minProfitThreshold * 2)
                    .forEach(opp => this.triggerAlert(opp));
                    
            } catch (error) {
                console.error('Error in continuous monitoring:', error);
            }
        }, interval);

        console.log(`🔍 Monitoreo de arbitraje iniciado (cada ${interval/1000}s)`);
    }

    stopContinuousMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Monitoreo de arbitraje detenido');
        }
    }

    // Estadísticas de rendimiento
    getPerformanceStats() {
        return {
            totalScans: this.performance.getMetrics()?.scanArbitrage?.count || 0,
            avgScanTime: this.performance.getMetrics()?.scanArbitrage?.avgTime || 0,
            cacheHitRate: this.getCacheHitRate(),
            activeExchanges: this.exchanges.filter(ex => ex.active).length,
            totalOpportunities: this.opportunities.length
        };
    }

    getCacheHitRate() {
        // Implementación simplificada del cache hit rate
        return 0.75; // 75% estimado
    }

    // Cleanup
    cleanup() {
        this.stopContinuousMonitoring();
        this.cache.clear();
        this.opportunities = [];
        this.alertCallbacks = [];
    }
}

// Crear instancia global
window.arbitrageDetector = new ArbitrageDetector();

console.log('⚖️ Arbitrage Detector cargado');
