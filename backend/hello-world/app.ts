import express from 'express';
import serverless from 'serverless-http';
import { auth } from 'express-oauth2-jwt-bearer';
import axios from 'axios';

import routes from './routes';

const app = express();

app.use(express.json());

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    axios.get('https://example.com/').then((response) => {
        console.log('Done fetching example.com: ' + response.data.length);
        next();
    }).catch((e) => {
        console.log('Error fetching example.com');
        console.log(e);
        next();
    })
});

app.use(
    auth({
        issuerBaseURL: process.env.Auth0Issuer,
        audience: process.env.Auth0Audience,
        tokenSigningAlg: 'RS256'
    })
);

app.use('/api', routes);

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).send();
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).send();
});

export const lambdaHandler = serverless(app);

