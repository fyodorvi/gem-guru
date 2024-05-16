<script lang="ts">
    import {Button, Checkbox, Helper, Input, Label, Spinner} from "flowbite-svelte";
    import {field, form} from "svelte-forms";
    import {min, required} from "svelte-forms/validators";
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
    import CurrencyInput from "../components/CurrencyInput.svelte";
    import ValidatedInput from "./ValidatedInput.svelte";
    import ValidatedCurrencyInput from "./ValidatedCurrencyInput.svelte";
    const { close } = getContext<Context>('simple-modal');

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

<form class="flex flex-col space-y-6" on:submit|preventDefault={onSubmit}>
    <h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">Add Purchase</h3>

    <ValidatedInput title="Purchase Name"
                    formStore={purchaseForm}
                    bind:value={$name.value}
                    validationMessages={{'name.required': 'Name is required'}} />

    <div class="sm:columns-2 space-y-2">
        <ValidatedCurrencyInput
                title="Total"
                formStore={purchaseForm}
                bind:value={$total.value}
                validationMessages={{'total.min': 'Total has to be more than 0'}} />

        <ValidatedCurrencyInput
                title="Remaining"
                formStore={purchaseForm}
                bind:value={$remaining.value}
                validationMessages={{'remaining.min': 'Remaining has to be more than 0', 'remaining.less_than_total': 'Remaining has to be less than Total'}} />
    </div>
    <div class="sm:columns-2 space-y-2">
        <ValidatedInput title="Start Date"
                        type="date"
                        formStore={purchaseForm}
                        bind:value={$startDate.value}
                        validationMessages={{'startDate.required': 'Start date is required'}} />
        <ValidatedInput title="Expiry Date"
                        type="date"
                        formStore={purchaseForm}
                        bind:value={$expiryDate.value}
                        validationMessages={{'expiryDate.required': 'Expiry date is required', 'expiryDate.after_start_date': 'Expiry date has to be after Start date'}} />
    </div>
    <div class="sm:columns-2 space-y-2">
        <Label>
            <span><Checkbox bind:checked={$hasMinimumPayment.value}>Minimum payment</Checkbox></span>
            {#if $hasMinimumPayment.value}
                <div class="mt-2" >
                    <ValidatedCurrencyInput
                            formStore={purchaseForm}
                            bind:value={$minimumPayment.value}
                            validationMessages={{'minimumPayment.min': 'Minimum payment has to be more than 0', 'minimumPayment.less_than_total': 'Minimum payment has to be less than total'}} />
                </div>
            {/if}
        </Label>
        <div>&nbsp;</div>
    </div>
    <Button type="submit" class="w-full1" disabled={submitting}>{#if submitting}<Spinner class="me-3" size="4" color="white" />{/if} {#if purchase}Save{:else}Add{/if}</Button>
    {#if purchase}<Button class="w-full1" color="red" disabled={deleting}>{#if deleting}<Spinner class="me-3" size="4" color="white" />{/if} Delete</Button>{/if}
</form>