// whale-detector.js - Detector de Actividad Whale
// Versión compatible sin módulos ES6

class WhaleActivityDetector {
  constructor() {
    this.cfg = {
      volumeUsd: 1e6,
      impactBps: 50,                // 0.5 %
      windowMs: 3_600_000,          // 1 h
      zLimit: 3,
      eps: 0.1,
      minPts: 3
    };

    this.history = [];
    this.alertCbs = new Set();
  }

  // ============ CONFIGURACIÓN ============

  configure(options = {}) {
    this.cfg = { ...this.cfg, ...options };
    console.log('🐋 Whale Detector configurado:', this.cfg);
  }

  // Función auxiliar para calcular media
  mean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  // Función auxiliar para calcular desviación estándar
  standardDeviation(arr) {
    const avg = this.mean(arr);
    const squaredDiffs = arr.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  async analyze(symbol, { prices }) {
    const t0 = performance.now();

    const txs = this.synthTransactions(prices);
    const profile = this.volumeBySlot(txs);

    const anomalies = this.detectAnomalies(profile);
    const clusters = this.cluster(anomalies);
    const impacts  = this.priceImpact(clusters, prices);

    const signals  = this.signals(clusters, impacts);
    if (signals.length) this.notify(signals);

    console.info(`Whale análisis para ${symbol} en ${(performance.now()-t0)|0} ms`);

    return {
      symbol,
      detected: signals.length > 0,
      signals,
      clusters,
      anomalies: anomalies.length,
      impact: impacts.reduce((sum, imp) => sum + Math.abs(imp.estimatedChange), 0),
      timestamp: Date.now()
    };
  }

  synthTransactions(prices) {
    const txs = [];
    const baseVolume = 500_000; // Volume base

    for (let i = 1; i < prices.length; i++) {
      const [timestamp, price] = prices[i];
      const [, prevPrice] = prices[i-1];
      
      const change = Math.abs((price - prevPrice) / prevPrice);
      const volume = baseVolume * (1 + change * 10); // Volumen proporcional al cambio
      
      // Generar transacciones sintéticas
      const numTxs = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < numTxs; j++) {
        txs.push({
          timestamp: timestamp + Math.random() * 60000, // Distribuir en el minuto
          volumeUsd: volume / numTxs * (0.5 + Math.random()),
          price
        });
      }
    }

    return txs;
  }

  volumeBySlot(txs) {
    const slots = new Map();
    const slotSize = 300_000; // 5 minutos

    for (const tx of txs) {
      const slot = Math.floor(tx.timestamp / slotSize) * slotSize;
      if (!slots.has(slot)) {
        slots.set(slot, { timestamp: slot, volumeUsd: 0, count: 0 });
      }
      const slotData = slots.get(slot);
      slotData.volumeUsd += tx.volumeUsd;
      slotData.count++;
    }

    return Array.from(slots.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  detectAnomalies(profile) {
    if (profile.length < 10) return [];

    const volumes = profile.map(p => p.volumeUsd);
    const mean = this.mean(volumes);
    const std = this.standardDeviation(volumes);

    return profile.filter(p => {
      const zScore = Math.abs((p.volumeUsd - mean) / std);
      return zScore > this.cfg.zLimit && p.volumeUsd > this.cfg.volumeUsd;
    });
  }

  // Clustering simplificado sin librería externa
  cluster(anomalies) {
    if (anomalies.length < 2) return anomalies.map((a, i) => ({ ...a, cluster: i }));

    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < anomalies.length; i++) {
      if (visited.has(i)) continue;

      const cluster = [anomalies[i]];
      visited.add(i);

      // Buscar puntos cercanos en tiempo
      for (let j = i + 1; j < anomalies.length; j++) {
        if (visited.has(j)) continue;

        const timeDiff = Math.abs(anomalies[j].timestamp - anomalies[i].timestamp);
        if (timeDiff <= this.cfg.windowMs) {
          cluster.push(anomalies[j]);
          visited.add(j);
        }
      }

      if (cluster.length >= this.cfg.minPts) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  priceImpact(clusters, prices) {
    return clusters.map(cluster => {
      const clusterTime = this.mean(cluster.map(c => c.timestamp));
      const totalVolume = cluster.reduce((sum, c) => sum + c.volumeUsd, 0);
      
      // Encontrar precio antes y después del cluster
      let beforePrice = null, afterPrice = null;
      
      for (const [timestamp, price] of prices) {
        if (timestamp <= clusterTime) beforePrice = price;
        if (timestamp > clusterTime && !afterPrice) {
          afterPrice = price;
          break;
        }
      }

      const estimatedChange = beforePrice && afterPrice 
        ? ((afterPrice - beforePrice) / beforePrice) * 100
        : 0;

      return {
        timestamp: clusterTime,
        volumeUsd: totalVolume,
        estimatedChange,
        confidence: Math.min(totalVolume / this.cfg.volumeUsd, 1)
      };
    });
  }

  signals(clusters, impacts) {
    return impacts
      .filter(impact => Math.abs(impact.estimatedChange) > this.cfg.impactBps / 100)
      .map(impact => ({
        type: 'whale_activity',
        timestamp: impact.timestamp,
        severity: impact.confidence > 0.8 ? 'high' : 'medium',
        message: `Actividad whale detectada: ${impact.volumeUsd.toLocaleString()} USD, ` +
                `impacto estimado: ${impact.estimatedChange.toFixed(2)}%`,
        data: impact
      }));
  }

  notify(signals) {
    signals.forEach(signal => {
      this.alertCbs.forEach(callback => {
        try {
          callback(signal);
        } catch (error) {
          console.error('Error en callback de whale alert:', error);
        }
      });
    });
  }

  onAlert(callback) {
    this.alertCbs.add(callback);
  }

  offAlert(callback) {
    this.alertCbs.delete(callback);
  }
}

// Hacer disponible globalmente
window.WhaleActivityDetector = WhaleActivityDetector;

// Crear instancia global
window.whaleActivityDetector = new WhaleActivityDetector();

console.log('🐋 Whale Activity Detector cargado');
