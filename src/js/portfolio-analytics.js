// portfolio-analytics.js - Análisis avanzado de portafolio y métricas de riesgo

class PortfolioAnalytics {
    constructor() {
        this.portfolios = new Map();
        this.benchmarks = new Map();
        this.performance = new PerformanceMonitor();
        this.riskFreeRate = 0.02; // 2% anual
        this.tradingDays = 252; // Días de trading anuales
        this.dataManager = null; // Data manager reference
        
        this.initializeBenchmarks();
    }

    // ============ CONFIGURACIÓN ============

    setDataManager(dataManager) {
        this.dataManager = dataManager;
        console.log('🔗 Data Manager conectado al Portfolio Analytics');
    }

    initializeBenchmarks() {
        // Benchmarks comunes para crypto
        this.benchmarks.set('BTC', { symbol: 'bitcoin', weight: 1.0 });
        this.benchmarks.set('CRYPTO_INDEX', { 
            bitcoin: 0.5, 
            ethereum: 0.3, 
            ripple: 0.1, 
            cardano: 0.05, 
            solana: 0.05 
        });
    }

    // ============ GESTIÓN DE PORTAFOLIOS ============

    createPortfolio(name, holdings = {}, initialValue = 10000) {
        const portfolio = {
            id: this.generateId(),
            name,
            holdings, // { symbol: { quantity, avgPrice, value } }
            initialValue,
            currentValue: initialValue,
            cash: initialValue,
            trades: [],
            rebalanceHistory: [],
            created: Date.now(),
            lastUpdated: Date.now()
        };

        this.portfolios.set(portfolio.id, portfolio);
        console.log(`📊 Portfolio "${name}" creado con ID: ${portfolio.id}`);
        return portfolio.id;
    }

    getPortfolio(portfolioId) {
        return this.portfolios.get(portfolioId);
    }

    updatePortfolioValue(portfolioId, currentPrices) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return null;

        let totalValue = portfolio.cash;

        Object.entries(portfolio.holdings).forEach(([symbol, holding]) => {
            const currentPrice = currentPrices[symbol] || holding.avgPrice;
            holding.currentPrice = currentPrice;
            holding.value = holding.quantity * currentPrice;
            holding.unrealizedPnL = (currentPrice - holding.avgPrice) * holding.quantity;
            holding.unrealizedPnLPercent = ((currentPrice / holding.avgPrice) - 1) * 100;
            
            totalValue += holding.value;
        });

        portfolio.currentValue = totalValue;
        portfolio.totalReturn = ((totalValue / portfolio.initialValue) - 1) * 100;
        portfolio.lastUpdated = Date.now();

