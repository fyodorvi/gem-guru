import {useAuth0} from "../services/auth0";
import axios from 'axios';

export interface CalculatedPurchase {
    name: string;
    total: number;
    remaining: number;
    paymentToday: number;
    paymentsTotal: number;
    paymentsDone: number;
    startDate: string;
    expiryDate: string;
    minimumPayment: number | undefined;
}

export interface Calculation {
    totalRemaining: number;
    totalAmountToPay: number;
    purchases: CalculatedPurchase[]
}

export interface Purchase {
    name: string;
    total: number;
    remaining: number;
    startDate: string;
    expiryDate: string;
    minimumPayment: number;
}

async function getHeaders() {
    const { getAccessToken } = useAuth0;
    const token = await getAccessToken({ authorizationParams: { audience: import.meta.env.VITE_API_URL }});
    return {
        Authorization: 'Bearer ' + token
    }
}

async function apiGET(url: string) {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}${url}`, {
        headers: await getHeaders()
    });
    return response.data;
}

async function apiPOST(url: string, body: any) {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/${url}`, body, {
        headers: await getHeaders()
    });
    return response.data;
}

export async function loadCalculation(): Promise<Calculation> {
    return apiGET('/calculation');
}

export async function updatePurchases(purchases: Purchase[]): Promise<Calculation> {
    return apiPOST('/purchases', purchases);
}