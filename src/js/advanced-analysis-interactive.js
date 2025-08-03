// advanced-analysis-interactive.js - Funcionalidades interactivas para el análisis avanzado

// Extensión de la clase XRPTradingApp para funcionalidades avanzadas
if (typeof window.XRPTradingApp !== 'undefined') {
    
    // Agregar métodos de interactividad al prototipo
    Object.assign(XRPTradingApp.prototype, {
        
        // Configuración de la interfaz avanzada
        advancedUIConfig: {
            autoRefresh: true,
            refreshInterval: 30000,
            notifications: true,
            sounds: true,
            animationsEnabled: true
        },

        // Inicializar interfaz avanzada
        initializeAdvancedUI() {
            this.setupAdvancedEventListeners();
            this.setupAdvancedAnimations();
            this.initializeAdvancedTooltips();
            this.setupAdvancedSettings();
            console.log('🎨 Interfaz avanzada inicializada');
        },

        // Configurar event listeners para la interfaz avanzada
        setupAdvancedEventListeners() {
            // Configurar hover effects para tarjetas
            document.querySelectorAll('.advanced-card').forEach(card => {
                card.addEventListener('mouseenter', () => this.onCardHover(card, true));
                card.addEventListener('mouseleave', () => this.onCardHover(card, false));
                card.addEventListener('click', () => this.onCardClick(card));
            });

            // Configurar controles del panel
            document.addEventListener('DOMContentLoaded', () => {
                this.setupControlButtons();
                this.setupSettingsPanel();
            });
        },

        // Efectos hover para tarjetas
        onCardHover(card, isHovering) {
            const category = card.dataset.category;
            if (isHovering) {
                this.highlightRelatedMetrics(category);
                this.showCardPreview(card);
            } else {
                this.clearHighlights();
                this.hideCardPreview();
            }
        },

        // Click en tarjeta para expandir
        onCardClick(card) {
            const isExpanded = card.classList.contains('expanded');
            
            // Cerrar todas las tarjetas expandidas
            document.querySelectorAll('.advanced-card.expanded').forEach(c => {
                c.classList.remove('expanded');
            });

            if (!isExpanded) {
                card.classList.add('expanded');
                this.showExpandedCardContent(card);
                this.playInteractionSound('expand');
            } else {
                this.playInteractionSound('collapse');
            }
        },

        // Mostrar contenido expandido de tarjeta
        showExpandedCardContent(card) {
            const category = card.dataset.category;
            const expandedContent = this.generateExpandedContent(category);
            
            let expandedDiv = card.querySelector('.expanded-content');
            if (!expandedDiv) {
                expandedDiv = document.createElement('div');
                expandedDiv.className = 'expanded-content';
                card.appendChild(expandedDiv);
            }
            
            expandedDiv.innerHTML = expandedContent;
            expandedDiv.style.animation = 'slideDown 0.3s ease-out';
        },

        // Generar contenido expandido según categoría
        generateExpandedContent(category) {
            const contents = {
                performance: `
                    <div class="expanded-section">
                        <h4>📊 Métricas Detalladas</h4>
                        <div class="mini-chart-container">
                            <canvas id="perf-chart-${Date.now()}" width="300" height="150"></canvas>
                        </div>
                        <div class="metric-details">
                            <div class="metric-trend">
                                <span>Tendencia de latencia:</span>
                                <span class="trend-indicator positive">↗️ Mejorando</span>
                            </div>
                            <div class="metric-benchmark">
                                <span>Benchmark:</span>
                                <span>Top 10% de aplicaciones</span>
                            </div>
                        </div>
                    </div>
                `,
                volatility: `
                    <div class="expanded-section">
                        <h4>📈 Análisis de Volatilidad Extendido</h4>
                        <div class="volatility-gauge">
                            <div class="gauge-container">
                                <div class="gauge-meter" id="vol-gauge"></div>
                                <div class="gauge-label">Nivel de Volatilidad</div>
                            </div>
                        </div>
                        <div class="volatility-breakdown">
                            <div class="vol-component">
                                <span>Volatilidad Intraday:</span>
                                <span class="vol-value">2.3%</span>
                            </div>
                            <div class="vol-component">
                                <span>Volatilidad Semanal:</span>
                                <span class="vol-value">8.7%</span>
                            </div>
                            <div class="vol-component">
                                <span>Volatilidad Mensual:</span>
                                <span class="vol-value">15.2%</span>
                            </div>
                        </div>
                    </div>
                `,
                whale: `
                    <div class="expanded-section">
                        <h4>🐋 Actividad Whale Detallada</h4>
                        <div class="whale-timeline">
                            <div class="timeline-item">
                                <div class="timeline-time">14:32</div>
                                <div class="timeline-event">
                                    <span class="whale-amount">+$2.3M</span>
                                    <span class="whale-action">Compra en Binance</span>
                                </div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-time">13:15</div>
                                <div class="timeline-event">
                                    <span class="whale-amount">-$1.8M</span>
                                    <span class="whale-action">Venta en Coinbase</span>
                                </div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-time">11:45</div>
                                <div class="timeline-event">
                                    <span class="whale-amount">+$3.1M</span>
                                    <span class="whale-action">Acumulación</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                arbitrage: `
                    <div class="expanded-section">
                        <h4>⚡ Oportunidades de Arbitraje</h4>
                        <div class="arbitrage-table">
                            <div class="arb-header">
                                <span>Exchange A</span>
                                <span>Exchange B</span>
                                <span>Spread</span>
                                <span>Profit</span>
                            </div>
                            <div class="arb-row">
                                <span>Binance</span>
                                <span>Coinbase</span>
                                <span class="spread">0.23%</span>
                                <span class="profit positive">$145</span>
                            </div>
                            <div class="arb-row">
                                <span>Kraken</span>
                                <span>Bitfinex</span>
                                <span class="spread">0.18%</span>
                                <span class="profit positive">$112</span>
                            </div>
                        </div>
                    </div>
                `,
                portfolio: `
                    <div class="expanded-section">
                        <h4>💼 Análisis de Portfolio Detallado</h4>
                        <div class="portfolio-allocation">
                            <div class="allocation-chart">
                                <div class="allocation-item">
                                    <div class="allocation-color" style="background: var(--accent-blue);"></div>
                                    <span>XRP (65%)</span>
                                </div>
                                <div class="allocation-item">
                                    <div class="allocation-color" style="background: var(--accent-green);"></div>
                                    <span>BTC (25%)</span>
                                </div>
                                <div class="allocation-item">
                                    <div class="allocation-color" style="background: var(--accent-orange);"></div>
                                    <span>ETH (10%)</span>
                                </div>
                            </div>
                        </div>
                        <div class="portfolio-metrics">
                            <div class="metric-row">
                                <span>Alpha:</span>
                                <span class="positive">+2.3%</span>
                            </div>
                            <div class="metric-row">
                                <span>Beta:</span>
                                <span>0.85</span>
                            </div>
                            <div class="metric-row">
                                <span>Max Drawdown:</span>
                                <span class="negative">-8.7%</span>
                            </div>
                        </div>
                    </div>
                `,
                technical: `
                    <div class="expanded-section">
                        <h4>📈 Señales Técnicas</h4>
                        <div class="signals-grid">
                            <div class="signal-item bullish">
                                <span class="signal-icon">📈</span>
                                <span class="signal-name">RSI Divergencia</span>
                                <span class="signal-strength">Fuerte</span>
                            </div>
                            <div class="signal-item neutral">
                                <span class="signal-icon">➡️</span>
                                <span class="signal-name">MACD</span>
                                <span class="signal-strength">Neutral</span>
                            </div>
                            <div class="signal-item bearish">
                                <span class="signal-icon">📉</span>
                                <span class="signal-name">Bollinger Bands</span>
                                <span class="signal-strength">Débil</span>
                            </div>
                        </div>
                    </div>
                `
            };
            
            return contents[category] || '<div>Contenido no disponible</div>';
        },

        // Configurar botones de control
        setupControlButtons() {
            // Auto-refresh toggle
            const autoRefreshBtn = document.getElementById('toggle-auto-refresh');
            if (autoRefreshBtn) {
                autoRefreshBtn.addEventListener('click', () => {
                    this.advancedUIConfig.autoRefresh = !this.advancedUIConfig.autoRefresh;
                    autoRefreshBtn.classList.toggle('active', this.advancedUIConfig.autoRefresh);
                    autoRefreshBtn.innerHTML = this.advancedUIConfig.autoRefresh ? 
                        '⏱️ Auto-actualización ON' : '⏱️ Auto-actualización OFF';
                    this.playInteractionSound('toggle');
                });
            }
        },

        // Configurar panel de configuraciones
        setupSettingsPanel() {
            const settingsBtn = document.getElementById('toggle-settings');
            const settingsPanel = document.getElementById('advanced-settings');
            
            if (settingsBtn && settingsPanel) {
                settingsBtn.addEventListener('click', () => {
                    const isVisible = settingsPanel.classList.contains('show');
                    settingsPanel.classList.toggle('show', !isVisible);
                    settingsBtn.classList.toggle('active', !isVisible);
                    this.playInteractionSound('panel');
                });
            }

            // Configurar controles del panel
            this.setupFrequencySlider();
            this.setupNotificationToggles();
        },

        // Configurar slider de frecuencia
        setupFrequencySlider() {
            const slider = document.getElementById('update-frequency');
            const valueDisplay = document.getElementById('freq-value');
            
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    valueDisplay.textContent = `${value}s`;
                    this.advancedUIConfig.refreshInterval = value * 1000;
                    this.updateAutoRefreshInterval();
                });
            }
        },

        // Configurar toggles de notificaciones
        setupNotificationToggles() {
            const notifToggle = document.getElementById('enable-notifications');
            const soundToggle = document.getElementById('enable-sound');
            
            if (notifToggle) {
                notifToggle.addEventListener('change', (e) => {
                    this.advancedUIConfig.notifications = e.target.checked;
                    this.playInteractionSound('toggle');
                });
            }

            if (soundToggle) {
                soundToggle.addEventListener('change', (e) => {
                    this.advancedUIConfig.sounds = e.target.checked;
                });
            }
        },

        // Funciones de interacción
        refreshAdvancedAnalysis() {
            this.showAdvancedLoadingState();
            
            // Simular actualización
            setTimeout(() => {
                if (this.performAdvancedAnalysis) {
                    this.performAdvancedAnalysis();
                }
                this.hideAdvancedLoadingState();
                this.showRefreshNotification();
                this.playInteractionSound('refresh');
            }, 1500);
        },

        exportAnalysisData() {
            const data = this.gatherAnalysisData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `xrp-analysis-${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.playInteractionSound('export');
            this.showExportNotification();
        },

        toggleAdvancedSettings() {
            const panel = document.getElementById('advanced-settings');
            const isVisible = panel.classList.contains('show');
            
            panel.classList.toggle('show', !isVisible);
            this.playInteractionSound('panel');
        },

        // Estados de carga y notificaciones
        showAdvancedLoadingState() {
            const indicator = document.getElementById('advanced-indicator');
            const statusText = document.getElementById('advanced-status-text');
            
            if (indicator) indicator.textContent = '🔄';
            if (statusText) statusText.textContent = 'Actualizando...';
            
            document.querySelectorAll('.metric-value').forEach(el => {
                el.style.opacity = '0.5';
            });
        },

        hideAdvancedLoadingState() {
            const indicator = document.getElementById('advanced-indicator');
            const statusText = document.getElementById('advanced-status-text');
            
            if (indicator) indicator.textContent = '✅';
            if (statusText) statusText.textContent = 'Análisis completado';
            
            document.querySelectorAll('.metric-value').forEach(el => {
                el.style.opacity = '1';
            });
        },

        showRefreshNotification() {
            this.showAdvancedNotification('🔄 Análisis actualizado', 'Los datos han sido actualizados correctamente', 'success');
        },

        showExportNotification() {
            this.showAdvancedNotification('📊 Datos exportados', 'El archivo de análisis ha sido descargado', 'success');
        },

        showAdvancedNotification(title, message, type = 'info') {
            if (!this.advancedUIConfig.notifications) return;

            const notification = document.createElement('div');
            notification.className = `advanced-notification ${type}`;
            notification.innerHTML = `
                <div class="notification-header">
                    <span class="notification-title">${title}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="notification-message">${message}</div>
            `;

            document.body.appendChild(notification);

            // Auto-remove después de 5 segundos
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);

            // Animación de entrada
            notification.style.animation = 'slideInRight 0.3s ease-out';
        },

        // Efectos de sonido
        playInteractionSound(type) {
            if (!this.advancedUIConfig.sounds) return;

            const frequencies = {
                hover: 800,
                click: 600,
                toggle: 900,
                expand: 400,
                collapse: 300,
                refresh: 1000,
                export: 1200,
                panel: 700
            };

            this.playBeep(frequencies[type] || 600, 100);
        },

        playBeep(frequency, duration) {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration / 1000);

                oscillator.start();
                oscillator.stop(audioCtx.currentTime + duration / 1000);
            } catch (error) {
                console.warn('Audio no disponible:', error);
            }
        },

        // Utilidades
        gatherAnalysisData() {
            return {
                timestamp: new Date().toISOString(),
                performance: this.getPerformanceData(),
                volatility: this.getVolatilityData(),
                whale: this.getWhaleData(),
                arbitrage: this.getArbitrageData(),
                portfolio: this.getPortfolioData(),
                technical: this.getTechnicalData()
            };
        },

        highlightRelatedMetrics(category) {
            // Implementar lógica de highlighting
        },

        clearHighlights() {
            // Limpiar highlights
        },

        showCardPreview(card) {
            // Mostrar preview de tarjeta
        },

        hideCardPreview() {
            // Ocultar preview
        },

        setupAdvancedAnimations() {
            // Configurar animaciones adicionales
            this.startMetricAnimations();
        },

        startMetricAnimations() {
            // Animar indicadores de estado
            setInterval(() => {
                document.querySelectorAll('.metric-status-indicator').forEach(indicator => {
                    if (Math.random() > 0.8) {
                        indicator.style.animation = 'pulse 0.5s ease-in-out';
                        setTimeout(() => {
                            indicator.style.animation = '';
                        }, 500);
                    }
                });
            }, 3000);
        },

        initializeAdvancedTooltips() {
            // Los tooltips ya están en el CSS, aquí podemos agregar funcionalidad adicional
            document.querySelectorAll('.metric-tooltip').forEach(tooltip => {
                const parent = tooltip.parentElement;
                parent.addEventListener('mouseenter', () => {
                    tooltip.style.visibility = 'visible';
                    tooltip.style.opacity = '1';
                });
                parent.addEventListener('mouseleave', () => {
                    tooltip.style.visibility = 'hidden';
                    tooltip.style.opacity = '0';
                });
            });
        }
    });

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        if (window.app && typeof window.app.initializeAdvancedUI === 'function') {
            setTimeout(() => {
                window.app.initializeAdvancedUI();
            }, 1000);
        }
    });
}

console.log('🎨 Módulo de interfaz avanzada cargado');
