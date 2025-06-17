declare namespace Express {
    interface Request {
        auth?: {
            payload?: {
                sub?: string;
            };
        };
    }
}
