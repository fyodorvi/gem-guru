import {Purchase} from "./models/purchase";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, PutCommand, QueryCommand} from "@aws-sdk/lib-dynamodb";
import {ProfileSettings} from "./models/profileSettings";
import {UserData} from "./models/userData";

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

const _loadUserData = async(userId: string): Promise<UserData> => {
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
    if (result.Items && result.Items[0]) {
        if (!result.Items[0].purchases) {
            result.Items[0].purchases = []
        }
        if (!result.Items[0].profileSettings) {
            result.Items[0].profileSettings = {
                paymentDay: 1
            }
        }
        return result.Items[0] as UserData;
    } else {
        return {
            purchases: [],
            profileSettings: {
                paymentDay: 1
            }
        }
    }
}

const _saveUserData = async(userId: string, userData: UserData): Promise<void> => {
    const client = _getClient();

    const command = new PutCommand({
        TableName: userDataTableName,
        Item: {
            id : userId,
            ...userData
        }
    })

    await client.send(command);
}

export const getPurchases = async (userId: string): Promise<Purchase[]> => {
    const userData = await _loadUserData(userId)
    return userData.purchases;
}

export const getProfileSettings = async (userId: string): Promise<ProfileSettings> => {
    const userData = await _loadUserData(userId);
    return userData.profileSettings;
}

export const setProfileSettings = async (userId: string, profileSettings: ProfileSettings): Promise<void> => {
    const userData = await _loadUserData(userId);
    userData.profileSettings = profileSettings;
    await _saveUserData(userId, userData);
}

export const savePurchases = async(userId: string, purchases: Purchase[]) => {
    const userData = await _loadUserData(userId);
    userData.purchases = purchases;
    await _saveUserData(userId, userData);
}

