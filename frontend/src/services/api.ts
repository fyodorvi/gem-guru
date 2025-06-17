import {useAuth0} from "../services/auth0";
import axios from 'axios';

export interface CalculatedProjectionMonth {
    date: string;
    amountToPay: number;
}

export interface CalculatedProjection {
    months: CalculatedProjectionMonth[];
}

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
    paymentDueDate: string; // ISO date string
}

export interface ParsedPurchase {
    name: string;
    total: number;
    remaining: number;
    startDate: string;
    expiryDate: string;
    minimumPayment?: number;
    interestFreeMonths?: number;
    paymentType?: 'fixed' | 'monthly' | 'none';
}

export interface NewPurchase extends ParsedPurchase {
    // All details are included from ParsedPurchase
}

export interface UpdatedPurchase {
    id: string;
    name: string;
    oldRemaining: number;
    newRemaining: number;
}

export interface PaidOffPurchase {
    id: string;
    name: string;
    total: number;
    remaining: number;
}

export interface InterimResult {
    newPurchases: NewPurchase[];
    updatedPurchases: UpdatedPurchase[];
    paidOffPurchases: PaidOffPurchase[];
}

export interface StatementParseResult {
    success: boolean;
    error?: string;
    parsedPurchases: ParsedPurchase[];
    extractedSections: string[];
    dueDate?: string; // ISO date string extracted from the statement
    currentDueDate?: string; // Current due date from user profile for comparison
    calculation?: Calculation;
    interimResult?: InterimResult;
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

export async function loadProjection(): Promise<CalculatedProjection> {
    return apiGET('/projection');
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

export async function parseStatement(file: File, preview: boolean = true): Promise<StatementParseResult> {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    const payload = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileData: base64
    };
    
    const url = preview ? '/statement/parse?preview=true' : '/statement/parse';
    return apiPOST(url, payload);
}

export async function confirmStatementChanges(file: File): Promise<StatementParseResult> {
    return parseStatement(file, false);
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

