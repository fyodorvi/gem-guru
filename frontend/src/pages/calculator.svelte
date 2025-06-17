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
        Alert,
        Select,
        Checkbox
    } from 'flowbite-svelte';
    import { PlusOutline, CalendarMonthOutline, EditOutline, CheckCircleOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
    import {type CalculatedPurchase, loadCalculation, deletePurchase, setProfile} from "../services/api";
    import type { Context } from 'svelte-simple-modal';
    import PurchaseModal from "../components/PurchaseModal.svelte";
    const { open } = getContext<Context>('simple-modal');
    import { calculation } from '../services/store';
    import Currency from "../components/display/Currency.svelte";
    import RemainingModal from "../components/RemainingModal.svelte";
    import FormattedDate from "../components/display/FormattedDate.svelte";
    import PaymentDueDateInput from "../components/input/PaymentDueDateInput.svelte";
    import { toDateDisplay } from "../services/format";

    let loading = true;
    let deleting: string | null = null;
    let updatingDueDate = false;
    let paymentDueDate = '';
    let statementDate = '';
    let showDueDateEditor = false;
    let showStatementDateEditor = false;
    let tempDueDate = '';
    let tempStatementDate = '';

    // Sorting and filtering state
    let sortBy = 'startDate';
    let sortDirection = 'desc'; // desc for most recent first by default
    let showPaidOff = false;

    // Sorting options for dropdown
    const sortOptions = [
        { value: 'startDate_desc', name: 'Start Date (Newest)' },
        { value: 'startDate_asc', name: 'Start Date (Oldest)' },
        { value: 'expiryDate_desc', name: 'End Date (Latest)' },
        { value: 'expiryDate_asc', name: 'End Date (Earliest)' },
        { value: 'total_desc', name: 'Total (Highest)' },
        { value: 'total_asc', name: 'Total (Lowest)' },
        { value: 'remaining_desc', name: 'Remaining (Highest)' },
        { value: 'remaining_asc', name: 'Remaining (Lowest)' },
        { value: 'name_asc', name: 'Name (A-Z)' },
        { value: 'name_desc', name: 'Name (Z-A)' }
    ];
    
    let selectedSortOption = 'startDate_desc'; // Default to newest first

    // Function to sort purchases
    const sortPurchases = (purchases, sortKey, direction) => {
        return purchases.slice().sort((a, b) => {
            let aVal, bVal;
            
            switch (sortKey) {
                case 'startDate':
                case 'expiryDate':
                    aVal = new Date(a[sortKey]);
                    bVal = new Date(b[sortKey]);
                    break;
                case 'name':
                    aVal = a[sortKey].toLowerCase();
                    bVal = b[sortKey].toLowerCase();
                    break;
                case 'total':
                case 'remaining':
                    aVal = a[sortKey];
                    bVal = b[sortKey];
                    break;
                default:
                    return 0;
            }
            
            if (direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    };

    // Handle sort option change
    const handleSortChange = (event) => {
        const [key, dir] = event.target.value.split('_');
        sortBy = key;
        sortDirection = dir;
        selectedSortOption = event.target.value;
    };

    const reloadCalculation = async() => {
        const updatedCalculation = await loadCalculation();
        calculation.update(() => updatedCalculation);
        
        // Set due date and statement date from the calculation
        paymentDueDate = updatedCalculation.nextPaymentDate;
        statementDate = updatedCalculation.statementDate;

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
    
    const showStatementDateSelector = () => {
        tempStatementDate = statementDate;
        showStatementDateEditor = true;
    };
    
    const onDueDateConfirm = async (event) => {
        const newDueDate = event.detail;
        if (!newDueDate) return;
        
        updatingDueDate = true;
        try {
            // Calculate the day difference to adjust statement date proportionally
            let newStatementDate = statementDate;
            if (statementDate) {
                const oldDueDate = new Date(paymentDueDate);
                const newDueDateObj = new Date(newDueDate);
                const dayDifference = Math.floor((newDueDateObj.getTime() - oldDueDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (dayDifference !== 0) {
                    const oldStatementDate = new Date(statementDate);
                    oldStatementDate.setDate(oldStatementDate.getDate() + dayDifference);
                    newStatementDate = oldStatementDate.toISOString();
                }
            }
            
            // Store the new due date and adjusted statement date in profile settings
            await setProfile({ 
                paymentDueDate: newDueDate,
                statementDate: newStatementDate
            });
            
            // Reload calculation to get updated values
            await reloadCalculation();
            
            // Hide the editor
            showDueDateEditor = false;
        } finally {
            updatingDueDate = false;
        }
    };
    
    const onStatementDateConfirm = async (event) => {
        const newStatementDate = event.detail;
        if (!newStatementDate) return;
        
        updatingDueDate = true;
        try {
            // Store the new statement date in profile settings
            await setProfile({ 
                paymentDueDate: paymentDueDate,
                statementDate: newStatementDate
            });
            
            // Reload calculation to get updated values
            await reloadCalculation();
            
            // Hide the editor
            showStatementDateEditor = false;
        } finally {
            updatingDueDate = false;
        }
    };
    
    const onDueDateCancel = () => {
        showDueDateEditor = false;
        tempDueDate = paymentDueDate; // Reset temp value
    };
    
    const onStatementDateCancel = () => {
        showStatementDateEditor = false;
        tempStatementDate = statementDate; // Reset temp value
    };

    // Check if purchase is paid off
    const isPaidOff = (purchase: CalculatedPurchase) => purchase.remaining === 0;
    
    // Check if purchase is a "future purchase" (started after the statement date)
    const isFuturePurchase = (purchase: CalculatedPurchase) => {
        if (!statementDate) return false;
        const startDate = new Date(purchase.startDate);
        const statementDateObj = new Date(statementDate);
        return startDate > statementDateObj;
    };
    
    // Check if due date is in the past
    $: isDueDateInPast = paymentDueDate && new Date(paymentDueDate) < new Date(new Date().toDateString());
    
    // Check if statement date is after due date (invalid configuration)
    $: isStatementDateAfterDueDate = statementDate && paymentDueDate && new Date(statementDate) >= new Date(paymentDueDate);

    // Apply sorting and filtering
    $: sortedPurchases = (() => {
        let filtered = $calculation.purchases;
        
        // Apply paid off filter
        if (!showPaidOff) {
            filtered = filtered.filter(p => !isPaidOff(p));
        }
        
        // Apply sorting
        return sortPurchases(filtered, sortBy, sortDirection);
    })();

    // Split purchases into current and future purchases
    $: currentPurchases = sortedPurchases.filter(p => !isFuturePurchase(p));
    $: futurePurchases = sortedPurchases.filter(p => isFuturePurchase(p));
    
    // Calculate totals excluding future purchases (use all purchases for totals, not just filtered ones)
    $: adjustedTotalNextPayment = $calculation.purchases.filter(p => !isFuturePurchase(p)).reduce((sum, p) => sum + (isPaidOff(p) ? 0 : p.nextPayment), 0);
    $: adjustedTotalRemaining = $calculation.purchases.filter(p => !isFuturePurchase(p)).reduce((sum, p) => sum + p.remaining, 0);
</script>

{#if !loading}
    <div class="w-full">
        <!-- Payment Summary Section - Moved to Top -->
        {#if $calculation.purchases.length !== 0}
        <Heading tag="h5" class="font-normal mb-5">Payment Summary</Heading>
                <div class="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <!-- Warning for Past Due Date -->
                {#if isDueDateInPast}
                    <Alert color="yellow" class="mb-5 p-0">
                        <ExclamationCircleOutline slot="icon" class="w-4 h-4" />
                        <span class="font-medium">Due date has passed!</span>
                        <a href="/statement" class="underline font-medium hover:no-underline">Upload</a> a new statement or <span class="underline font-medium hover:no-underline cursor-pointer" on:click={showDueDateSelector}>edit</span> the date.
                    </Alert>
                {/if}

                <!-- Warning for Statement Date After Due Date -->
                {#if isStatementDateAfterDueDate}
                    <Alert color="red" class="mb-5 p-0">
                        <ExclamationCircleOutline slot="icon" class="w-4 h-4" />
                        <span class="font-medium">Invalid date configuration!</span>
                        Statement date cannot be after due date. Please adjust the dates.
                    </Alert>
                {/if}

                <!-- Future Purchases Warning -->
                {#if futurePurchases.length > 0}
                                         <Alert color="blue" class="mb-5 p-0">
                         <ExclamationCircleOutline slot="icon" class="w-4 h-4" />
                         <span class="font-medium">{futurePurchases.length} purchase{futurePurchases.length > 1 ? 's' : ''} not included in payment calculation</span><br />
                         <span class="text-sm">{futurePurchases.length > 1 ? 'These purchases' : 'This purchase'} started after your last statement date and will be included in future billing cycle.</span>
                     </Alert>
                {/if}

                <!-- Payment Amount with Clickable Date -->
                <div class="text-xl dark:text-white">
                    Amount to pay by
                    <button 
                        type="button"
                        on:click={showDueDateSelector}
                        class="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline decoration-dotted transition-colors"
                    >
                        <FormattedDate value={$calculation.nextPaymentDate}/>
                    </button>: 
                    <span class="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-lg text-white">
                        <Currency value={adjustedTotalNextPayment} />
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

                <!-- Statement Date Display -->
                <div class="text-md mt-3 text-gray-500 dark:text-gray-400">
                    Last statement date: 
                    <button 
                        type="button"
                        on:click={showStatementDateSelector}
                        class="inline-flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-100 underline decoration-dotted transition-colors"
                    >
                        <FormattedDate value={statementDate}/>
                    </button>
                </div>
                
                <!-- Statement Date Editor (Hidden by default) -->
                {#if showStatementDateEditor}
                    <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                        <Label class="mb-3 block text-sm font-medium">Edit Statement Date</Label>
                        <PaymentDueDateInput 
                            bind:value={tempStatementDate} 
                            updating={updatingDueDate}
                            on:confirm={onStatementDateConfirm}
                            on:cancel={onStatementDateCancel}
                        />
                    </div>
                {/if}
                
                <div class="text-md mt-2 text-gray-600 dark:text-gray-400">
                    Total remaining: <Currency value={adjustedTotalRemaining} />
                </div>
        </div>
        {/if}
        <!-- Purchases Section -->
        {#if $calculation.purchases.length > 0}
        <Heading tag="h5" class="font-normal mb-5">My Purchases <Button on:click={() => addPurchase()} class="inline-block ml-2 p-2"><PlusOutline /></Button></Heading>
        
        <!-- Sorting and Filtering Controls -->
        <div class="mb-5 flex flex-wrap gap-4 items-center">
            <div class="flex items-center gap-2">
                <Label for="sort-select" class="text-sm font-medium">Sort by:</Label>
                <Select 
                    id="sort-select"
                    bind:value={selectedSortOption}
                    on:change={handleSortChange}
                    class="w-48"
                    size="sm"
                >
                    {#each sortOptions as option}
                        <option value={option.value}>{option.name}</option>
                    {/each}
                </Select>
            </div>
            
            <div class="flex items-center gap-2">
                <Checkbox 
                    bind:checked={showPaidOff}
                    class="text-primary-600"
                >
                    Show Paid Off
                </Checkbox>
            </div>
                 </div>
        
        {#if sortedPurchases.length > 0}
        <ul>
            {#each sortedPurchases as purchase}
                <li class="p-3 border-b border-l border-r first:border-t first:rounded-t-lg last:rounded-b-lg border-slate-300 sm:flex md:justify-between {isPaidOff(purchase) ? 'bg-green-50 dark:bg-green-900/20' : ''}">
                    <div>
                        <div on:click={() => editPurchase(purchase)} aria-label="Edit" class="cursor-pointer">
                            <Heading tag="h6" class="flex items-center gap-2 font-normal">
                                {purchase.name} 
                                {#if isPaidOff(purchase)}
                                    <CheckCircleOutline class="text-green-600 dark:text-green-400" />
                                    <span class="text-green-600 dark:text-green-400 text-xs">Paid off</span>
                                {:else}
                                    <EditOutline class="inline-block" />
                                {/if}
                            </Heading>
                        </div>
                        <div class="mt-3">Total: <span><Currency value={purchase.total} /></span></div>
                        <div class="mt-1">
                            Remaining:
                            {#if !isPaidOff(purchase)}
                                <span on:click={() => editPurchaseRemaining(purchase)}><Currency underline={true} value={purchase.remaining} /></span>
                            {:else}
                                <Currency value={purchase.remaining} />
                            {/if}
                        </div>
                        <div class="mt-4"><CalendarMonthOutline class="inline-block mt-[-5px]" /> {toDateDisplay(purchase.startDate)} - {toDateDisplay(purchase.expiryDate)}</div>
                    </div>
                        <div class="sm:ml-auto sm:mt-10 mt-4">
                            {#if isPaidOff(purchase)}
                                <div class="text-right">
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
                            {:else if isFuturePurchase(purchase)}
                                <div class="text-center">
                                    <Alert color="yellow" class="p-2 text-xs bg-[#2557D6]">
                                        <ExclamationCircleOutline slot="icon" class="w-3 h-3" />
                                        <span class="font-medium">No payment needed yet</span>
                                    </Alert>
                                </div>
                            {:else}
                                <div class="text-left">
                                {#if purchase.paymentsTotal - purchase.paymentsDone === 1}
                                    1 payment left
                                {:else}
                                    {purchase.paymentsTotal - purchase.paymentsDone} payments left
                                {/if}
                                <Progressbar progress={Math.floor(purchase.paymentsDone/purchase.paymentsTotal*100)} class="w-full mt-2 inline-block" />
                                </div>
                            {/if}
                        </div>
                </li>
            {/each}
        </ul>
        {:else}
        <div class="text-center py-16">
            <div class="text-gray-400 dark:text-gray-500 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
            </div>
            {#if !showPaidOff}
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No active purchases found</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6">Check "Show Paid Off" to see all purchases, or add a new purchase to get started.</p>
            {:else}
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No purchases found</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6">Add your first purchase to start calculating payment breakdowns.</p>
            {/if}
            <button 
                on:click={addPurchase}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
                Add Purchase
            </button>
        </div>
        {/if}
        {:else}
        <!-- No purchases at all empty state -->
        <div class="text-center py-16">
            <div class="text-gray-400 dark:text-gray-500 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No purchases yet</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Add your first purchase to start calculating payment breakdowns and projections.</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                    on:click={addPurchase}
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                    Add Purchase
                </button>
                <a href="/statement" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
                    Upload Statement
                </a>
            </div>
        </div>
        {/if}
        
        <!-- Payment Breakdown Table -->
        {#if currentPurchases.length > 0}
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
                        {#each currentPurchases as purchase}
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
            
            {#if futurePurchases.length > 0}
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <strong>Note:</strong> {futurePurchases.length} purchase{futurePurchases.length > 1 ? 's are' : ' is'} excluded from this breakdown because 
                    {futurePurchases.length > 1 ? 'they started' : 'it started'} after your payment due date.
                </p>
            {/if}
        {/if}
    </div>
{:else}
    <!-- <Skeleton /> -->
    <Spinner />
{/if}