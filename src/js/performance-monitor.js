// performance-monitor.js - Sistema integral de métricas y debugging avanzado

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.alerts = [];
        this.memorySnapshots = [];
        this.networkMetrics = [];
        this.errorMetrics = new Map();
        this.config = {
            memoryCheckInterval: 30000, // 30 segundos
            maxMemorySnapshots: 100,
            performanceThreshold: 2, // 2x tiempo promedio
            maxErrorsPerMinute: 10
        };
        
        this.startSystemMonitoring();
    }

    startProfile(operation) {
        const profileId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();
        const startMark = `${profileId}_start`;
        
        performance.mark(startMark);
        
        return {
            id: profileId,
            operation,
            startTime,
            end: () => {
                const endTime = performance.now();
                const endMark = `${profileId}_end`;
                
                performance.mark(endMark);
                performance.measure(profileId, startMark, endMark);
                
                const measure = performance.getEntriesByName(profileId)[0];
                const duration = measure ? measure.duration : (endTime - startTime);
                
                this.recordMetric(operation, duration);
                
                // Cleanup performance entries
                performance.clearMarks(startMark);
                performance.clearMarks(endMark);
                performance.clearMeasures(profileId);
                
                return duration;
            }
        };
    }

    recordMetric(operation, duration, metadata = {}) {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, {
                count: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0,
                avgTime: 0,
                recentSamples: [],
                p95: 0,
                p99: 0,
                errorCount: 0,
                metadata: new Map()
            });
        }

        const metric = this.metrics.get(operation);
        metric.count++;
        metric.totalTime += duration;
        metric.minTime = Math.min(metric.minTime, duration);
        metric.maxTime = Math.max(metric.maxTime, duration);
        metric.avgTime = metric.totalTime / metric.count;
        
        // Mantener solo las últimas 1000 muestras para percentiles
        metric.recentSamples.push({
            duration,
            timestamp: Date.now(),
            metadata
        });
        
        if (metric.recentSamples.length > 1000) {
            metric.recentSamples.shift();
        }

        // Calcular percentiles
        this.updatePercentiles(metric);

        // Almacenar metadata
        Object.entries(metadata).forEach(([key, value]) => {
            if (!metric.metadata.has(key)) {
                metric.metadata.set(key, []);
            }
            metric.metadata.get(key).push(value);
        });

        // Alertas automáticas por performance degradation
        if (duration > metric.avgTime * this.config.performanceThreshold) {
            this.createPerformanceAlert(operation, duration, metric.avgTime);
        }

        // Registro de métricas de red si es una operación de API
        if (operation.includes('api') || operation.includes('fetch')) {
            this.recordNetworkMetric(operation, duration, metadata);
        }
    }

    updatePercentiles(metric) {
        const durations = metric.recentSamples
            .map(sample => sample.duration)
            .sort((a, b) => a - b);
        
        if (durations.length > 0) {
            metric.p95 = this.calculatePercentile(durations, 0.95);
            metric.p99 = this.calculatePercentile(durations, 0.99);
        }
    }

    calculatePercentile(sortedArray, percentile) {
        const index = Math.ceil(sortedArray.length * percentile) - 1;
        return sortedArray[Math.max(0, index)] || 0;
    }

    recordNetworkMetric(operation, duration, metadata) {
        this.networkMetrics.push({
            operation,
            duration,
            timestamp: Date.now(),
            success: !metadata.error,
            statusCode: metadata.statusCode,
            size: metadata.size || 0,
            cached: metadata.cached || false
        });

        // Mantener solo las últimas 500 métricas de red
        if (this.networkMetrics.length > 500) {
            this.networkMetrics.shift();
        }
    }

    recordError(operation, error, context = {}) {
        const errorKey = `${operation}_error`;
        
        if (!this.errorMetrics.has(errorKey)) {
            this.errorMetrics.set(errorKey, {
                count: 0,
                lastError: null,
                errorTypes: new Map(),
                recentErrors: []
            });
        }

        const errorMetric = this.errorMetrics.get(errorKey);
        errorMetric.count++;
        errorMetric.lastError = {
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            context
        };

        // Clasificar tipos de error
        const errorType = this.classifyError(error);
        const typeCount = errorMetric.errorTypes.get(errorType) || 0;
        errorMetric.errorTypes.set(errorType, typeCount + 1);

        // Mantener errores recientes
        errorMetric.recentErrors.push({
            message: error.message,
            type: errorType,
            timestamp: Date.now(),
            context
        });

        if (errorMetric.recentErrors.length > 50) {
            errorMetric.recentErrors.shift();
        }

        // Actualizar métrica de operación principal
        const metric = this.metrics.get(operation);
        if (metric) {
            metric.errorCount++;
        }

        // Alerta si hay demasiados errores
        this.checkErrorThreshold(operation, errorMetric);
    }

    classifyError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) return 'network';
        if (message.includes('timeout')) return 'timeout';
        if (message.includes('cors')) return 'cors';
        if (message.includes('parse') || message.includes('json')) return 'parsing';
        if (message.includes('rate limit')) return 'rate_limit';
        if (message.includes('404')) return 'not_found';
        if (message.includes('500')) return 'server_error';
        
        return 'unknown';
    }

    checkErrorThreshold(operation, errorMetric) {
        const oneMinuteAgo = Date.now() - 60000;
        const recentErrors = errorMetric.recentErrors.filter(
            error => error.timestamp > oneMinuteAgo
        );

        if (recentErrors.length > this.config.maxErrorsPerMinute) {
            this.createErrorAlert(operation, recentErrors.length);
        }
    }

    createPerformanceAlert(operation, duration, avgDuration) {
        const alert = {
            type: 'PERFORMANCE_DEGRADATION',
            operation,
            duration,
            avgDuration,
            degradationFactor: duration / avgDuration,
            timestamp: Date.now(),
            severity: duration > avgDuration * 5 ? 'critical' : 'warning'
        };

        this.alerts.push(alert);
        this.pruneAlerts();
        
        console.warn(`🐌 Performance alert: ${operation} took ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
    }

    createErrorAlert(operation, errorCount) {
        const alert = {
            type: 'ERROR_THRESHOLD_EXCEEDED',
            operation,
            errorCount,
            timeWindow: '1 minute',
            timestamp: Date.now(),
            severity: errorCount > this.config.maxErrorsPerMinute * 2 ? 'critical' : 'warning'
        };

        this.alerts.push(alert);
        this.pruneAlerts();
        
        console.error(`💥 Error alert: ${operation} has ${errorCount} errors in the last minute`);
    }

    startSystemMonitoring() {
        // Monitoreo de memoria
        setInterval(() => {
            this.captureMemorySnapshot();
        }, this.config.memoryCheckInterval);

        // Monitoreo de FPS (si disponible)
        if (typeof requestAnimationFrame !== 'undefined') {
            this.startFPSMonitoring();
        }

        // Listeners para eventos del sistema
        this.setupSystemEventListeners();
    }

    captureMemorySnapshot() {
        const memoryInfo = this.getMemoryInfo();
        
        this.memorySnapshots.push({
            timestamp: Date.now(),
            ...memoryInfo
        });

        // Mantener solo los últimos N snapshots
        if (this.memorySnapshots.length > this.config.maxMemorySnapshots) {
            this.memorySnapshots.shift();
        }

        // Alerta si el uso de memoria es alto
        if (memoryInfo.heapUsed > memoryInfo.heapLimit * 0.8) {
            this.createMemoryAlert(memoryInfo);
        }
    }

    getMemoryInfo() {
        const info = {
            heapUsed: 0,
            heapTotal: 0,
            heapLimit: 0,
            external: 0
        };

        if (performance.memory) {
            info.heapUsed = performance.memory.usedJSHeapSize;
            info.heapTotal = performance.memory.totalJSHeapSize;
            info.heapLimit = performance.memory.jsHeapSizeLimit;
        }

        // Estimación de memoria externa (DOM, etc.)
        if (typeof document !== 'undefined') {
            info.external = document.getElementsByTagName('*').length * 100; // Estimación
        }

        return info;
    }

    createMemoryAlert(memoryInfo) {
        const alert = {
            type: 'HIGH_MEMORY_USAGE',
            heapUsed: memoryInfo.heapUsed,
            heapLimit: memoryInfo.heapLimit,
            usage: (memoryInfo.heapUsed / memoryInfo.heapLimit) * 100,
            timestamp: Date.now(),
            severity: memoryInfo.heapUsed > memoryInfo.heapLimit * 0.9 ? 'critical' : 'warning'
        };

        this.alerts.push(alert);
        this.pruneAlerts();
        
        console.warn(`🧠 Memory alert: ${alert.usage.toFixed(1)}% heap usage`);
    }

    startFPSMonitoring() {
        let lastFrameTime = performance.now();
        let frameCount = 0;
        let fpsSum = 0;

        const measureFPS = (currentTime) => {
            const delta = currentTime - lastFrameTime;
            const fps = 1000 / delta;
            
            frameCount++;
            fpsSum += fps;
            
            // Calcular FPS promedio cada segundo
            if (frameCount >= 60) {
                const avgFPS = fpsSum / frameCount;
                this.recordMetric('fps', avgFPS, { type: 'framerate' });
                
                frameCount = 0;
                fpsSum = 0;
            }
            
            lastFrameTime = currentTime;
            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    setupSystemEventListeners() {
        // Eventos de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            this.recordMetric('page_visibility', Date.now(), {
                visible: !document.hidden
            });
        });

        // Eventos de red
        window.addEventListener('online', () => {
            this.recordMetric('network_status', Date.now(), { online: true });
        });

        window.addEventListener('offline', () => {
            this.recordMetric('network_status', Date.now(), { online: false });
        });

        // Eventos de error no capturados
        window.addEventListener('error', (event) => {
            this.recordError('unhandled_error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.recordError('unhandled_promise_rejection', new Error(event.reason), {
                promise: event.promise
            });
        });
    }

    getReport() {
        const report = {
            timestamp: Date.now(),
            metrics: {},
            system: this.getSystemReport(),
            network: this.getNetworkReport(),
            errors: this.getErrorReport(),
            alerts: this.getActiveAlerts()
        };
        
        for (const [operation, metric] of this.metrics) {
            const recent = metric.recentSamples.slice(-10);
            const recentAvg = recent.length > 0 
                ? recent.reduce((sum, sample) => sum + sample.duration, 0) / recent.length 
                : metric.avgTime;
            
            report.metrics[operation] = {
                totalOperations: metric.count,
                averageTime: metric.avgTime,
                recentAverageTime: recentAvg,
                minTime: metric.minTime,
                maxTime: metric.maxTime,
                p95: metric.p95,
                p99: metric.p99,
                errorCount: metric.errorCount,
                errorRate: metric.count > 0 ? (metric.errorCount / metric.count) * 100 : 0,
                performanceTrend: this.calculateTrend(metric.recentSamples),
                reliability: this.calculateReliability(metric)
            };
        }

        return report;
    }

    getSystemReport() {
        const latestMemory = this.memorySnapshots[this.memorySnapshots.length - 1];
        
        return {
            memory: latestMemory || this.getMemoryInfo(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            connectionType: this.getConnectionType()
        };
    }

    getConnectionType() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }

    getNetworkReport() {
        const recent = this.networkMetrics.filter(
            metric => Date.now() - metric.timestamp < 300000 // últimos 5 minutos
        );

        if (recent.length === 0) {
            return { totalRequests: 0, successRate: 0, avgDuration: 0 };
        }

        const successful = recent.filter(metric => metric.success);
        const cached = recent.filter(metric => metric.cached);

        return {
            totalRequests: recent.length,
            successfulRequests: successful.length,
            successRate: (successful.length / recent.length) * 100,
            cacheHitRate: (cached.length / recent.length) * 100,
            avgDuration: recent.reduce((sum, metric) => sum + metric.duration, 0) / recent.length,
            totalDataTransferred: recent.reduce((sum, metric) => sum + (metric.size || 0), 0)
        };
    }

    getErrorReport() {
        const report = {};
        
        for (const [operation, errorMetric] of this.errorMetrics) {
            const recentErrors = errorMetric.recentErrors.filter(
                error => Date.now() - error.timestamp < 3600000 // última hora
            );

            report[operation] = {
                totalErrors: errorMetric.count,
                recentErrors: recentErrors.length,
                lastError: errorMetric.lastError,
                errorTypes: Object.fromEntries(errorMetric.errorTypes),
                errorRate: this.calculateErrorRate(operation, recentErrors)
            };
        }

        return report;
    }

    calculateErrorRate(operation, recentErrors) {
        const metric = this.metrics.get(operation);
        if (!metric) return 0;

        const recentOperations = metric.recentSamples.filter(
            sample => Date.now() - sample.timestamp < 3600000
        ).length;

        return recentOperations > 0 ? (recentErrors.length / recentOperations) * 100 : 0;
    }

    getActiveAlerts() {
        const cutoff = Date.now() - 3600000; // última hora
        return this.alerts.filter(alert => alert.timestamp > cutoff);
    }

    calculateTrend(samples) {
        if (samples.length < 10) return 'insufficient_data';

        const recent = samples.slice(-10);
        const older = samples.slice(-20, -10);

        if (older.length === 0) return 'insufficient_data';

        const recentAvg = recent.reduce((sum, sample) => sum + sample.duration, 0) / recent.length;
        const olderAvg = older.reduce((sum, sample) => sum + sample.duration, 0) / older.length;

        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (change > 20) return 'degrading';
        if (change < -20) return 'improving';
        return 'stable';
    }

    calculateReliability(metric) {
        const totalOps = metric.count;
        const errors = metric.errorCount;
        
        if (totalOps === 0) return 0;
        
        const successRate = ((totalOps - errors) / totalOps) * 100;
        const consistencyScore = metric.recentSamples.length > 0 
            ? this.calculateConsistencyScore(metric.recentSamples) 
            : 50;

        return (successRate * 0.7 + consistencyScore * 0.3);
    }

    calculateConsistencyScore(samples) {
        if (samples.length < 2) return 50;

        const durations = samples.map(sample => sample.duration);
        const mean = durations.reduce((a, b) => a + b) / durations.length;
        const variance = durations.reduce((sum, duration) => sum + Math.pow(duration - mean, 2), 0) / durations.length;
        const cv = Math.sqrt(variance) / mean; // Coefficient of variation

        // Convertir CV a score (menor CV = mayor consistencia)
        return Math.max(0, Math.min(100, 100 - (cv * 100)));
    }

    pruneAlerts() {
        const cutoff = Date.now() - 86400000; // 24 horas
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
    }

    // Benchmark de operaciones críticas
    async runBenchmark(operations = ['api_call', 'data_processing', 'chart_update']) {
        const benchmarkResults = {};

        for (const operation of operations) {
            const results = [];
            
            for (let i = 0; i < 10; i++) {
                const profile = this.startProfile(`benchmark_${operation}`);
                
                // Simular operación
                await this.simulateOperation(operation);
                
                const duration = profile.end();
                results.push(duration);
            }

            benchmarkResults[operation] = {
                runs: results.length,
                avgTime: results.reduce((a, b) => a + b) / results.length,
                minTime: Math.min(...results),
                maxTime: Math.max(...results),
                median: this.calculateMedian(results)
            };
        }

        return benchmarkResults;
    }

    async simulateOperation(operation) {
        // Simulaciones básicas para benchmark
        switch (operation) {
            case 'api_call':
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
                break;
            case 'data_processing':
                // Simular procesamiento de datos
                const data = Array.from({length: 1000}, () => Math.random());
                data.sort().reverse();
                break;
            case 'chart_update':
                // Simular actualización de gráfico
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
                break;
        }
    }

    calculateMedian(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        return sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];
    }

    getMetrics() {
        const metricsObj = {};
        for (const [key, value] of this.metrics) {
            metricsObj[key] = value;
        }
        return metricsObj;
    }

    // Exportar métricas para análisis externo
    exportMetrics(format = 'json') {
        const data = this.getReport();
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                return data;
        }
    }

    convertToCSV(data) {
        const rows = [];
        rows.push('Operation,Count,AvgTime,MinTime,MaxTime,P95,P99,ErrorRate');
        
        Object.entries(data.metrics).forEach(([operation, metric]) => {
            rows.push(`${operation},${metric.totalOperations},${metric.averageTime.toFixed(2)},${metric.minTime.toFixed(2)},${metric.maxTime.toFixed(2)},${metric.p95.toFixed(2)},${metric.p99.toFixed(2)},${metric.errorRate.toFixed(2)}`);
        });
        
        return rows.join('\n');
    }

    // Cleanup
    cleanup() {
        this.metrics.clear();
        this.alerts = [];
        this.memorySnapshots = [];
        this.networkMetrics = [];
        this.errorMetrics.clear();
    }
}

// Crear instancia global
if (!window.PerformanceMonitor) {
    window.PerformanceMonitor = PerformanceMonitor;
}

// Crear instancia global
window.performanceMonitor = new PerformanceMonitor();

console.log('📊 Performance Monitor cargado');
