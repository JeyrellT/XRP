// advanced-analysis-dashboard.js - Dashboard de control para análisis avanzado

class AdvancedAnalysisDashboard {
    constructor() {
        this.isVisible = false;
        this.refreshInterval = null;
        this.createDashboard();
    }

    createDashboard() {
        // Crear HTML del dashboard
        const dashboardHTML = `
            <div id="advanced-dashboard" class="advanced-dashboard" style="display: none;">
                <div class="dashboard-header">
                    <h3>🔬 Panel de Control - Análisis Avanzado</h3>
                    <button id="close-dashboard" class="close-btn">×</button>
                </div>
                
                <div class="dashboard-content">
                    <div class="dashboard-section">
                        <h4>📊 Estado de Módulos</h4>
                        <div id="modules-status-grid" class="status-grid">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h4>🔄 Controles</h4>
                        <div class="controls-grid">
                            <button id="force-update" class="control-btn primary">
                                🔄 Forzar Actualización
                            </button>
                            <button id="restart-modules" class="control-btn warning">
                                🔧 Reiniciar Módulos
                            </button>
                            <button id="run-diagnosis" class="control-btn info">
                                🔍 Ejecutar Diagnóstico
                            </button>
                            <button id="clear-data" class="control-btn danger">
                                🗑️ Limpiar Datos
                            </button>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h4>📈 Último Análisis</h4>
                        <div id="last-analysis-info" class="analysis-info">
                            <p>No hay datos disponibles</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h4>🚨 Alertas y Problemas</h4>
                        <div id="issues-list" class="issues-list">
                            <p>Todo funcionando correctamente</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h4>⚙️ Configuración</h4>
                        <div class="config-options">
                            <label>
                                <input type="checkbox" id="auto-refresh" checked>
                                Auto-actualización (30s)
                            </label>
                            <label>
                                <input type="checkbox" id="detailed-logs" checked>
                                Logs detallados
                            </label>
                            <label>
                                <input type="checkbox" id="mock-data">
                                Usar datos de prueba
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar CSS
        const styles = `
            <style>
                .advanced-dashboard {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90%;
                    max-width: 800px;
                    max-height: 80vh;
                    background: var(--bg-primary, #1a1a1a);
                    border: 2px solid var(--accent-color, #00d4aa);
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    overflow-y: auto;
                    color: var(--text-primary, #ffffff);
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--border-color, #333);
                    background: var(--bg-secondary, #2a2a2a);
                }

                .dashboard-header h3 {
                    margin: 0;
                    color: var(--accent-color, #00d4aa);
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-primary, #ffffff);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.3s;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .dashboard-content {
                    padding: 20px;
                }

                .dashboard-section {
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--border-color, #333);
                }

                .dashboard-section:last-child {
                    border-bottom: none;
                }

                .dashboard-section h4 {
                    margin: 0 0 15px 0;
                    color: var(--text-secondary, #cccccc);
                    font-size: 16px;
                }

                .status-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 10px;
                }

                .status-item {
                    padding: 10px;
                    background: var(--bg-secondary, #2a2a2a);
                    border-radius: 5px;
                    border-left: 4px solid var(--status-color, #666);
                }

                .status-item.active {
                    --status-color: var(--success-color, #4CAF50);
                }

                .status-item.error {
                    --status-color: var(--error-color, #f44336);
                }

                .status-item.warning {
                    --status-color: var(--warning-color, #ff9800);
                }

                .controls-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 10px;
                }

                .control-btn {
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                    background: var(--btn-bg, #333);
                    color: var(--text-primary, #ffffff);
                }

                .control-btn.primary {
                    --btn-bg: var(--accent-color, #00d4aa);
                    color: var(--bg-primary, #000000);
                }

                .control-btn.warning {
                    --btn-bg: var(--warning-color, #ff9800);
                }

                .control-btn.info {
                    --btn-bg: var(--info-color, #2196F3);
                }

                .control-btn.danger {
                    --btn-bg: var(--error-color, #f44336);
                }

                .control-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                }

                .analysis-info, .issues-list {
                    background: var(--bg-secondary, #2a2a2a);
                    padding: 15px;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 12px;
                    max-height: 150px;
                    overflow-y: auto;
                }

                .config-options {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .config-options label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .config-options input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                }
            </style>
        `;

        // Agregar al DOM
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.insertAdjacentHTML('beforeend', dashboardHTML);

        this.setupEventListeners();
        this.updateModulesStatus();
    }

    setupEventListeners() {
        // Cerrar dashboard
        document.getElementById('close-dashboard').addEventListener('click', () => {
            this.hide();
        });

        // Controles
        document.getElementById('force-update').addEventListener('click', () => {
            this.forceUpdate();
        });

        document.getElementById('restart-modules').addEventListener('click', () => {
            this.restartModules();
        });

        document.getElementById('run-diagnosis').addEventListener('click', () => {
            this.runDiagnosis();
        });

        document.getElementById('clear-data').addEventListener('click', () => {
            this.clearData();
        });

        // Auto-refresh
        document.getElementById('auto-refresh').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show() {
        const dashboard = document.getElementById('advanced-dashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
            this.isVisible = true;
            this.updateAll();
            this.startAutoRefresh();
        }
    }

    hide() {
        const dashboard = document.getElementById('advanced-dashboard');
        if (dashboard) {
            dashboard.style.display = 'none';
            this.isVisible = false;
            this.stopAutoRefresh();
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    updateModulesStatus() {
        const container = document.getElementById('modules-status-grid');
        if (!container) return;

        const modules = {
            'Performance Monitor': window.performanceMonitor,
            'Volatility Analyzer': window.volatilityAnalyzer,
            'Arbitrage Detector': window.arbitrageDetector,
            'Whale Detector': window.whaleActivityDetector,
            'Portfolio Analytics': window.portfolioAnalytics,
            'Backtesting Engine': window.backtestingEngine,
            'Smart Alerts': window.smartAlertSystem,
            'Advanced Integration': window.advancedIntegration
        };

        container.innerHTML = '';
        
        Object.entries(modules).forEach(([name, module]) => {
            const status = module ? 'active' : 'error';
            const statusText = module ? 'Activo' : 'No disponible';
            
            container.innerHTML += `
                <div class="status-item ${status}">
                    <div><strong>${name}</strong></div>
                    <div>${statusText}</div>
                </div>
            `;
        });
    }

    updateLastAnalysis() {
        const container = document.getElementById('last-analysis-info');
        if (!container) return;

        const app = window.app;
        if (app && app.state && app.state.advancedAnalysis) {
            const analysis = app.state.advancedAnalysis;
            const timestamp = new Date(analysis.timestamp).toLocaleString();
            
            container.innerHTML = `
                <p><strong>Última actualización:</strong> ${timestamp}</p>
                <p><strong>Volatilidad:</strong> ${analysis.volatility?.current || 'N/A'}%</p>
                <p><strong>Señales Whale:</strong> ${analysis.whale?.signals || 'N/A'}</p>
                <p><strong>Oportunidades Arbitraje:</strong> ${analysis.arbitrage?.opportunities || 'N/A'}</p>
                <p><strong>Performance Portfolio:</strong> ${analysis.portfolio?.performance || 'N/A'}</p>
            `;
        } else {
            container.innerHTML = '<p>No hay datos de análisis disponibles</p>';
        }
    }

    updateIssues() {
        const container = document.getElementById('issues-list');
        if (!container) return;

        const issues = [];
        const app = window.app;

        // Verificar problemas comunes
        if (!app) {
            issues.push('⚠️ Aplicación principal no disponible');
        } else {
            if (!app.state.advancedAnalysis) {
                issues.push('⚠️ No hay datos de análisis avanzado');
            }
            
            if (!app.state.data) {
                issues.push('⚠️ No hay datos de mercado');
            }
            
            if (!app.priceData || app.priceData.length === 0) {
                issues.push('⚠️ No hay datos de precios históricos');
            }
        }

        if (!window.portfolioAnalytics) {
            issues.push('⚠️ Portfolio Analytics no disponible');
        }

        if (!window.volatilityAnalyzer) {
            issues.push('⚠️ Volatility Analyzer no disponible');
        }

        if (issues.length === 0) {
            container.innerHTML = '<p>✅ Todo funcionando correctamente</p>';
        } else {
            container.innerHTML = issues.map(issue => `<p>${issue}</p>`).join('');
        }
    }

    updateAll() {
        this.updateModulesStatus();
        this.updateLastAnalysis();
        this.updateIssues();
    }

    async forceUpdate() {
        const btn = document.getElementById('force-update');
        const originalText = btn.textContent;
        btn.textContent = '🔄 Actualizando...';
        btn.disabled = true;

        try {
            const app = window.app;
            if (app) {
                // Aplicar correcciones
                if (window.advancedAnalysisFixes) {
                    await window.advancedAnalysisFixes.applyAllFixes();
                }

                // Forzar actualización de datos
                await app.updateData();
                
                // Forzar análisis
                if (app.state.data) {
                    const analysis = await app.performAdvancedAnalysis(app.state.data);
                    app.state.advancedAnalysis = analysis;
                    app.updateAdvancedAnalysisUI(analysis);
                }

                this.updateAll();
                this.showMessage('✅ Actualización completada exitosamente');
            }
        } catch (error) {
            console.error('Error en actualización forzada:', error);
            this.showMessage('❌ Error en la actualización: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    async restartModules() {
        const btn = document.getElementById('restart-modules');
        const originalText = btn.textContent;
        btn.textContent = '🔧 Reiniciando...';
        btn.disabled = true;

        try {
            // Reinicializar integración avanzada
            if (window.advancedIntegration) {
                await window.advancedIntegration.initializeModules();
            }

            // Aplicar correcciones
            if (window.advancedAnalysisFixes) {
                await window.advancedAnalysisFixes.applyAllFixes();
            }

            this.updateAll();
            this.showMessage('✅ Módulos reiniciados exitosamente');
        } catch (error) {
            console.error('Error reiniciando módulos:', error);
            this.showMessage('❌ Error reiniciando módulos: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    async runDiagnosis() {
        const btn = document.getElementById('run-diagnosis');
        const originalText = btn.textContent;
        btn.textContent = '🔍 Diagnosticando...';
        btn.disabled = true;

        try {
            if (window.advancedAnalysisDebugger) {
                const results = await window.advancedAnalysisDebugger.performDiagnostic();
                console.log('Resultados del diagnóstico:', results);
                this.showMessage('✅ Diagnóstico completado. Ver consola para detalles.');
            } else {
                this.showMessage('⚠️ Debugger no disponible');
            }
            
            this.updateAll();
        } catch (error) {
            console.error('Error en diagnóstico:', error);
            this.showMessage('❌ Error en diagnóstico: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    clearData() {
        if (confirm('¿Estás seguro de que quieres limpiar todos los datos?')) {
            const app = window.app;
            if (app) {
                app.state.advancedAnalysis = null;
                app.priceData = [];
                app.state.priceHistory = [];
                
                // Limpiar portfolio
                if (window.portfolioAnalytics) {
                    window.portfolioAnalytics.portfolios.clear();
                }
            }
            
            this.updateAll();
            this.showMessage('🗑️ Datos limpiados');
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            if (this.isVisible) {
                this.updateAll();
            }
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary, #2a2a2a);
            color: var(--text-primary, #ffffff);
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid var(--accent-color, #00d4aa);
            z-index: 10001;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Crear instancia global
window.advancedAnalysisDashboard = new AdvancedAnalysisDashboard();

// Agregar botón para abrir el dashboard
window.addEventListener('load', () => {
    // Crear botón flotante
    const floatingBtn = document.createElement('button');
    floatingBtn.innerHTML = '🔬';
    floatingBtn.title = 'Panel de Control - Análisis Avanzado';
    floatingBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: var(--accent-color, #00d4aa);
        color: var(--bg-primary, #000000);
        font-size: 20px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
        transition: all 0.3s;
    `;
    
    floatingBtn.addEventListener('click', () => {
        window.advancedAnalysisDashboard.toggle();
    });
    
    floatingBtn.addEventListener('mouseenter', () => {
        floatingBtn.style.transform = 'scale(1.1)';
    });
    
    floatingBtn.addEventListener('mouseleave', () => {
        floatingBtn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(floatingBtn);
});

// Comando rápido para abrir el dashboard
window.openAdvancedDashboard = () => window.advancedAnalysisDashboard.show();

console.log('🎛️ Advanced Analysis Dashboard cargado');
