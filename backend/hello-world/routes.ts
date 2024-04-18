import { Request, Response, Router } from 'express';
import AWS from 'aws-sdk';

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
    const dynamodb = new AWS.DynamoDB({
        endpoint
    });

    const auth = req.auth!;

    const params = {
        TableName: userDataTableName,
        Item: {
            id : { S: auth.payload.sub},
            data: { S:req.body.data}
        }
    };

    await dynamodb.putItem(params).promise();

    res.status(200).json({ message: 'saved' });
});

router.get('/load-data', async (req: Request, res: Response) => {
    const docClient = new AWS.DynamoDB.DocumentClient({
        endpoint
    });

    const auth = req.auth!;

    const params = {
        TableName: userDataTableName,
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames:{
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": auth.payload.sub
        }
    }

    console.log('getting data...');
    const result = await docClient.query(params).promise();
    let loadedData = '';
    if (result.Items) {
        if (result.Items[0]) {
            loadedData = result.Items[0].data;
        }
    }

    res.status(200).json({ data: loadedData });
});


export default router;