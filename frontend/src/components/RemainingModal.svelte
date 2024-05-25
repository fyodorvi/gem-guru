<script lang="ts">
    import {Button, Spinner} from "flowbite-svelte";
    import {field, form} from "svelte-forms";
    import {
        type CalculatedPurchase,
        type Purchase,
        updatePurchase
    } from "../services/api";
    import type { Context } from 'svelte-simple-modal';
    import {getContext, onMount} from "svelte";
    import {calculation} from "../services/store";
    import ValidatedCurrencyInput from "./ValidatedCurrencyInput.svelte";
    import {toCents, toCurrencyDisplay} from "../services/format";
    import ModalCloseButton from "./modal/ModalCloseButton.svelte";
    import ModalFooter from "./modal/ModalFooter.svelte";
    import ModalHeader from "./modal/ModalHeader.svelte";

    const { close } = getContext<Context>('simple-modal');
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

<ModalHeader>
    <h3 class="text-xl font-semibold p-0">Update Purchase Remaining</h3>
    <ModalCloseButton />
</ModalHeader>
<div class="p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
    <form on:submit|preventDefault={onSubmit}>
        <ValidatedCurrencyInput
                autoFocus={true}
                title="New Remaining"
                formStore={purchaseForm}
                bind:value={$remaining.value}
                validationMessages={{'remaining.less_than_remaining': `Remaining has to be less than ${toCurrencyDisplay(purchase.remaining)}`}} />
        <input type="submit" hidden />
    </form>
</div>
<ModalFooter>
    <Button on:click={() => onSubmit()} type="submit" disabled={submitting}>{#if submitting}<Spinner class="me-3" size="4" color="white" />{/if} Update</Button>
</ModalFooter>