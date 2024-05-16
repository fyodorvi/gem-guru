<script lang="ts">
    import {Button, Checkbox, Helper, Input, Label, Spinner} from "flowbite-svelte";
    import {field, form} from "svelte-forms";
    import {min, required} from "svelte-forms/validators";
    import {slide} from 'svelte/transition';
    import {
        addPurchase,
        type CalculatedPurchase,
        type Calculation,
        type Purchase,
        updatePurchase
    } from "../services/api";
    import { DateTime } from 'luxon';
    import type { Context } from 'svelte-simple-modal';
    import {getContext} from "svelte";
    import {calculation} from "../services/store";
    import ValidatedInput from "./ValidatedInput.svelte";
    import ValidatedCurrencyInput from "./ValidatedCurrencyInput.svelte";
    const { close } = getContext<Context>('simple-modal');
    import { CloseOutline } from 'flowbite-svelte-icons';

    export let purchase: CalculatedPurchase|undefined;

    const parseDate = (date: string|undefined) => {
        let dt = date? DateTime.fromISO(date) : DateTime.now();
        return dt.toFormat('yyyy-MM-dd');
    };

    const toCents = (amount: number): number => {
        let cents = amount * 100;
        return Math.round(cents);
    }

    const lessThanTotal = () => {
        return async (value: number) => {
            return {
                valid: value <= $total.value,
                name: 'less_than_total'
            }
        }
    }
    const expiryDateAfterStartDate = () => {
        return async (value: string) => {
            return {
                valid: DateTime.fromISO(value).startOf('day') > DateTime.fromISO($startDate.value).startOf('day'),
                name: 'after_start_date'
            }
        }
    }

    const minIfHasMinPayment = () => {
        return async (value: number) => {
            return {
                valid: $hasMinimumPayment.value ? value > 0.01 : true,
                name: 'min'
            }
        }
    }

    const name = field('name', purchase?.name || '', [required()]);
    const total = field('total', purchase?.total ?  purchase?.total / 100 : 0, [min(0.01)]);
    const remaining = field('remaining', purchase?.remaining ? purchase?.remaining / 100 : 0, [min(0.01), lessThanTotal()]);
    const startDate = field('startDate', parseDate(purchase?.startDate), [required()]);
    const expiryDate = field('expiryDate', parseDate(purchase?.expiryDate || DateTime.now().plus({month: 6}).toISODate()), [required(), expiryDateAfterStartDate()]);
    const hasMinimumPayment = field('hasMinimumPayment', purchase?.hasMinimumPayment || false);
    const minimumPayment = field('minimumPayment', purchase?.minimumPayment ? purchase?.minimumPayment / 100 : 0, [minIfHasMinPayment(), lessThanTotal()]);

    const purchaseForm = form(name, total, remaining, startDate, expiryDate, hasMinimumPayment, minimumPayment);

    let submitting = false;
    let deleting = false;

    const onSubmit = async() => {
        await purchaseForm.validate();
        if ($purchaseForm.valid) {
            submitting = true;
            const newPurchase: Purchase = {
                name: $name.value,
                total: toCents($total.value),
                remaining: toCents($remaining.value),
                expiryDate: $expiryDate.value,
                startDate: $startDate.value,
                hasMinimumPayment: $hasMinimumPayment.value,
                minimumPayment: $hasMinimumPayment.value ? toCents($minimumPayment.value) : 0
            }
            let updatedCalculation: Calculation;
            if (purchase) {
                updatedCalculation = await updatePurchase(purchase.id, newPurchase);
            } else {
                updatedCalculation = await addPurchase(newPurchase)
            }
            submitting = false;
            calculation.update(() => updatedCalculation);
            close();
        }
    }
</script>

<div class="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 flex justify-between items-center p-4 md:p-5 rounded-t-lg">
    <h3 class="text-xl font-semibold p-0">{#if purchase}Edit Purchase{:else}Add Purchase{/if}</h3>
    <button on:click={() => close()} class="focus:outline-none whitespace-normal m-0.5 rounded-lg focus:ring-2 p-1.5 focus:ring-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 ms-auto">
        <CloseOutline />
    </button>
</div>
<div class="p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
    <form on:submit|preventDefault={onSubmit}>
        <ValidatedInput title="Purchase Name"
                        formStore={purchaseForm}
                        bind:value={$name.value}
                        validationMessages={{'name.required': 'Name is required'}} />

        <div class="sm:grid sm:grid-cols-2 sm:gap-4">
            <div class="mt-5">
                <ValidatedCurrencyInput
                        title="Total"
                        formStore={purchaseForm}
                        bind:value={$total.value}
                        validationMessages={{'total.min': 'Total has to be more than 0'}} />
            </div>
            <div class="mt-5">
                <ValidatedCurrencyInput
                        title="Remaining"
                        formStore={purchaseForm}
                        bind:value={$remaining.value}
                        validationMessages={{'remaining.min': 'Remaining has to be more than 0', 'remaining.less_than_total': 'Remaining has to be less or equal Total'}} />
            </div>
        </div>
        <div class="sm:grid sm:grid-cols-2 sm:gap-4">
            <div class="mt-5">
                <ValidatedInput title="Start Date"
                                type="date"
                                formStore={purchaseForm}
                                bind:value={$startDate.value}
                                validationMessages={{'startDate.required': 'Start Date is required'}} />
            </div>
            <div class="mt-5">
                <ValidatedInput title="Expiry Date"
                                type="date"
                                formStore={purchaseForm}
                                bind:value={$expiryDate.value}
                                validationMessages={{'expiryDate.required': 'Expiry Date is required', 'expiryDate.after_start_date': 'Expiry Date has to be after Start Date'}} />
            </div>
        </div>
        <div class="sm:grid sm:grid-cols-2 sm:gap-4 mt-5">
            <Label>
                <span><Checkbox bind:checked={$hasMinimumPayment.value}>Minimum payment</Checkbox></span>
                {#if $hasMinimumPayment.value}
                    <div class="mt-2">
                        <div transition:slide={{ duration: 300 }}>
                            <ValidatedCurrencyInput
                                    formStore={purchaseForm}
                                    bind:value={$minimumPayment.value}
                                    validationMessages={{'minimumPayment.min': 'Minimum payment has to be more than 0', 'minimumPayment.less_than_total': 'Minimum payment has to be less or equal Total'}} />
                        </div>
                    </div>
                {/if}
            </Label>
            <div>&nbsp;</div>
        </div>
        <input type="submit" hidden />
    </form>
</div>
<div class="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 p-4 md:p-5 space-x-3 rtl:space-x-reverse rounded-b-lg text-center">
    {#if purchase}<Button class="w-full1" color="red" disabled={deleting}>{#if deleting}<Spinner class="me-3" size="4" color="white" />{/if} Delete</Button>{/if}
    <Button on:click={() => onSubmit()} type="submit" disabled={submitting}>{#if submitting}<Spinner class="me-3" size="4" color="white" />{/if} {#if purchase}Save{:else}Add{/if}</Button>
</div>