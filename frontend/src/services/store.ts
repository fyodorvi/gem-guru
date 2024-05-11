import {type Writable, writable} from 'svelte/store';
import type {Calculation} from "./api";

export const calculation: Writable<Calculation> = writable({
    totalRemaining: 0,
    totalAmountToPay: 0,
    purchases: []
});
