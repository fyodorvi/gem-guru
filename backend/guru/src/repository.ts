import {Purchase} from "./models/purchase";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, PutCommand, QueryCommand} from "@aws-sdk/lib-dynamodb";

const userDataTableName = process.env.UserDataTableName;

const local = process.env.LOCAL === 'true';
let endpoint: string | undefined;

if (local) {
    endpoint = 'http://host.docker.internal:4566';
}

const _getClient = (): DynamoDBDocumentClient => {
    const client = new DynamoDBClient({
        endpoint
    });
    return DynamoDBDocumentClient.from(client);
}

export const getPurchases = async (userId: string): Promise<Purchase[]> => {
    const client = _getClient();

    const command = new QueryCommand({
        TableName: userDataTableName,
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames:{
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": userId
        }
    });
    const result = await client.send(command);
    if (result.Items && result.Items[0] && result.Items[0].purchases) {
        return result.Items[0].purchases;
    } else {
        return [];
    }
}

export const savePurchases = async(userId: string, purchases: Purchase[]) => {
    const client = _getClient();

    const command = new PutCommand({
        TableName: userDataTableName,
        Item: {
            id : userId,
            purchases: purchases
        }
    })

    await client.send(command);
}

