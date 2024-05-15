<script lang="ts">
    import {Button, Checkbox, Helper, Input, Label, Spinner} from "flowbite-svelte";
    import {field, form} from "svelte-forms";
    import {required} from "svelte-forms/validators";
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
    import ValidatedFormElement from "./ValidatedFormElement.svelte";
    import {writable} from "svelte/store";
    import ValidatedInput from "./ValidatedInput.svelte";
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

    const name = field('name', purchase?.name || '', [required()]);
    const total = field('total', purchase?.total ?  purchase?.total / 100 : 0, [required()]);
    const remaining = field('remaining', purchase?.remaining ? purchase?.remaining / 100 : 0, [required()]);
    const startDate = field('startDate', parseDate(purchase?.startDate), [required()]);
    const expiryDate = field('expiryDate', parseDate(purchase?.expiryDate || DateTime.now().plus({month: 6}).toISODate()), [required()]);
    const hasMinimumPayment = field('hasMinimumPayment', purchase?.hasMinimumPayment || false);
    const minimumPayment = field('minimumPayment', purchase?.minimumPayment ? purchase?.minimumPayment / 100 : 0);

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
        <Label>
            <span>Total</span>
            <CurrencyInput bind:value={$total.value}/>
        </Label>
        <Label>
            <span>Remaining</span>
            <CurrencyInput bind:value={$remaining.value}/>
        </Label>
    </div>
    <div class="sm:columns-2 space-y-2">
        <Label>
            <span>Start Date</span>
            <Input type="date" bind:value={$startDate.value} />
        </Label>
        <Label>
            <span>Expiry Date</span>
            <Input type="date" bind:value={$expiryDate.value}  />
        </Label>
    </div>
    <div class="sm:columns-2 space-y-2">
        <Label>
            <span><Checkbox bind:checked={$hasMinimumPayment.value}>Minimum payment</Checkbox></span>
            {#if $hasMinimumPayment.value}
                <div class="mt-2" >
                    <CurrencyInput bind:value={$minimumPayment.value}/>
                </div>
            {/if}
        </Label>
        <div>&nbsp;</div>
    </div>
    <Button type="submit" class="w-full1" disabled={submitting}>{#if submitting}<Spinner class="me-3" size="4" color="white" />{/if} {#if purchase}Save{:else}Add{/if}</Button>
    {#if purchase}<Button class="w-full1" color="red" disabled={deleting}>{#if deleting}<Spinner class="me-3" size="4" color="white" />{/if} Delete</Button>{/if}
</form>