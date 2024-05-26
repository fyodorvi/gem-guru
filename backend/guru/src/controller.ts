import { Request, Response, Router } from 'express';
import {addPurchase, calculate, getProfile, removePurchase, setProfile, updatePurchase} from "./service";
import {validateBody} from "../middleware/validation";
import {Purchase} from "./models/purchase";
import {ProfileSettings} from "./models/profileSettings";

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

router.get('/profile',  async (req: Request, res: Response) => {
    const userId = _getUserId(req);

    const profileSettings = await getProfile(userId);

    res.status(200).json(profileSettings);
});

router.post('/profile', validateBody(ProfileSettings), async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const profileSettings = req.body;

    await setProfile(userId, profileSettings);

    res.status(200).json();
});


router.post('/purchase/add', validateBody(Purchase), async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const purchase = req.body;

    const calculation = await addPurchase(userId, purchase);

    res.status(200).json(calculation);
});

router.post('/purchase/:id/update', validateBody(Purchase), async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const purchase: Purchase = req.body;
    const purchaseId: string = req.params.id;

    if (!purchaseId) {
        throw new Error('No purchase id provided');
    }

    const calculation = await updatePurchase(userId, purchaseId, purchase);

    res.status(200).json(calculation);
});


router.post('/purchase/:id/delete', async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const purchaseId: string = req.params.id;
    if (!purchaseId) {
        throw new Error('No purchase id provided');
    }
    const purchase: Purchase = req.body;

    const calculation = await removePurchase(userId, req.params.id);

    res.status(200).json(calculation);
});


router.get('/calculate', async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const calculation = await calculate(userId);

    res.status(200).json(calculation);
});


export default router;