        return portfolio;
    }

    addTrade(portfolioId, trade) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return false;

        const { symbol, quantity, price, type, fee = 0 } = trade;
        const totalCost = quantity * price + fee;

        if (!portfolio.holdings[symbol]) {
            portfolio.holdings[symbol] = {
                quantity: 0,
                avgPrice: 0,
                value: 0,
                totalCost: 0,
                realizedPnL: 0
            };
        }

        const holding = portfolio.holdings[symbol];

        if (type === 'buy') {
            if (portfolio.cash < totalCost) {
                throw new Error('Fondos insuficientes');
            }

            const newTotalCost = holding.totalCost + totalCost;
            const newQuantity = holding.quantity + quantity;
            
            holding.avgPrice = newTotalCost / newQuantity;
            holding.quantity = newQuantity;
            holding.totalCost = newTotalCost;
            
            portfolio.cash -= totalCost;

        } else if (type === 'sell') {
            if (holding.quantity < quantity) {
                throw new Error('Cantidad insuficiente para vender');
            }

            const proceeds = quantity * price - fee;
            const soldCost = holding.avgPrice * quantity;
            const realizedPnL = proceeds - soldCost;

            holding.quantity -= quantity;
            holding.totalCost -= soldCost;
            holding.realizedPnL += realizedPnL;
            
            portfolio.cash += proceeds;

            // Eliminar holding si cantidad es 0
            if (holding.quantity === 0) {
                delete portfolio.holdings[symbol];
            }
        }

        // Registrar trade
        portfolio.trades.push({
            id: this.generateId(),
            timestamp: Date.now(),
            ...trade,
            totalCost,
            portfolioValue: portfolio.currentValue
        });

        return true;
    }

    // ============ MÉTRICAS DE PERFORMANCE ============

    calculateSharpeRatio(portfolioId, timeframe = 252) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio || portfolio.trades.length < 2) return 0;

        const returns = this.calculateReturns(portfolioId, timeframe);
        if (returns.length === 0) return 0;

        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const volatility = this.calculateVolatility(returns);
        
        if (volatility === 0) return 0;

        const excessReturn = avgReturn - (this.riskFreeRate / this.tradingDays);
        return (excessReturn * Math.sqrt(this.tradingDays)) / volatility;
    }

    calculateSortinoRatio(portfolioId, timeframe = 252) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return 0;

        const returns = this.calculateReturns(portfolioId, timeframe);
        if (returns.length === 0) return 0;

        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const downside = returns.filter(r => r < 0);
        
        if (downside.length === 0) return Infinity;

        const downsideDeviation = Math.sqrt(
            downside.reduce((sum, r) => sum + r * r, 0) / downside.length
        );

        if (downsideDeviation === 0) return 0;

        const excessReturn = avgReturn - (this.riskFreeRate / this.tradingDays);
        return (excessReturn * Math.sqrt(this.tradingDays)) / downsideDeviation;
    }

    calculateMaxDrawdown(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio || portfolio.trades.length < 2) return 0;

        const values = this.getPortfolioValueHistory(portfolioId);
        if (values.length < 2) return 0;

        let peak = values[0];
        let maxDrawdown = 0;

        for (let i = 1; i < values.length; i++) {
            if (values[i] > peak) {
                peak = values[i];
            } else {
                const drawdown = (peak - values[i]) / peak;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        }

        return maxDrawdown * 100; // Retornar como porcentaje
    }

    calculateCalmarRatio(portfolioId) {
        const annualizedReturn = this.calculateAnnualizedReturn(portfolioId);
        const maxDrawdown = this.calculateMaxDrawdown(portfolioId);
        
        return maxDrawdown === 0 ? 0 : annualizedReturn / maxDrawdown;
    }

    calculateAnnualizedReturn(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return 0;

        const daysSinceInception = (Date.now() - portfolio.created) / (1000 * 60 * 60 * 24);
        if (daysSinceInception === 0) return 0;

        const totalReturn = (portfolio.currentValue / portfolio.initialValue) - 1;
        return (Math.pow(1 + totalReturn, 365.25 / daysSinceInception) - 1) * 100;
    }

    calculateBeta(portfolioId, benchmarkId = 'BTC', timeframe = 252) {
        const portfolioReturns = this.calculateReturns(portfolioId, timeframe);
        const benchmarkReturns = this.getBenchmarkReturns(benchmarkId, timeframe);

        if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 30) {
            return 1; // Beta neutro por defecto
        }

        const covariance = this.calculateCovariance(portfolioReturns, benchmarkReturns);
        const benchmarkVariance = this.calculateVariance(benchmarkReturns);

        return benchmarkVariance === 0 ? 1 : covariance / benchmarkVariance;
    }

    calculateAlpha(portfolioId, benchmarkId = 'BTC', timeframe = 252) {
        const portfolioReturn = this.calculateAnnualizedReturn(portfolioId);
        const benchmarkReturn = this.getBenchmarkAnnualizedReturn(benchmarkId);
        const beta = this.calculateBeta(portfolioId, benchmarkId, timeframe);

        return portfolioReturn - (this.riskFreeRate + beta * (benchmarkReturn - this.riskFreeRate));
    }

    calculateInformationRatio(portfolioId, benchmarkId = 'BTC', timeframe = 252) {
        const portfolioReturns = this.calculateReturns(portfolioId, timeframe);
        const benchmarkReturns = this.getBenchmarkReturns(benchmarkId, timeframe);

        if (portfolioReturns.length !== benchmarkReturns.length) return 0;

        const excessReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
        const avgExcessReturn = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
        const trackingError = this.calculateVolatility(excessReturns);

        return trackingError === 0 ? 0 : (avgExcessReturn * Math.sqrt(this.tradingDays)) / trackingError;
    }

    // ============ ANÁLISIS DE RIESGO ============

    calculateVaR(portfolioId, confidence = 0.95, timeHorizon = 1) {
        const returns = this.calculateReturns(portfolioId);
        if (returns.length < 30) return 0;

        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidence) * sortedReturns.length);
        const VaR = Math.abs(sortedReturns[index] || 0);

        const portfolio = this.portfolios.get(portfolioId);
        const portfolioValue = portfolio ? portfolio.currentValue : 0;

        return VaR * portfolioValue * Math.sqrt(timeHorizon);
    }

    calculateConditionalVaR(portfolioId, confidence = 0.95) {
        const returns = this.calculateReturns(portfolioId);
        if (returns.length < 30) return 0;

        const VaR = this.calculateVaR(portfolioId, confidence) / 
                   (this.portfolios.get(portfolioId)?.currentValue || 1);
        
        const tailLosses = returns.filter(r => Math.abs(r) >= Math.abs(VaR));
        
        if (tailLosses.length === 0) return VaR;

        const expectedShortfall = Math.abs(tailLosses.reduce((a, b) => a + b, 0) / tailLosses.length);
        const portfolioValue = this.portfolios.get(portfolioId)?.currentValue || 0;

        return expectedShortfall * portfolioValue;
    }

    calculateRiskMetrics(portfolioId) {
        const profile = this.performance.startProfile('calculate_risk_metrics');

        try {
            const portfolio = this.portfolios.get(portfolioId);
            if (!portfolio) return null;

            const metrics = {
                // Performance Metrics
                totalReturn: portfolio.totalReturn || 0,
                annualizedReturn: this.calculateAnnualizedReturn(portfolioId),
                sharpeRatio: this.calculateSharpeRatio(portfolioId),
                sortinoRatio: this.calculateSortinoRatio(portfolioId),
                calmarRatio: this.calculateCalmarRatio(portfolioId),

                // Risk Metrics
                volatility: this.calculateAnnualizedVolatility(portfolioId),
                maxDrawdown: this.calculateMaxDrawdown(portfolioId),
                var95: this.calculateVaR(portfolioId, 0.95),
                var99: this.calculateVaR(portfolioId, 0.99),
                cvar95: this.calculateConditionalVaR(portfolioId, 0.95),

                // Benchmark Comparison
                beta: this.calculateBeta(portfolioId),
                alpha: this.calculateAlpha(portfolioId),
                informationRatio: this.calculateInformationRatio(portfolioId),

                // Portfolio Characteristics
                numberOfHoldings: Object.keys(portfolio.holdings).length,
                concentration: this.calculateConcentration(portfolioId),
                turnover: this.calculateTurnover(portfolioId),

                // Latest Values
                currentValue: portfolio.currentValue,
                cash: portfolio.cash,
                lastUpdated: portfolio.lastUpdated
            };

            profile.end();
            return metrics;

        } catch (error) {
            profile.end();
            console.error('Error calculating risk metrics:', error);
            return null;
        }
    }

    // ============ ANÁLISIS DE ASIGNACIÓN ============

    calculateConcentration(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return 0;

        const totalValue = portfolio.currentValue;
        const weights = Object.values(portfolio.holdings).map(holding => 
            holding.value / totalValue
        );

        // Herfindahl-Hirschman Index
        return weights.reduce((sum, weight) => sum + weight * weight, 0);
    }

    getAssetAllocation(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return {};

        const totalValue = portfolio.currentValue;
        const allocation = {};

        Object.entries(portfolio.holdings).forEach(([symbol, holding]) => {
            allocation[symbol] = {
                value: holding.value,
                weight: (holding.value / totalValue) * 100,
                quantity: holding.quantity,
                avgPrice: holding.avgPrice,
                currentPrice: holding.currentPrice,
                unrealizedPnL: holding.unrealizedPnL,
                unrealizedPnLPercent: holding.unrealizedPnLPercent
            };
        });

        // Agregar cash
        allocation.CASH = {
            value: portfolio.cash,
            weight: (portfolio.cash / totalValue) * 100
        };

        return allocation;
    }

    suggestRebalancing(portfolioId, targetAllocation) {
        const currentAllocation = this.getAssetAllocation(portfolioId);
        const suggestions = [];

        Object.entries(targetAllocation).forEach(([symbol, targetWeight]) => {
            const currentWeight = currentAllocation[symbol]?.weight || 0;
            const difference = targetWeight - currentWeight;

            if (Math.abs(difference) > 5) { // Umbral del 5%
                const portfolio = this.portfolios.get(portfolioId);
                const targetValue = (targetWeight / 100) * portfolio.currentValue;
                const currentValue = currentAllocation[symbol]?.value || 0;
                const adjustment = targetValue - currentValue;

                suggestions.push({
                    symbol,
                    currentWeight: currentWeight.toFixed(2),
                    targetWeight: targetWeight.toFixed(2),
                    difference: difference.toFixed(2),
                    action: adjustment > 0 ? 'BUY' : 'SELL',
                    amount: Math.abs(adjustment),
                    priority: Math.abs(difference) > 10 ? 'HIGH' : 'MEDIUM'
                });
            }
        });

        return suggestions.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    }

    // ============ OPTIMIZACIÓN DE PORTAFOLIO ============

    optimizePortfolio(assets, expectedReturns, riskTolerance = 'moderate', constraints = {}) {
        const profile = this.performance.startProfile('optimize_portfolio');

        try {
            // Optimización basada en Markowitz moderna
            const numAssets = assets.length;
            if (numAssets === 0) return [];

            // Matriz de covarianza (simplificada)
            const correlationMatrix = this.estimateCorrelationMatrix(assets);
            const volatilities = expectedReturns.map(() => 0.3); // 30% volatilidad estimada

            // Pesos óptimos basados en perfil de riesgo
            const weights = this.calculateOptimalWeights(
                expectedReturns, 
                volatilities, 
                correlationMatrix, 
                riskTolerance, 
                constraints
            );

            const optimizedPortfolio = assets.map((asset, index) => ({
                asset,
                weight: weights[index],
                allocation: weights[index] * 100,
                expectedReturn: expectedReturns[index],
                estimatedVolatility: volatilities[index]
            }));

            profile.end();
            return optimizedPortfolio;

        } catch (error) {
            profile.end();
            console.error('Error optimizing portfolio:', error);
            return [];
        }
    }

    calculateOptimalWeights(returns, volatilities, correlations, riskTolerance, constraints) {
        const numAssets = returns.length;
        const weights = new Array(numAssets);

        // Perfiles de riesgo predefinidos
        const riskProfiles = {
            conservative: { maxWeight: 0.25, riskPenalty: 2.0 },
            moderate: { maxWeight: 0.35, riskPenalty: 1.0 },
            aggressive: { maxWeight: 0.5, riskPenalty: 0.5 }
        };

        const profile = riskProfiles[riskTolerance] || riskProfiles.moderate;

        // Optimización simplificada (equal risk contribution como baseline)
        const baseWeight = 1 / numAssets;
        
        for (let i = 0; i < numAssets; i++) {
            let weight = baseWeight;
            
            // Ajustar por retorno esperado
            const returnAdjustment = returns[i] / 0.1; // Normalizar por 10% retorno base
            weight *= returnAdjustment;
            
            // Ajustar por volatilidad (penalizar alta volatilidad)
            const volatilityAdjustment = 1 / (1 + volatilities[i] * profile.riskPenalty);
            weight *= volatilityAdjustment;
            
            // Aplicar restricciones
            weight = Math.min(weight, profile.maxWeight);
            weight = Math.max(weight, constraints.minWeight || 0.02);
            
            weights[i] = weight;
        }

        // Normalizar pesos para que sumen 1
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        return weights.map(w => w / totalWeight);
    }

    estimateCorrelationMatrix(assets) {
        const size = assets.length;
        const matrix = Array(size).fill().map(() => Array(size).fill(0));

        // Correlaciones estimadas para crypto (simplificadas)
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (i === j) {
                    matrix[i][j] = 1;
                } else {
                    // Correlación base entre criptomonedas (typically high)
                    matrix[i][j] = 0.7 + Math.random() * 0.2; // 0.7-0.9
                }
            }
        }

        return matrix;
    }

    // ============ UTILIDADES AUXILIARES ============

    calculateReturns(portfolioId, periods = null) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio || portfolio.trades.length < 2) return [];

        const values = this.getPortfolioValueHistory(portfolioId);
        if (values.length < 2) return [];

        const returns = [];
        for (let i = 1; i < values.length; i++) {
            if (values[i-1] > 0) {
                returns.push((values[i] / values[i-1]) - 1);
            }
        }

        return periods ? returns.slice(-periods) : returns;
    }

    getPortfolioValueHistory(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return [];

        // Reconstruir historial de valores del portfolio
        const values = [portfolio.initialValue];
        
        portfolio.trades.forEach(trade => {
            if (trade.portfolioValue) {
                values.push(trade.portfolioValue);
            }
        });

        return values;
    }

    calculateVolatility(returns) {
        if (returns.length < 2) return 0;

        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
        
        return Math.sqrt(variance);
    }

    calculateAnnualizedVolatility(portfolioId) {
        const returns = this.calculateReturns(portfolioId);
        const dailyVol = this.calculateVolatility(returns);
        return dailyVol * Math.sqrt(this.tradingDays) * 100; // Anualizada en porcentaje
    }

    calculateVariance(returns) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    }

    calculateCovariance(returns1, returns2) {
        if (returns1.length !== returns2.length) return 0;

        const mean1 = returns1.reduce((a, b) => a + b, 0) / returns1.length;
        const mean2 = returns2.reduce((a, b) => a + b, 0) / returns2.length;

        let covariance = 0;
        for (let i = 0; i < returns1.length; i++) {
            covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
        }

        return covariance / returns1.length;
    }

    calculateTurnover(portfolioId, timeframe = 365) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return 0;

        const cutoff = Date.now() - (timeframe * 24 * 60 * 60 * 1000);
        const recentTrades = portfolio.trades.filter(trade => trade.timestamp > cutoff);

        const totalTradeValue = recentTrades.reduce((sum, trade) => 
            sum + (trade.quantity * trade.price), 0
        );

        return portfolio.currentValue > 0 ? totalTradeValue / portfolio.currentValue : 0;
    }

    getBenchmarkReturns(benchmarkId, periods) {
        // Implementación simplificada - en producción obtener datos reales
        return new Array(periods).fill(0).map(() => (Math.random() - 0.5) * 0.04);
    }

    getBenchmarkAnnualizedReturn(benchmarkId) {
        // Retorno anualizado estimado del benchmark
        const benchmarkReturns = {
            'BTC': 45,
            'CRYPTO_INDEX': 35
        };
        
        return benchmarkReturns[benchmarkId] || 20;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ============ MÉTRICA DE RENDIMIENTO BÁSICA ============

    calculatePerformanceMetrics(portfolioData) {
        try {
            // Si es un ID de portfolio
            if (typeof portfolioData === 'string') {
                const portfolio = this.portfolios.get(portfolioData);
                if (!portfolio) {
                    throw new Error(`Portfolio ${portfolioData} no encontrado`);
                }
                portfolioData = portfolio;
            }

            // Calcular métricas básicas
            const totalReturn = portfolioData.currentValue / portfolioData.initialValue - 1;
            const annualizedReturn = Math.pow(1 + totalReturn, 365 / this.getDaysActive(portfolioData)) - 1;
            
            // Volatilidad estimada (simplificada)
            const volatility = Math.abs(totalReturn) * Math.sqrt(252) * 0.3;
            
            // Sharpe ratio simplificado
            const excessReturn = annualizedReturn - this.riskFreeRate;
            const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

            return {
                returns: {
                    total: totalReturn * 100,
                    annualized: annualizedReturn * 100,
                    daily: totalReturn / this.getDaysActive(portfolioData) * 100
                },
                risk: {
                    volatility: volatility * 100,
                    sharpe: sharpeRatio,
                    maxDrawdown: Math.abs(totalReturn) * 0.5 * 100 // Estimado
                },
                allocation: this.getAssetAllocation(portfolioData.id || 'default'),
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.warn('⚠️ Error calculando métricas de rendimiento:', error.message);
            return {
                returns: { total: 0, annualized: 0, daily: 0 },
                risk: { volatility: 0, sharpe: 0, maxDrawdown: 0 },
                allocation: {},
                lastUpdated: Date.now()
            };
        }
    }

    getDaysActive(portfolio) {
        const now = Date.now();
        const created = portfolio.created || now;
        return Math.max(1, Math.floor((now - created) / (24 * 60 * 60 * 1000)));
    }

    // ============ REPORTES ============

    generatePerformanceReport(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return null;

        const metrics = this.calculateRiskMetrics(portfolioId);
        const allocation = this.getAssetAllocation(portfolioId);

        return {
            portfolio: {
                id: portfolio.id,
                name: portfolio.name,
                created: new Date(portfolio.created).toISOString(),
                lastUpdated: new Date(portfolio.lastUpdated).toISOString()
            },
            performance: metrics,
            allocation,
            trades: portfolio.trades.slice(-10), // Últimos 10 trades
            rebalanceHistory: portfolio.rebalanceHistory,
            generated: Date.now()
        };
    }

    // ============ CLEANUP ============

    cleanup() {
        this.portfolios.clear();
        this.benchmarks.clear();
    }
}

// Crear instancia global
window.portfolioAnalytics = new PortfolioAnalytics();

console.log('📊 Portfolio Analytics cargado');
