import { Purchase } from './models/purchase';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ProfileSettings } from './models/profileSettings';
import { UserData } from './models/userData';

const userDataTableName = process.env.UserDataTableName;

const local = process.env.LOCAL === 'true';
let endpoint: string | undefined;

if (local) {
    endpoint = 'http://127.0.0.1:4566';
}

const _getClient = (): DynamoDBDocumentClient => {
    const marshallOptions = {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {};
    const translateConfig = { marshallOptions, unmarshallOptions };
    const client = new DynamoDBClient({
        endpoint,
    });
    return DynamoDBDocumentClient.from(client, translateConfig);
};

const _loadUserData = async (userId: string): Promise<UserData> => {
    const client = _getClient();

    const command = new QueryCommand({
        TableName: userDataTableName,
        KeyConditionExpression: '#id = :id',
        ExpressionAttributeNames: {
            '#id': 'id',
        },
        ExpressionAttributeValues: {
            ':id': userId,
        },
    });

    const result = await client.send(command);
    if (result.Items && result.Items[0]) {
        if (!result.Items[0].purchases) {
            result.Items[0].purchases = [];
        }
        if (!result.Items[0].profileSettings) {
            // Set default payment due date to the first of next month
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);

            // Set default statement date to 3 weeks before the first of next month
            const statementDate = new Date(nextMonth);
            statementDate.setDate(statementDate.getDate() - 21); // 3 weeks back

            result.Items[0].profileSettings = {
                paymentDueDate: nextMonth.toISOString().split('T')[0] + 'T00:00:00.000Z',
                statementDate: statementDate.toISOString().split('T')[0] + 'T00:00:00.000Z',
            };
        }
        return result.Items[0] as UserData;
    } else {
        // Set default payment due date to the first of next month
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);

        // Set default statement date to 3 weeks before the first of next month
        const statementDate = new Date(nextMonth);
        statementDate.setDate(statementDate.getDate() - 21); // 3 weeks back

        return {
            purchases: [],
            profileSettings: {
                paymentDueDate: nextMonth.toISOString().split('T')[0] + 'T00:00:00.000Z',
                statementDate: statementDate.toISOString().split('T')[0] + 'T00:00:00.000Z',
            },
        };
    }
};

const _saveUserData = async (userId: string, userData: UserData): Promise<void> => {
    const client = _getClient();

    const command = new PutCommand({
        TableName: userDataTableName,
        Item: {
            id: userId,
            ...userData,
        },
    });

    await client.send(command);
};

export const getPurchases = async (userId: string): Promise<Purchase[]> => {
    const userData = await _loadUserData(userId);
    return userData.purchases;
};

export const getProfileSettings = async (userId: string): Promise<ProfileSettings> => {
    const userData = await _loadUserData(userId);
    return userData.profileSettings;
};

export const setProfileSettings = async (userId: string, profileSettings: ProfileSettings): Promise<void> => {
    const userData = await _loadUserData(userId);
    userData.profileSettings = profileSettings;
    await _saveUserData(userId, userData);
};

export const savePurchases = async (userId: string, purchases: Purchase[]) => {
    const userData = await _loadUserData(userId);
    userData.purchases = purchases;
    await _saveUserData(userId, userData);
};
