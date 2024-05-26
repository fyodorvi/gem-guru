import {useAuth0} from "../services/auth0";
import axios from 'axios';

export interface CalculatedPurchase {
    id: string;
    name: string;
    total: number;
    remaining: number;
    nextPayment: number;
    paymentsTotal: number;
    paymentsDone: number;
    startDate: string;
    expiryDate: string;
    hasMinimumPayment: boolean;
    minimumPayment?: number;
}

export interface Calculation {
    totalRemaining: number;
    totalNextPayment: number;
    nextPaymentDate: string;
    purchases: CalculatedPurchase[]
}

export interface Purchase {
    id?: string;
    name: string;
    total: number;
    remaining: number;
    startDate: string;
    expiryDate: string;
    hasMinimumPayment: boolean;
    minimumPayment?: number;
}

export interface ProfileSettings {
    paymentDay: nubmer;
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

async function apiPOST(url: string, body?: any) {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}${url}`, body, {
        headers: await getHeaders()
    });
    return response.data;
}

export async function loadCalculation(): Promise<Calculation> {
    return apiGET('/calculate');
}

export async function updatePurchase(purchaseId: string, purchase: Purchase): Promise<Calculation> {
    return apiPOST(`/purchase/${purchaseId}/update`, purchase);
}

export async function deletePurchase(purchaseId: string): Promise<Calculation> {
    return apiPOST(`/purchase/${purchaseId}/delete`);
}

export async function addPurchase(purchase: Purchase): Promise<Calculation> {
    return apiPOST('/purchase/add', purchase);
}

export async function setProfile(profileSettings: ProfileSettings): Promise<void> {
    return apiPOST('/profile', profileSettings);
}

export async function getProfile(): Promise<ProfileSettings> {
    return apiGET('/profile');
}