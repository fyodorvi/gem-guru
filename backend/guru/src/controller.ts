import { Request, Response, Router } from 'express';
import {addPurchase, calculate, removePurchase, updatePurchase} from "./service";

const router = Router();

const _getUserId = (req: Request): string => {
    const auth = req.auth;
    if (!auth) {
        throw new Error('No auth');
    }
    if (!auth.payload) {
        throw new Error('No auth payload');
    }
    if (!auth.payload.sub) {
        throw new Error('No userid in auth payload');
    }
    return auth.payload.sub;
}

router.post('/purchase/add', async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const purchase = req.body; // TODO: validate

    const calculation = await addPurchase(userId, purchase);

    res.status(200).json(calculation);
});

router.post('/purchase/update', async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const purchase = req.body; // TODO: validate

    const calculation = await updatePurchase(userId, purchase);

    res.status(200).json(calculation);
});


router.post('/purchase/delete', async (req: Request, res: Response) => {
    //TODO: make proper routes
    const userId = _getUserId(req);
    const purchase = req.body; // TODO: validate

    const calculation = await removePurchase(userId, purchase);

    res.status(200).json(calculation);
});


router.get('/calculate', async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const calculation = await calculate(userId);

    res.status(200).json(calculation);
});


export default router;