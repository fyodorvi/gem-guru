import { Request, Response, Router } from 'express';

const router = Router();

router.get('/hello', async (req: Request, res: Response) => {
    try {
        res.status(200).json({ message: 'double ok' });
    } catch (error) {
        console.error('An error ocurred:', error);
        res.status(500).json(error);
    }
});

export default router;