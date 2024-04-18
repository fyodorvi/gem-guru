import { Request, Response, Router } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { QueryCommand, PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const router = Router();

const userDataTableName = process.env.UserDataTableName;

const local = process.env.LOCAL === 'true';
let endpoint: string | undefined;

if (local) {
    endpoint = 'http://host.docker.internal:4566';
}

router.get('/hello', async (req: Request, res: Response) => {
    try {
        res.status(200).json({ message: 'initialised' });
    } catch (error) {
        console.error('An error ocurred:', error);
        res.status(500).json(error);
    }
});

router.post('/save-data', async (req: Request, res: Response) => {
    const client = new DynamoDBClient({
        endpoint
    });

    const docClient = DynamoDBDocumentClient.from(client);

    const auth = req.auth!;

    const command = new PutCommand({
        TableName: userDataTableName,
        Item: {
            id : auth.payload.sub,
            data: req.body.data
        }
    })

    await docClient.send(command);

    res.status(200).json({ message: 'saved' });
});

router.get('/load-data', async (req: Request, res: Response) => {
    const client = new DynamoDBClient({
        endpoint
    });

    const docClient = DynamoDBDocumentClient.from(client);

    const auth = req.auth!;

    const command = new QueryCommand({
        TableName: userDataTableName,
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames:{
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": auth.payload.sub
        }
    });

    console.log('getting data...');
    const result = await docClient.send(command);
    let loadedData = '';
    if (result.Items) {
        if (result.Items[0]) {
            loadedData = result.Items[0].data;
        }
    }

    res.status(200).json({ data: loadedData });
});


export default router;