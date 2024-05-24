<script lang="ts">
    import {Button, Spinner} from "flowbite-svelte";
    import {field, form} from "svelte-forms";
    import {min} from "svelte-forms/validators";
    import {
        type CalculatedPurchase,
        type Purchase,
        updatePurchase
    } from "../services/api";
    import type { Context } from 'svelte-simple-modal';
    import {getContext} from "svelte";
    import {calculation} from "../services/store";
    import ValidatedCurrencyInput from "./ValidatedCurrencyInput.svelte";
    const { close } = getContext<Context>('simple-modal');
    import { CloseOutline } from 'flowbite-svelte-icons';
    import {toCents, toCurrencyDisplay} from "../services/format";

    export let purchase: CalculatedPurchase;

    const lessThanRemaining = () => {
        return async (value: number) => {
            return {
                valid: toCents(value) <= purchase.remaining,
                name: 'less_than_remaining'
            }
        }
    }

    const remaining = field('remaining', purchase?.remaining ? purchase?.remaining / 100 : 0, [lessThanRemaining()]);
    const purchaseForm = form(remaining);

    let submitting = false;

    const onSubmit = async() => {
        await purchaseForm.validate();
        if ($purchaseForm.valid) {
            submitting = true;
            const newPurchase: Purchase = {
                name: purchase.name,
                total: purchase.total,
                remaining: toCents($remaining.value),
                expiryDate: purchase.expiryDate,
                startDate: purchase.startDate,
                hasMinimumPayment: purchase.hasMinimumPayment,
                minimumPayment: purchase.minimumPayment
            }
            let updatedCalculation = await updatePurchase(purchase.id, newPurchase);;

            submitting = false;
            calculation.update(() => updatedCalculation);
            close();
        }
    }
</script>

<div class="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 flex justify-between items-center p-4 md:p-5 rounded-t-lg">
    <h3 class="text-xl font-semibold p-0">Update {purchase.name} Remaining</h3>
    <button on:click={() => close()} class="focus:outline-none whitespace-normal m-0.5 rounded-lg focus:ring-2 p-1.5 focus:ring-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 ms-auto">
        <CloseOutline />
    </button>
</div>
<div class="p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
    <form on:submit|preventDefault={onSubmit}>
        <div class="sm:grid sm:grid-cols-2 sm:gap-4">
            <div class="mt-5">
                <ValidatedCurrencyInput
                        title="New Remaining"
                        formStore={purchaseForm}
                        bind:value={$remaining.value}
                        validationMessages={{'remaining.less_than_remaining': `Remaining has to be less than ${toCurrencyDisplay(purchase.remaining)}`}} />
            </div>
        </div>
        <input type="submit" hidden />
    </form>
</div>
<div class="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 p-4 md:p-5 space-x-3 rtl:space-x-reverse rounded-b-lg text-center">
    <Button on:click={() => onSubmit()} type="submit" disabled={submitting}>{#if submitting}<Spinner class="me-3" size="4" color="white" />{/if} Update</Button>
</div>