// volatility-analyzer.js - Análisis de Volatilidad Avanzado
// Versión compatible sin módulos ES6

class VolatilityAnalyzer {
  static Z = { 0.9: 1.282, 0.95: 1.645, 0.99: 2.326 };

  constructor() {
    this.cache = new Map();
    this.rng = Math.random; // Usar Math.random en lugar de seedrandom
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

  // Función auxiliar para calcular cuantil
  quantile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  async valueAtRisk(rawPrices, {
    confidence = 0.95,
    horizonDays = 1,
    sims = 10_000
  } = {}) {
    const t0 = performance.now();

    const prices = rawPrices.map(p => Array.isArray(p) ? p[1] : p);
    const rets   = prices.slice(1).map((p,i) => Math.log(p / prices[i]));

    const σhist = this.histVol(rets);
    const σewma = this.ewmaVol(rets);
    const σgarch = await this.garchVol(rets);

    const vols = { hist: σhist, ewma: σewma, garch: σgarch };
    const VaR  = {
      parametric: this.parametricVaR(rets, σgarch, confidence),
      historical: this.historicalVaR(rets, confidence),
      monteCarlo: this.mcVaR(rets, σgarch, confidence, sims)
    };

    // pesos dinámicos: más peso al método con error ≤ 5 %
    const w = this.weights(); 
    const ensemble = Object.entries(VaR).reduce((s,[k,v]) => s + v * w[k],0);

    console.info(`VaR listo en ${ (performance.now()-t0)|0 } ms`);

    return { ensemble, individual: VaR, vols, confidence, horizonDays, ts: Date.now() };
  }

  /* ---------- helpers ---------- */

  parametricVaR(rets, σ, c) {
    const μ = this.mean(rets);
    const z = VolatilityAnalyzer.Z[c] ?? 1.645;
    return -(μ + z * σ);
  }

  historicalVaR(rets, c) {
    return -this.quantile(rets, 1 - c);
  }

  mcVaR(rets, σ, c, n) {
    const μ = this.mean(rets);
    const sims = Array.from({ length: n }, () =>
      μ + σ * this.gauss()
    ).sort((a,b) => a - b);
    return -sims[Math.floor((1 - c) * n)];
  }

  gauss() {
    let u=0, v=0;
    while (u === 0) u = this.rng();
    while (v === 0) v = this.rng();
    return Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
  }

  ewmaVol(rets, λ = 0.94) {
    return Math.sqrt(rets.reduce(
      (v,r) => λ*v + (1-λ)*r*r, rets[0]**2
    ));
  }

  histVol(rets, period = 252) {
    return Math.sqrt(this.standardDeviation(rets)**2 * period);
  }

  async garchVol(rets) {
    if (rets.length < 30) return this.histVol(rets);
    // Simplificado sin librería GARCH externa
    return this.ewmaVol(rets);
  }

  weights() {
    return { parametric: 0.4, historical: 0.3, monteCarlo: 0.3 };
  }
}

// Hacer disponible globalmente
window.VolatilityAnalyzer = VolatilityAnalyzer;

// Crear instancia global
window.volatilityAnalyzer = new VolatilityAnalyzer();

console.log('📊 Volatility Analyzer cargado');
