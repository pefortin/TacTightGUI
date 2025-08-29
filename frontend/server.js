const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://backend:8000';

// Configuration de sécurité
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour permettre les scripts inline
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression des réponses
app.use(compression());

// Configuration CORS
app.use(cors({
    origin: ['http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false
}));

// Middleware pour parser JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Proxy pour les appels API
app.use('/api', createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Enlever /api du chemin
    },
    logLevel: 'debug', // Ajouter pour debug
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Original URL: ${req.url}`);
        console.log(`🔄 Proxying ${req.method} to ${API_URL}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ Response from ${req.url}: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
        res.status(500).json({
            error: 'Backend connection failed',
            message: 'Unable to connect to the backend API server',
            details: err.message
        });
    }
}));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname), {
    maxAge: '1h', // Cache des fichiers statiques
    etag: true
}));

// Route pour servir index.html sur toutes les routes non-API
app.get('*', (req, res, next) => {
    // Ne pas intercepter les routes API
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on the server',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    console.log(`❓ 404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Route not found',
        path: req.url,
        method: req.method
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Haptistrap Frontend Server running on http://127.0.0.1:${PORT}`);
    console.log(`📡 Proxying API calls to: ${API_URL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Serving static files from: ${__dirname}`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

