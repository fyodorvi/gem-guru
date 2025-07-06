// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/express.d.ts" />
import { Request, Response, Router } from 'express';
import {
    addPurchase,
    calculate,
    calculateProjection,
    getProfile,
    parseAndUpsertStatementPurchases,
    parseStatementPreview,
    removePaidOffPurchases,
    removePurchase,
    setProfile,
    updatePurchase,
} from './service';
import { validateBody } from '../middleware/validation';
import { Purchase } from './models/purchase';
import { ProfileSettings } from './models/profileSettings';
import { StatementRequest } from './models/statementRequest';

const router = Router();

const _getUserId = (req: Request): string => {
    const auth = (req as any).auth;
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
};

router.get('/profile', async (req: Request, res: Response) => {
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

    const calculation = await removePurchase(userId, req.params.id);

    res.status(200).json(calculation);
});

router.get('/calculate', async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const calculation = await calculate(userId);

    res.status(200).json(calculation);
});

router.get('/projection', async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const projection = await calculateProjection(userId);

    res.status(200).json(projection);
});

router.post('/statement/parse', validateBody(StatementRequest), async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const statementRequest: StatementRequest = req.body;

    // Validate file type
    if (statementRequest.mimeType !== 'application/pdf') {
        return res.status(400).json({
            success: false,
            error: 'Only PDF files are allowed',
        });
    }

    // Validate file size (10MB limit)
    if (statementRequest.fileSize > 10 * 1024 * 1024) {
        return res.status(400).json({
            success: false,
            error: 'File size exceeds 10MB limit',
        });
    }

    try {
        // Convert base64 to Buffer
        const pdfBuffer = Buffer.from(statementRequest.fileData, 'base64');

        // Check if this is a preview or confirmation
        const isPreview = req.query.preview === 'true';

        if (isPreview) {
            // Return interim results without applying changes
            const result = await parseStatementPreview(userId, pdfBuffer);
            res.status(200).json(result);
        } else {
            // Apply changes and return full result
            const result = await parseAndUpsertStatementPurchases(userId, pdfBuffer);
            res.status(200).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to process statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
            parsedPurchases: [],
            extractedSections: [],
        });
    }
});

router.post('/purchase/remove-paid-off', async (req: Request, res: Response) => {
    const userId = _getUserId(req);
    const { purchaseIds }: { purchaseIds: string[] } = req.body;

    if (!purchaseIds || !Array.isArray(purchaseIds) || purchaseIds.length === 0) {
        return res.status(400).json({
            error: 'purchaseIds array is required and must not be empty',
        });
    }

    try {
        const calculation = await removePaidOffPurchases(userId, purchaseIds);
        res.status(200).json(calculation);
    } catch (error) {
        res.status(500).json({
            error: `Failed to remove paid-off purchases: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
    }
});

export default router;
