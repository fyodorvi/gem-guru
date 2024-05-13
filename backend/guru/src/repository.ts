import {Purchase} from "./models/purchase";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, PutCommand, QueryCommand} from "@aws-sdk/lib-dynamodb";
import {ProfileSettings} from "./models/profileSettings";

const userDataTableName = process.env.UserDataTableName;

const local = process.env.LOCAL === 'true';
let endpoint: string | undefined;

if (local) {
    endpoint = 'http://host.docker.internal:4566';
}

const _getClient = (): DynamoDBDocumentClient => {
    const marshallOptions = {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true
    }
    const unmarshallOptions = {
    }
    const translateConfig = { marshallOptions, unmarshallOptions }
    const client = new DynamoDBClient({
        endpoint
    });
    return DynamoDBDocumentClient.from(client, translateConfig);
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

export const getProfileSettings = async (userId: string): Promise<ProfileSettings> => {
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
    if (result.Items && result.Items[0] && result.Items[0].profileSettings) {
        return result.Items[0].profileSettings;
    } else {
        return {
            paymentDay: 1
        }
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

