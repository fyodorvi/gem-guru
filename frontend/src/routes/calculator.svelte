<script lang="ts">
    import {getContext, onMount} from "svelte";
    import {
        Heading,
        Button,
        Spinner,
        Progressbar,
        Table,
        TableHead,
        TableHeadCell,
        TableBody, TableBodyRow, TableBodyCell
    } from 'flowbite-svelte';
    import { PlusOutline, DotsHorizontalOutline, CalendarMonthOutline, EditOutline } from 'flowbite-svelte-icons';
    import {type CalculatedPurchase, loadCalculation} from "../services/api";
    import type { Context } from 'svelte-simple-modal';
    import PurchaseModal from "../components/PurchaseModal.svelte";
    const { open } = getContext<Context>('simple-modal');
    import { calculation } from '../services/store';
    import Currency from "../components/Currency.svelte";
    import RemainingModal from "../components/RemainingModal.svelte";

    let loading = true;

    const reloadCalculation = async() => {
        const updatedCalculation = await loadCalculation();
        calculation.update(() => updatedCalculation);

        loading = false;
    }

    onMount(async () => {
        await reloadCalculation();
    });

    const editPurchase = async(purchase: CalculatedPurchase) => {
        open(PurchaseModal, { purchase })
    }

    const editPurchaseRemaining = async(purchase: CalculatedPurchase) => {
        open(RemainingModal, { purchase }, { classWindow: 'flex relative max-w-sm w-full max-h-full' })
    }

    const addPurchase = async () => {
        open(PurchaseModal, {})
    }
</script>
{#if !loading}
    <div class="lg:max-w-[50%] sm:max-w-[75%]">
        <Heading tag="h5" class="font-normal mb-5">My Purchases <Button on:click={() => addPurchase()} class="inline-block ml-2 p-2"><PlusOutline /></Button></Heading>
        <ul>
            {#each $calculation.purchases as purchase}
                <li class="p-3 border-b border-l border-r first:border-t first:rounded-t-lg last:rounded-b-lg border-slate-300 sm:flex md:justify-between">
                    <div>
                        <div on:click={() => editPurchase(purchase)} aria-label="Edit" class="cursor-pointer">
                            <Heading tag="h6">
                                {purchase.name} <EditOutline class="inline-block text-gray-500" />
                            </Heading>
                        </div>
                        <div class="mt-3">Total: <span class="font-bold"><Currency value={purchase.total} /></span></div>
                        <div class="mt-1">Remaining: <span class="font-bold"><Currency value={purchase.remaining} /></span> <Button on:click={() => editPurchaseRemaining(purchase)} class="inline-block ml-2 p-1" color="alternative"><DotsHorizontalOutline /></Button></div>
                        <div class="mt-4"><CalendarMonthOutline class="inline-block" /> {new Date(purchase.expiryDate).toLocaleDateString()}</div>
                    </div>
                    <div class="sm:ml-auto w-44 sm:mt-10 mt-4">
                        Payments: {purchase.paymentsDone} out of {purchase.paymentsTotal}
                        <Progressbar progress={Math.floor(purchase.paymentsDone/purchase.paymentsTotal*100)} class="w-32 mt-2" />
                    </div>
                </li>
            {/each}
        </ul>
        <Heading tag="h5" class="font-normal mb-5 mt-10">Payment Breakdown</Heading>
        <p class="mb-5">Calculation breaks down each purchase into equal parts. </p>
        <Table striped={true} class="border mb-5">
            <TableHead class="border-b">
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Payment</TableHeadCell>
                <TableHeadCell>Payments Left</TableHeadCell>
            </TableHead>
            <TableBody tableBodyClass="divide-y">
                {#each $calculation.purchases as purchase}
                <TableBodyRow>
                    <TableBodyCell>{purchase.name}</TableBodyCell>
                    <TableBodyCell><Currency value={purchase.nextPayment} /></TableBodyCell>
                    <TableBodyCell>{purchase.paymentsTotal-purchase.paymentsDone}</TableBodyCell>
                </TableBodyRow>
                {/each}
            </TableBody>
        </Table>
        <div class="text-xl mb-4">Total remaining: <span class="font-bold"><Currency value={$calculation.totalRemaining} /></span></div>
        <div class="text-xl">Amount to pay on {new Date($calculation.nextPaymentDate).toLocaleDateString()}: <span class="font-bold bg-primary-300 p-2 rounded-xl"><Currency value={$calculation.totalNextPayment} /></span></div>
    </div>
{:else}
    <!-- <Skeleton /> -->
    <Spinner />
{/if}