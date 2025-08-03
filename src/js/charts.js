// charts.js - Manejo de gráficos y visualizaciones

class ChartManager {
    constructor() {
        this.charts = {
            price: null,
            rsi: null,
            macd: null,
            bb: null,
            stoch: null
        };
        
        this.chartColors = {
            primary: '#00d4ff',
            green: '#00ff88',
            red: '#ff3366',
            yellow: '#ffcc00',
            orange: '#ff8c00',
            purple: '#8a2be2',
            grid: 'rgba(255, 255, 255, 0.05)',
            text: '#94a3b8'
        };
        
        this.defaultOptions = this.getDefaultChartOptions();
    }

    // Actualizar estado del gráfico
    updateChartStatus(status) {
        const statusElement = document.querySelector('.chart-status');
        if (!statusElement) return;
        
        // Remover clases previas
        statusElement.classList.remove('loading', 'error', 'success');
        
        // Agregar nueva clase de estado
        statusElement.classList.add(status);
        
        // Actualizar texto del estado
        const statusText = {
            'loading': '🔄 Cargando datos...',
            'error': '❌ Error al cargar datos',
            'success': '✅ Datos actualizados'
        };
        
        if (statusText[status]) {
            statusElement.textContent = statusText[status];
        }
        
        // Auto-ocultar después de 3 segundos para estados no-loading
        if (status !== 'loading') {
            setTimeout(() => {
                statusElement.classList.remove(status);
                statusElement.textContent = '';
            }, 3000);
        }
    }

