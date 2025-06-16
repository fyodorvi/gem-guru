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
    import { PlusOutline, DotsHorizontalOutline, CalendarMonthOutline, EditOutline, CheckCircleOutline, TrashBinOutline } from 'flowbite-svelte-icons';
    import {type CalculatedPurchase, loadCalculation, deletePurchase} from "../services/api";
    import type { Context } from 'svelte-simple-modal';
    import PurchaseModal from "../components/PurchaseModal.svelte";
    const { open } = getContext<Context>('simple-modal');
    import { calculation } from '../services/store';
    import Currency from "../components/display/Currency.svelte";
    import RemainingModal from "../components/RemainingModal.svelte";
    import FormattedDate from "../components/display/FormattedDate.svelte";

    let loading = true;
    let deleting: string | null = null;

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

    const deletePaidOffPurchase = async (purchase: CalculatedPurchase) => {
        deleting = purchase.id;
        try {
            const updatedCalculation = await deletePurchase(purchase.id);
            calculation.update(() => updatedCalculation);
        } finally {
            deleting = null;
        }
    }

    // Sort purchases: paid-off ($0 remaining) at top
    $: sortedPurchases = $calculation.purchases.slice().sort((a, b) => {
        if (a.remaining === 0 && b.remaining !== 0) return -1;
        if (a.remaining !== 0 && b.remaining === 0) return 1;
        return 0;
    });

    // Check if purchase is paid off
    const isPaidOff = (purchase: CalculatedPurchase) => purchase.remaining === 0;
</script>
{#if !loading}
    <div class="w-full">
        <Heading tag="h5" class="font-normal mb-5">My Purchases <Button on:click={() => addPurchase()} class="inline-block ml-2 p-2"><PlusOutline /></Button></Heading>
        <ul>
            {#each sortedPurchases as purchase}
                <li class="p-3 border-b border-l border-r first:border-t first:rounded-t-lg last:rounded-b-lg border-slate-300 sm:flex md:justify-between {isPaidOff(purchase) ? 'bg-green-50 dark:bg-green-900/20' : ''}">
                    <div>
                        <div on:click={() => editPurchase(purchase)} aria-label="Edit" class="cursor-pointer">
                            <Heading tag="h6" class="flex items-center gap-2">
                                {purchase.name} 
                                {#if isPaidOff(purchase)}
                                    <CheckCircleOutline class="text-green-600 dark:text-green-400" />
                                    <span class="text-green-600 dark:text-green-400 text-xs">Paid off</span>
                                {:else}
                                    <EditOutline class="inline-block" />
                                {/if}
                            </Heading>
                        </div>
                        <div class="mt-3">Total: <span class="font-bold"><Currency value={purchase.total} /></span></div>
                        <div class="mt-1">
                            Remaining: <Currency value={purchase.remaining} />
                            {#if !isPaidOff(purchase)}
                                <Button on:click={() => editPurchaseRemaining(purchase)} class="inline-block ml-2 p-1" color="alternative"><DotsHorizontalOutline /></Button>
                            {/if}
                        </div>
                        <div class="mt-4"><CalendarMonthOutline class="inline-block" /> {new Date(purchase.expiryDate).toLocaleDateString()}</div>
                    </div>
                        <div class="sm:ml-auto w-44 sm:mt-10 mt-4">
                            {#if isPaidOff(purchase)}
                                <div class="text-right pr-10">
                                <Button
                                        on:click={() => deletePaidOffPurchase(purchase)}
                                        disabled={deleting === purchase.id}
                                        color="red"
                                        size="md"
                                >
                                    {#if deleting === purchase.id}
                                        <Spinner class="w-3 h-3" />
                                    {:else}
                                        Delete
                                    {/if}
                                </Button>
                                </div>
                            {:else}
                                Payments: {purchase.paymentsDone} out of {purchase.paymentsTotal}
                                <Progressbar progress={Math.floor(purchase.paymentsDone/purchase.paymentsTotal*100)} class="w-32 mt-2" />
                            {/if}
                        </div>
                </li>
            {/each}
        </ul>
        <Heading tag="h5" class="font-normal mb-5 mt-10">Payment Breakdown</Heading>
        <p class="mb-5">Calculation breaks down each purchase into equal parts. </p>
        <div class="w-full overflow-x-auto">
            <Table striped={true} class="border mb-5 w-full">
                <TableHead class="border-b">
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Payment</TableHeadCell>
                    <TableHeadCell>Payments Left</TableHeadCell>
                </TableHead>
                <TableBody tableBodyClass="divide-y">
                    {#each sortedPurchases as purchase}
                    <TableBodyRow class="{isPaidOff(purchase) ? 'bg-green-50 dark:bg-green-900/20' : ''}">
                        <TableBodyCell class="{isPaidOff(purchase) ? 'bg-green-200 dark:bg-green-800 flex items-center gap-2' : 'flex items-center gap-2'}">
                            {purchase.name}
                            {#if isPaidOff(purchase)}
                                <CheckCircleOutline class="w-4 h-4 text-green-600 dark:text-green-400" />
                            {/if}
                        </TableBodyCell>
                        <TableBodyCell class="{isPaidOff(purchase) ? 'bg-green-200 dark:bg-green-800' : ''}">
                            {#if !isPaidOff(purchase)}
                                <Currency value={purchase.nextPayment} />
                            {/if}
                        </TableBodyCell>
                        <TableBodyCell class="{isPaidOff(purchase) ? 'bg-green-200 dark:bg-green-800' : ''}">
                            {#if !isPaidOff(purchase)}
                                {purchase.paymentsTotal-purchase.paymentsDone}
                            {/if}
                        </TableBodyCell>
                    </TableBodyRow>
                    {/each}
                </TableBody>
            </Table>
        </div>
        <div class="text-xl mb-4">Total remaining: <span class="font-bold"><Currency value={$calculation.totalRemaining} /></span></div>
        <div class="text-xl">Amount to pay on <span class="font-bold"><FormattedDate value={$calculation.nextPaymentDate}/></span>: <span class="font-bold bg-primary-300 p-2 rounded-xl dark:text-black"><Currency value={$calculation.totalNextPayment} /></span></div>
    </div>
{:else}
    <!-- <Skeleton /> -->
    <Spinner />
{/if}