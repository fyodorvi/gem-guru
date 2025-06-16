import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import cors from 'cors';
import dotenv from 'dotenv';

console.log('🔄 Starting server...');

// Load environment variables from .env file
const envResult = dotenv.config({ path: './dev.env' });
if (envResult.error) {
    console.log('⚠️ No .env file found, using default environment variables');
} else {
    console.log('✅ Environment variables loaded');
}

console.log('📋 Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    Auth0Audience: process.env.Auth0Audience ? '***' : 'not set',
    Auth0Issuer: process.env.Auth0Issuer ? '***' : 'not set'
});

try {
    console.log('📦 Loading routes...');
    const routes = require('./src/controller');
    console.log('✅ Routes loaded successfully');

    const app = express();

    // Increase payload limits for PDF uploads (base64 encoded)
    // 15MB should be plenty for PDF statements (original 10MB + base64 overhead)
    app.use(express.json({ limit: '15mb' }));
    app.use(express.urlencoded({ limit: '15mb', extended: true }));
    app.use(cors());

    // Only use auth middleware if not in development mode
    if (process.env.NODE_ENV !== 'development') {
        app.use(
            auth({
                issuerBaseURL: process.env.Auth0Issuer,
                audience: process.env.Auth0Audience,
                tokenSigningAlg: 'RS256'
            })
        );
        console.log('🔐 Auth middleware enabled');
    } else {
        // In development, add a mock auth middleware
        app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            // Mock auth object for development
            (req as any).auth = {
                payload: {
                    sub: 'dev-user-123' // Mock user ID for development
                }
            };
            next();
        });
        console.log('🔓 Mock auth middleware enabled for development');
    }

    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (err) {
            console.error('❌ Error:', err)
            console.error('📥 Headers:', req.headers);
            res.status(500).send('Something broke!')
        } else {
            next();
        }
    })

    app.use('/', routes.default || routes);

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.log(`❓ 404 - ${req.method} ${req.path}`);
        res.status(404).send();
    });

    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('❌ Unhandled error:', err);
        res.status(err.status || 500).send();
    });

    const PORT = process.env.PORT || 3000;

    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔑 Auth: ${process.env.NODE_ENV === 'development' ? 'DISABLED (mock user)' : 'ENABLED'}`);
        console.log('✅ Server started successfully!');
    });

    server.on('error', (error: any) => {
        console.error('❌ Server error:', error);
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use. Please stop other processes or change the port.`);
        }
    });

} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
} 