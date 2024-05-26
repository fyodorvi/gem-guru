<script lang="ts">
    import {Button, Checkbox, Label, Spinner} from "flowbite-svelte";
    import {field, form} from "svelte-forms";
    import {min, required} from "svelte-forms/validators";
    import {slide, fade} from 'svelte/transition';
    import {
        addPurchase,
        type CalculatedPurchase,
        type Calculation, deletePurchase,
        type Purchase,
        updatePurchase
    } from "../services/api";
    import { DateTime } from 'luxon';
    import type { Context } from 'svelte-simple-modal';
    import {getContext} from "svelte";
    import {calculation} from "../services/store";
    import ValidatedInput from "./input/ValidatedInput.svelte";
    import ValidatedCurrencyInput from "./input/ValidatedCurrencyInput.svelte";
    const { close } = getContext<Context>('simple-modal');
    import ModalHeader from "./modal/ModalHeader.svelte";
    import ModalContent from "./modal/ModalContent.svelte";
    import ModalFooter from "./modal/ModalFooter.svelte";
    import ModalCloseButton from "./modal/ModalCloseButton.svelte";

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

    let deleteConfirmation = false;

    const onDelete = () => {
        deleteConfirmation = true;
    }

    const onDeleteConfirm = async () => {
        deleting = true;

        if (purchase) {
            let updatedCalculation: Calculation;
            updatedCalculation = await deletePurchase(purchase.id);
            calculation.update(() => updatedCalculation);
        }

        close();
        deleting = false;
    }

    const onDeleteCancel = () => {
        deleteConfirmation = false;
    }
</script>

<ModalHeader>
    <h3 class="text-xl font-semibold p-0">{#if purchase}Edit Purchase{:else}Add Purchase{/if}</h3>
    <ModalCloseButton />
</ModalHeader>
<ModalContent>
    <form on:submit|preventDefault={onSubmit}>
        <ValidatedInput title="Purchase Name"
                        autoFocus={true}
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
</ModalContent>
<ModalFooter>
    <div class="grid h-10">
        {#if deleteConfirmation}
        <div transition:fade={{duration: 200}} style="grid-area: 1/1;">
            <span class="pr-2">Are you sure?</span> <Button on:click={() => onDeleteConfirm()} disabled={deleting} class="w-full1" color="red">{#if deleting}<Spinner class="me-3" size="4" color="white" />{/if} Yes, Delete</Button> <Button disabled={deleting} on:click={() => onDeleteCancel()} color="light">Cancel</Button>
        </div>
        {:else}
        <div transition:fade={{duration: 200}} style="grid-area: 1/1;">
            {#if purchase}<Button on:click={() => onDelete()} class="w-full1" color="red">Delete</Button>{/if}
            <Button on:click={() => onSubmit()} type="submit" disabled={submitting}>{#if submitting}<Spinner class="me-3" size="4" color="white" />{/if} {#if purchase}Save{:else}Add{/if}</Button>
        </div>
        {/if}
    </div>
</ModalFooter>