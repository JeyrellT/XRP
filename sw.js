// Service Worker básico para XRP Trading App
// Versión 2.0 - Actualizado para forzar limpieza de caché

const CACHE_NAME = 'xrp-trading-app-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/css/styles.css',
    '/src/css/styles_final.css',
    '/src/css/chart-improvements.css',
    '/src/js/app.js',
    '/src/js/app_improved.js',
    '/src/js/config.js',
    '/src/js/api.js',
    '/src/js/utils.js',
    '/src/js/charts.js',
    '/src/js/indicators.js',
    '/src/js/trading.js',
    '/src/js/performance-monitor.js',
    '/src/js/parallel-processor.js',
    '/src/js/crypto-data-manager.js',
    '/src/js/volatility-analyzer.js',
    '/src/js/arbitrage-detector.js',
    '/src/js/whale-detector.js',
    '/src/js/smart-alert-system.js',
    '/src/js/portfolio-analytics.js',
    '/src/js/backtesting-engine.js',
    '/src/js/advanced-integration.js',
    '/src/js/advanced-analysis-dashboard.js',
    '/src/js/advanced-analysis-fixes.js',
    '/src/js/debug-advanced-analysis.js',
    '/src/js/advanced-analysis-activator.js'
];

// Evento de instalación
self.addEventListener('install', function(event) {
    console.log('🔧 Service Worker: Instalando versión v2...');
    
    // Forzar la activación inmediata
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('📦 Cache v2 abierto');
                return cache.addAll(urlsToCache.filter(url => {
                    // Solo cachear archivos básicos por ahora
                    return ['/', '/index.html', '/src/css/styles.css'].includes(url);
                }));
            })
            .catch(function(error) {
                console.warn('⚠️ Error cacheando archivos:', error);
            })
    );
});

// Evento de fetch - Strategy: Network First para desarrollo
self.addEventListener('fetch', function(event) {
    // Solo manejar requests GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        // Intentar primero la red para obtener la versión más reciente
        fetch(event.request)
            .then(function(response) {
                // Si la red funciona, clonamos la respuesta para guardarla en caché
                const responseClone = response.clone();
                
                // Actualizar el caché con la nueva versión
                caches.open(CACHE_NAME)
                    .then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                
                return response;
            })
            .catch(function() {
                // Si falla la red, buscar en caché como respaldo
                return caches.match(event.request)
                    .then(function(response) {
                        if (response) {
                            return response;
                        }
                        
                        // Si no está en caché y es navegación, devolver index
                        if (event.request.mode === 'navigate') {
                            return caches.match('/');
                        }
                    });
            })
    );
});

// Evento de activación
self.addEventListener('activate', function(event) {
    console.log('✅ Service Worker v2: Activado');
    
    // Tomar control inmediato de todas las pestañas
    self.clients.claim();
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    // Limpiar caches antiguos
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

console.log('🚀 Service Worker cargado');
