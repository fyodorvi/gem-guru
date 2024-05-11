<script lang="ts">
    import {Button, Checkbox, Input, Label, Spinner} from "flowbite-svelte";
    import {field} from "svelte-forms";
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
    const { close } = getContext<Context>('simple-modal');

    export let purchase: CalculatedPurchase|undefined;

    const parseDate = (date: string|undefined) => {
        let dt = date? DateTime.fromISO(date) : DateTime.now();
        return dt.toFormat('yyyy-MM-dd');
    };

    const name = field('name', purchase?.name || '', [required()]);
    const total = field('total', purchase?.total || 0, [required()]);
    const remaining = field('remaining', purchase?.remaining || 0, [required()]);
    const startDate = field('startDate', parseDate(purchase?.startDate), [required()]);
    const expiryDate = field('expiryDate', parseDate(purchase?.expiryDate), [required()]);
    const minimumPayment = field('minimumPayment', purchase?.minimumPayment || 0);

    let submitting = false;

    const onSubmit = async() => {
        submitting = true;
        const newPurchase: Purchase = {
            name: $name.value,
            total: $total.value,
            remaining: $remaining.value,
            expiryDate: $expiryDate.value,
            startDate: $startDate.value,
            minimumPayment: $minimumPayment.value
        }
        let updatedCalculation: Calculation;
        if (purchase) {
            newPurchase.id = purchase.id;
            updatedCalculation = await updatePurchase(newPurchase);
        } else {
            updatedCalculation = await addPurchase(newPurchase)
        }
        submitting = false;
        calculation.update(() => updatedCalculation);
        close();
    }

    let formModalMinimumPayment = purchase?.minimumPayment !== undefined;
</script>

<form class="flex flex-col space-y-6" on:submit|preventDefault={onSubmit}>
    <h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">Add Purchase</h3>
    <Label class="space-y-2">
        <span>Purchase Name</span>
        <Input type="text" name="purchase_name" bind:value={$name.value} />
    </Label>
    <div class="sm:columns-2 space-y-2">
        <Label>
            <span>Total</span>
            <Input let:props>
                <div slot="left">$</div>
                <input type="number" {...props} bind:value={$total.value} />
            </Input>
        </Label>
        <Label>
            <span>Remaining</span>
            <Input let:props>
                <div slot="left">$</div>
                <input type="number" {...props} bind:value={$remaining.value} />
            </Input>
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
            <span><Checkbox bind:checked={formModalMinimumPayment}>Minimum payment</Checkbox></span>
            {#if formModalMinimumPayment}
                <Input let:props class="mt-2">
                    <div slot="left">$</div>
                    <input type="number" {...props} bind:value={$minimumPayment.value} />
                </Input>
            {/if}
        </Label>
        <div>&nbsp;</div>
    </div>
    <Button type="submit" class="w-full1" disabled={submitting}>{#if submitting}<Spinner class="me-3" size="4" color="white" />{/if} {#if purchase}Save{:else}Add{/if}</Button>
</form>