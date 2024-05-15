<script lang="ts">
import CurrencyInput from "@canutin/svelte-currency-input";

export let value: number;
</script>
    <CurrencyInput isNegativeAllowed={false} currency="USD" inputClasses={{
    wrapper: "form-control block",
    formatted: 'block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 text-sm rounded-lg',
    formattedPositive: '',
    formattedNegative: ''
}} {...$$restProps} bind:value/>