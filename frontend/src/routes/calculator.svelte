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
        TableBody, 
        TableBodyRow, 
        TableBodyCell,
        Label,
        Alert
    } from 'flowbite-svelte';
    import { PlusOutline, DotsHorizontalOutline, CalendarMonthOutline, EditOutline, CheckCircleOutline, ExclamationCircleOutline, PenOutline } from 'flowbite-svelte-icons';
    import {type CalculatedPurchase, loadCalculation, deletePurchase, setProfile} from "../services/api";
    import type { Context } from 'svelte-simple-modal';
    import PurchaseModal from "../components/PurchaseModal.svelte";
    const { open } = getContext<Context>('simple-modal');
    import { calculation } from '../services/store';
    import Currency from "../components/display/Currency.svelte";
    import RemainingModal from "../components/RemainingModal.svelte";
    import FormattedDate from "../components/display/FormattedDate.svelte";
    import PaymentDueDateInput from "../components/input/PaymentDueDateInput.svelte";

    let loading = true;
    let deleting: string | null = null;
    let updatingDueDate = false;
    let paymentDueDate = '';
    let showDueDateEditor = false;
    let tempDueDate = '';

    const reloadCalculation = async() => {
        const updatedCalculation = await loadCalculation();
        calculation.update(() => updatedCalculation);
        
        // Set due date from the calculation
        paymentDueDate = updatedCalculation.nextPaymentDate;

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

    const showDueDateSelector = () => {
        tempDueDate = paymentDueDate;
        showDueDateEditor = true;
    };
    
    const onDueDateConfirm = async (event) => {
        const newDueDate = event.detail;
        if (!newDueDate) return;
        
        updatingDueDate = true;
        try {
            // Store the new due date in profile settings
            await setProfile({ paymentDueDate: newDueDate });
            
            // Reload calculation to get updated values
            await reloadCalculation();
            
            // Hide the editor
            showDueDateEditor = false;
        } finally {
            updatingDueDate = false;
        }
    };
    
    const onDueDateCancel = () => {
        showDueDateEditor = false;
        tempDueDate = paymentDueDate; // Reset temp value
    };

    // Sort purchases: paid-off ($0 remaining) at top
    $: sortedPurchases = $calculation.purchases.slice().sort((a, b) => {
        if (a.remaining === 0 && b.remaining !== 0) return -1;
        if (a.remaining !== 0 && b.remaining === 0) return 1;
        return 0;
    });

    // Check if purchase is paid off
    const isPaidOff = (purchase: CalculatedPurchase) => purchase.remaining === 0;
    
    // Check if due date is in the past
    $: isDueDateInPast = paymentDueDate && new Date(paymentDueDate) < new Date(new Date().toDateString());
</script>

{#if !loading}
    <div class="w-full">
        <!-- Payment Summary Section - Moved to Top -->
        <Heading tag="h5" class="font-normal mb-5">Payment Summary</Heading>
                <div class="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <!-- Warning for Past Due Date -->
            {#if isDueDateInPast}
                <Alert color="yellow" class="mb-4 p-0">
                    <ExclamationCircleOutline slot="icon" class="w-4 h-4" />
                    <span class="font-medium">Due date has passed!</span>
                    <a href="/statement" class="underline font-medium hover:no-underline">Upload</a> a new statement or <span class="underline font-medium hover:no-underline cursor-pointer" on:click={showDueDateSelector}>edit</span> the date.
                </Alert>
            {/if}
            
            {#if $calculation.purchases.length === 0}
                <!-- Empty State -->
                <div class="text-center py-8">
                    <div class="text-gray-500 dark:text-gray-400 mb-4">
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No purchases found</h3>
                        <p class="text-sm mb-4">To start calculating payments, you need to add purchases or upload a statement.</p>
                        <div class="flex justify-center gap-3">
                            <Button on:click={() => addPurchase()} color="primary" size="sm">
                                <PlusOutline class="w-4 h-4 mr-2" />
                                Add Purchase
                            </Button>
                            <Button href="/statement" color="alternative" size="sm">
                                Upload Statement
                            </Button>
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Payment Amount with Clickable Date -->
                <div class="text-xl dark:text-white">
                    Amount to pay on 
                    <button 
                        type="button"
                        on:click={showDueDateSelector}
                        class="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline decoration-dotted transition-colors"
                    >
                        <FormattedDate value={$calculation.nextPaymentDate}/>
                    </button>: 
                    <span class="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-lg text-white">
                        <Currency value={$calculation.totalNextPayment} />
                    </span>
                </div>
                
                <!-- Due Date Editor (Hidden by default) -->
                {#if showDueDateEditor}
                    <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-primary-200 dark:border-primary-700">
                        <Label class="mb-3 block text-sm font-medium">Edit Payment Due Date</Label>
                        <PaymentDueDateInput 
                            bind:value={tempDueDate} 
                            updating={updatingDueDate}
                            on:confirm={onDueDateConfirm}
                            on:cancel={onDueDateCancel}
                        />
                    </div>
                {/if}
                
                <div class="text-lg mt-2 text-gray-600 dark:text-gray-400">
                    Total remaining: <Currency value={$calculation.totalRemaining} />
                </div>
            {/if}
        </div>

        <!-- Purchases Section -->
        {#if sortedPurchases.length > 0}
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
        {/if}
        
        <!-- Payment Breakdown Table -->
        {#if sortedPurchases.length > 0}
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
        {/if}
    </div>
{:else}
    <!-- <Skeleton /> -->
    <Spinner />
{/if}