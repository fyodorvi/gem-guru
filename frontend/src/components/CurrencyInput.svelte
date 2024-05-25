<script lang="ts">
import CurrencyInput from "@canutin/svelte-currency-input";
import {onMount} from "svelte";

export let color: string | undefined;
export let value: number;
export let autoFocus: boolean = false;

const name = Math.random().toString();
let inputClasses: string;
const baseClasses = 'block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right p-2.5 text-sm rounded-lg';

onMount(() => {
    if (autoFocus) {
        const el = document.querySelectorAll(`[name="${name}"]+input`);
        if (el.length && el.length === 1) {
            (el[0] as HTMLInputElement).focus();
        }
    }
});

$: inputClasses = color === 'red' ? baseClasses + ' focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500 bg-red-50 text-red-900 placeholder-red-700 dark:text-red-500 dark:placeholder-red-500 dark:bg-gray-700 border-red-500 dark:border-red-400' :
    baseClasses + ' focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600';
</script>
    <CurrencyInput {name} isNegativeAllowed={false} currency="USD" inputClasses={{
    wrapper: "form-control block",
    formatted: inputClasses,
    formattedPositive: '',
    formattedNegative: ''
}} {...$$restProps} bind:value/>