import {type Writable, writable} from 'svelte/store';
import type {Calculation} from "./api";

export const calculation: Writable<Calculation> = writable({
    totalRemaining: 0,
    totalNextPayment: 0,
    nextPaymentDate: '',
    purchases: []
});
