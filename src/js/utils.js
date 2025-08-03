// utils.js - Funciones de utilidad comunes

class Utils {
    constructor() {
        this.config = window.appConfig;
    }

    // Formateo de números
    static formatPrice(price, decimals = 6) {
        if (!price || isNaN(price)) return '0.000000';
        return Number(price).toFixed(decimals);
    }

    static formatVolume(volume) {
        if (!volume || isNaN(volume)) return '0';
        
        const absVolume = Math.abs(volume);
        if (absVolume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
        if (absVolume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
        if (absVolume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
        return volume.toFixed(2);
    }

    static formatPercent(value, decimals = 2) {
        if (!value || isNaN(value)) return '0.00%';
        return `${value.toFixed(decimals)}%`;
    }

    static formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(amount);
    }

    // Utilidades de tiempo
    static formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    static formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return 'hace un momento';
    }

    // Utilidades de validación
    static isValidPrice(price) {
        return typeof price === 'number' && !isNaN(price) && price > 0;
    }

    static isValidVolume(volume) {
        return typeof volume === 'number' && !isNaN(volume) && volume >= 0;
    }

    static isValidPercentage(percent) {
        return typeof percent === 'number' && !isNaN(percent);
    }

    // Utilidades de arrays
    static calculateAverage(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    static calculateStandardDeviation(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        const avg = this.calculateAverage(arr);
        const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
        return Math.sqrt(this.calculateAverage(squareDiffs));
    }

    static findMinMax(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return { min: 0, max: 0 };
        return {
            min: Math.min(...arr),
            max: Math.max(...arr)
        };
    }

    // Utilidades de DOM
    static createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }

    static setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    static setElementHTML(id, html) {
        const element = document.getElementById(id);
        if (element) element.innerHTML = html;
    }

    static toggleElementClass(id, className, condition) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.toggle(className, condition);
        }
    }

    static showElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'block';
    }

    static hideElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    }

    // Utilidades de performance
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Utilidades de storage
    static saveToStorage(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            return true;
        } catch (error) {
            console.warn('Error guardando en storage:', error);
            return false;
        }
    }

    static loadFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Error cargando desde storage:', error);
            return defaultValue;
        }
    }

    static clearStorage(prefix = '') {
        try {
            if (prefix) {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(prefix))
                    .forEach(key => localStorage.removeItem(key));
            } else {
                localStorage.clear();
            }
            return true;
        } catch (error) {
            console.warn('Error limpiando storage:', error);
            return false;
        }
    }

    // Utilidades de red
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static isOnline() {
        return navigator.onLine;
    }

    static async checkConnectivity(url = 'https://api.coingecko.com/api/v3/ping') {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch {
            return false;
        }
    }

    // Utilidades de color
    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    static getRandomColor() {
        return `#${Math.floor(Math.random()*16777215).toString(16)}`;
    }

    // Utilidades matemáticas
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + factor * (end - start);
    }

    static roundToDecimals(value, decimals) {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    // Generadores de IDs únicos
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static generateHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit integer
        }
        return hash.toString(36);
    }

    // Utilidades de error handling
    static createError(message, code = 'UNKNOWN', data = null) {
        const error = new Error(message);
        error.code = code;
        error.data = data;
        error.timestamp = Date.now();
        return error;
    }

    static logError(error, context = '') {
        console.error(`[${context}] Error:`, {
            message: error.message,
            code: error.code || 'UNKNOWN',
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
}

// Instancia global de utilidades
window.utils = new Utils();

console.log('🔧 Utilidades cargadas');
