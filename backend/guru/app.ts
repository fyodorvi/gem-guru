import express from 'express';
import serverless from 'serverless-http';
import { auth } from 'express-oauth2-jwt-bearer';
import cors from 'cors';

import routes from './src/controller';

const app = express();

// Increase payload limits for PDF uploads (base64 encoded)
// 15MB should be plenty for PDF statements (original 10MB + base64 overhead)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cors());

app.use(
    auth({
        issuerBaseURL: process.env.Auth0Issuer,
        audience: process.env.Auth0Audience,
        tokenSigningAlg: 'RS256'
    })
);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
        console.error(err)
        console.error(req.headers);
        res.status(500).send('Something broke!')
    } else {
        next();
    }
})

app.use('/', routes);

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).send();
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).send();
});

export const lambdaHandler = serverless(app);