    // Opciones por defecto para todos los gráficos
    getDefaultChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: this.chartColors.text,
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: this.chartColors.primary,
                    bodyColor: '#e0e6ed',
                    borderColor: this.chartColors.primary,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    type: 'time',
                    display: true,
                    grid: {
                        color: this.chartColors.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: this.chartColors.text,
                        maxTicksLimit: 6,
                        maxRotation: 0,
                        minRotation: 0,
                        font: {
                            size: 11,
                            weight: 'normal'
                        },
                        autoSkip: true,
                        autoSkipPadding: 10,
                        labelOffset: 0,
                        padding: 10
                    },
                    time: {
                        unit: 'hour',
                        stepSize: 4,
                        displayFormats: {
                            minute: 'HH:mm',
                            hour: 'dd/MM HH:mm',
                            day: 'dd/MM',
                            week: 'dd/MM',
                            month: 'MMM yyyy',
                            quarter: 'MMM yyyy',
                            year: 'yyyy'
                        },
                        tooltipFormat: 'dd/MM/yyyy HH:mm'
                    }
                },
                y: {
                    display: true,
                    position: 'right',
                    grid: {
                        color: this.chartColors.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: this.chartColors.text,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        };
    }

    // Gráfico principal de precios
    updatePriceChart(data, timeframe = 1) {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;

        // Actualizar estado del gráfico
        this.updateChartStatus('loading');

        // Validar que existan datos válidos
        if (!data || !data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
            console.warn('⚠️ Datos de precios inválidos para el gráfico');
            this.updateChartStatus('error');
            return;
        }

        // Preparar datos para Chart.js con timestamps validados
        const chartData = data.prices.map((price, index) => {
            // Asegurar que el timestamp sea válido
            let timestamp = price[0];
            if (!timestamp || isNaN(timestamp)) {
                // Generar timestamp basado en el índice si no hay uno válido
                const now = Date.now();
                timestamp = now - (data.prices.length - index - 1) * 60 * 60 * 1000; // Cada hora
            }
            
            // Convertir a Date object para Chart.js
            return {
                x: new Date(timestamp),
                y: parseFloat(price[1]) || 0
            };
        }).filter(point => !isNaN(point.y) && point.x instanceof Date && !isNaN(point.x.getTime()));
        
        // Calcular medias móviles
        const prices = data.prices.map(price => price[1]);
        const sma20 = window.technicalIndicators.calculateSMA(prices, 20);
        const sma50 = window.technicalIndicators.calculateSMA(prices, 50);
        
        // Preparar datos de medias móviles con timestamps validados
        const sma20Data = data.prices.map((price, index) => {
            const smaValue = sma20[index];
            if (smaValue === null || smaValue === undefined || isNaN(smaValue)) return null;
            
            let timestamp = price[0];
            if (!timestamp || isNaN(timestamp)) {
                const now = Date.now();
                timestamp = now - (data.prices.length - index - 1) * 60 * 60 * 1000;
            }
            
            return {
                x: new Date(timestamp),
                y: parseFloat(smaValue)
            };
        }).filter(point => point !== null && !isNaN(point.y) && point.x instanceof Date && !isNaN(point.x.getTime()));
        
        const sma50Data = data.prices.map((price, index) => {
            const smaValue = sma50[index];
            if (smaValue === null || smaValue === undefined || isNaN(smaValue)) return null;
            
            let timestamp = price[0];
            if (!timestamp || isNaN(timestamp)) {
                const now = Date.now();
                timestamp = now - (data.prices.length - index - 1) * 60 * 60 * 1000;
            }
            
            return {
                x: new Date(timestamp),
                y: parseFloat(smaValue)
            };
        }).filter(point => point !== null && !isNaN(point.y) && point.x instanceof Date && !isNaN(point.x.getTime()));
        
        // Destruir gráfico anterior
        if (this.charts.price) {
            this.charts.price.destroy();
        }
        
        this.charts.price = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Precio XRP',
                        data: chartData,
                        borderColor: this.chartColors.primary,
                        backgroundColor: 'rgba(0, 212, 255, 0.05)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointBackgroundColor: this.chartColors.primary,
                        pointBorderColor: this.chartColors.primary,
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: this.chartColors.primary,
                        fill: true
                    },
                    {
                        label: 'SMA 20',
                        data: sma20Data,
                        borderColor: this.chartColors.yellow,
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        tension: 0.1,
                        pointRadius: 0,
                        borderDash: [5, 5]
                    },
                    {
                        label: 'SMA 50',
                        data: sma50Data,
                        borderColor: this.chartColors.orange,
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        tension: 0.1,
                        pointRadius: 0,
                        borderDash: [3, 3]
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    tooltip: {
                        ...this.defaultOptions.plugins.tooltip,
                        callbacks: {
                            title: function(context) {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            },
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataset.label === 'Precio XRP') {
                                    label += '$' + context.parsed.y.toFixed(4);
                                } else {
                                    label += context.parsed.y ? '$' + context.parsed.y.toFixed(4) : 'N/A';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        ticks: {
                            ...this.defaultOptions.scales.y.ticks,
                            callback: function(value) {
                                return '$' + value.toFixed(4);
                            }
                        }
                    }
                }
            }
        });
        
        // Actualizar estado a éxito
        this.updateChartStatus('success');
    }

    // Mini gráfico RSI
    updateRSIChart(rsiValue) {
        const ctx = document.getElementById('rsi-chart');
        if (!ctx) return;

        if (this.charts.rsi) {
            this.charts.rsi.destroy();
        }

        const data = this.generateMiniChartData(20, 0, 100, rsiValue);
        
        this.charts.rsi = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [{
                    data: data,
                    borderColor: rsiValue > 70 ? this.chartColors.red : 
                                rsiValue < 30 ? this.chartColors.green : this.chartColors.primary,
                    backgroundColor: (rsiValue > 70 ? this.chartColors.red : 
                                    rsiValue < 30 ? this.chartColors.green : this.chartColors.primary) + '20',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true
                }]
            },
            options: this.getMiniChartOptions()
        });
    }

    // Mini gráfico MACD
    updateMACDChart(macdData) {
        const ctx = document.getElementById('macd-chart');
        if (!ctx) return;

        if (this.charts.macd) {
            this.charts.macd.destroy();
        }

        const data = this.generateMiniChartData(20, -0.005, 0.005, macdData.histogram);
        
        this.charts.macd = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array(20).fill(''),
                datasets: [{
                    data: data,
                    backgroundColor: data.map(value => 
                        value >= 0 ? this.chartColors.green + '80' : this.chartColors.red + '80'
                    ),
                    borderColor: data.map(value => 
                        value >= 0 ? this.chartColors.green : this.chartColors.red
                    ),
                    borderWidth: 1
                }]
            },
            options: this.getMiniChartOptions()
        });
    }

    // Mini gráfico Bollinger Bands
    updateBBChart(bbData, currentPrice) {
        const ctx = document.getElementById('bb-chart');
        if (!ctx) return;

        if (this.charts.bb) {
            this.charts.bb.destroy();
        }

        const upperData = this.generateMiniChartData(20, bbData.lower, bbData.upper, bbData.upper);
        const middleData = this.generateMiniChartData(20, bbData.lower, bbData.upper, bbData.middle);
        const lowerData = this.generateMiniChartData(20, bbData.lower, bbData.upper, bbData.lower);
        const priceData = this.generateMiniChartData(20, bbData.lower, bbData.upper, currentPrice);
        
        this.charts.bb = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [
                    {
                        data: upperData,
                        borderColor: this.chartColors.red + '60',
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        pointRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        data: middleData,
                        borderColor: this.chartColors.yellow + '80',
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        pointRadius: 0
                    },
                    {
                        data: lowerData,
                        borderColor: this.chartColors.green + '60',
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        pointRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        data: priceData,
                        borderColor: this.chartColors.primary,
                        backgroundColor: this.chartColors.primary + '20',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: this.getMiniChartOptions()
        });
    }

    // Mini gráfico Stochastic
    updateStochasticChart(stochData) {
        const ctx = document.getElementById('stoch-chart');
        if (!ctx) return;

        if (this.charts.stoch) {
            this.charts.stoch.destroy();
        }

        const kData = this.generateMiniChartData(20, 0, 100, stochData.k);
        const dData = this.generateMiniChartData(20, 0, 100, stochData.d);
        
        this.charts.stoch = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [
                    {
                        data: kData,
                        borderColor: this.chartColors.primary,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        data: dData,
                        borderColor: this.chartColors.yellow,
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        tension: 0.4,
                        pointRadius: 0,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: this.getMiniChartOptions()
        });
    }

    // Generar labels para el eje X según el timeframe
    generateLabels(prices, timeframe) {
        if (!prices || !Array.isArray(prices) || prices.length === 0) {
            console.warn('⚠️ Precios inválidos para generar labels');
            return [];
        }

        return prices.map(price => {
            const date = new Date(price[0]);
            if (timeframe === 1) {
                return date.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else if (timeframe <= 30) {
                return date.toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'short' 
                });
            } else {
                return date.toLocaleDateString('es-ES', { 
                    month: 'short', 
                    year: '2-digit' 
                });
            }
        });
    }

    // Generar datos para mini gráficos
    generateMiniChartData(points, min, max, currentValue) {
        const data = [];
        const range = max - min;
        
        // Generar puntos de tendencia hacia el valor actual
        const targetRange = range * 0.3;
        const baseValue = currentValue;
        
        for (let i = 0; i < points - 1; i++) {
            const progress = i / (points - 1);
            const trend = baseValue + (Math.sin(progress * Math.PI * 2) * targetRange * 0.5);
            const noise = (Math.random() - 0.5) * targetRange * 0.3;
            data.push(Math.max(min, Math.min(max, trend + noise)));
        }
        
        data.push(currentValue);
        return data;
    }

    // Opciones para mini gráficos
    getMiniChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                point: { radius: 0 }
            },
            animation: {
                duration: 300
            }
        };
    }

    // Actualizar todos los mini gráficos de indicadores
    updateIndicatorCharts(analysis) {
        try {
            this.updateRSIChart(analysis.rsi);
            this.updateMACDChart(analysis.macd);
            this.updateStochasticChart(analysis.stochastic);
            
            // Para Bollinger Bands necesitamos el precio actual
            if (window.app && window.app.currentPrice) {
                this.updateBBChart(analysis.bollingerBands, window.app.currentPrice);
            }
        } catch (error) {
            console.error('Error actualizando gráficos de indicadores:', error);
        }
    }

    // Limpiar todos los gráficos
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        
        this.charts = {
            price: null,
            rsi: null,
            macd: null,
            bb: null,
            stoch: null
        };
    }

    // Redimensionar gráficos
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }

    // Crear gráfico de velas (candlestick) - para futuras implementaciones
    createCandlestickChart(ohlcData) {
        console.log('Gráfico de velas no implementado aún, usando líneas');
        // Aquí se podría implementar con una librería como Chart.js con plugin de candlestick
        // o cambiar a una librería específica como TradingView Lightweight Charts
    }

    // Agregar líneas de soporte/resistencia al gráfico principal
    addSupportResistanceLines(supports, resistances) {
        if (!this.charts.price) return;

        // Esto requeriría modificar el dataset del gráfico principal
        // Para simplicidad, se implementará en futuras versiones
        console.log('Líneas de soporte/resistencia:', { supports, resistances });
    }

    // Configurar tema oscuro/claro
    setTheme(isDark = true) {
        const textColor = isDark ? '#94a3b8' : '#374151';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)';
        
        this.chartColors.text = textColor;
        this.chartColors.grid = gridColor;
        
        // Actualizar opciones por defecto
        this.defaultOptions = this.getDefaultChartOptions();
        
        // Re-renderizar gráficos si existen
        this.resizeCharts();
    }
}

// Crear instancia global
window.chartManager = new ChartManager();
