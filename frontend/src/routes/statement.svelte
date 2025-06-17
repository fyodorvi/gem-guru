<script lang="ts">
    import { onMount } from "svelte";
    import {
        Heading,
        Button,
        Spinner,
        Alert,
        Fileupload,
        Card,
        Table,
        TableHead,
        TableHeadCell,
        TableBody, 
        TableBodyRow, 
        TableBodyCell,
        Badge
    } from 'flowbite-svelte';
    import { UploadOutline, CheckCircleOutline, ArrowRightOutline } from 'flowbite-svelte-icons';
    import { parseStatement, confirmStatementChanges, type StatementParseResult } from "../services/api";
    import Currency from "../components/display/Currency.svelte";
    import FormattedDate from "../components/display/FormattedDate.svelte";
    import { calculation } from '../services/store';

    let selectedFile: File | null = null;
    let uploading = false;
    let confirming = false;
    let parseResult: StatementParseResult | null = null;
    let error: string | null = null;

    const handleFileSelect = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            selectedFile = target.files[0];
            // Reset previous results
            parseResult = null;
            error = null;
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            error = "Please select a PDF file first";
            return;
        }

        uploading = true;
        error = null;
        parseResult = null;

        try {
            // Parse in preview mode first
            const result = await parseStatement(selectedFile, true);
            parseResult = result;
        } catch (err) {
            error = err instanceof Error ? err.message : 'An error occurred while processing the statement';
        } finally {
            uploading = false;
        }
    };

    const handleConfirm = async () => {
        if (!selectedFile) {
            error = "No file selected";
            return;
        }

        confirming = true;
        error = null;

        try {
            const result = await confirmStatementChanges(selectedFile);
            parseResult = result;
            
            if (result.success && result.calculation) {
                // Update the store with new calculation
                calculation.update(() => result.calculation!);
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'An error occurred while confirming changes';
        } finally {
            confirming = false;
        }
    };

    const handleTryDifferentFile = () => {
        selectedFile = null;
        parseResult = null;
        error = null;
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Function to detect if there are any actual changes
    const hasChanges = (result: StatementParseResult): boolean => {
        if (!result.interimResult) return false;
        
        const { newPurchases, updatedPurchases, paidOffPurchases } = result.interimResult;
        
        // Check for new purchases
        if (newPurchases.length > 0) return true;
        
        // Check for paid off purchases
        if (paidOffPurchases.length > 0) return true;
        
        // Check for actual changes in updated purchases (not just same values)
        const hasActualUpdates = updatedPurchases.some(purchase => 
            purchase.oldRemaining !== purchase.newRemaining
        );
        if (hasActualUpdates) return true;
        
        // Check for due date changes
        if (result.dueDate && result.currentDueDate) {
            // Compare dates but ignore time - extract just the date part (YYYY-MM-DD)
            const newDueDate = new Date(result.dueDate).toISOString().split('T')[0];
            const currentDueDate = new Date(result.currentDueDate).toISOString().split('T')[0];
            if (newDueDate !== currentDueDate) return true;
        }
        
        return false;
    };
</script>

<div class="w-full">
    <Heading tag="h5" class="font-normal mb-5">Statement Parser</Heading>
    
    {#if !parseResult && !error}
        <!-- Initial upload section - only show when no results -->
        <p class="mb-5 text-gray-600 dark:text-gray-400">
            Gem Guru does not store or keep your statements.
        </p>

        <Card class="mb-6 w-full" style="max-width: none;">
            <div class="space-y-4">
                <Fileupload 
                    on:change={handleFileSelect}
                    accept=".pdf"
                    class="mb-4"
                >
                    <UploadOutline class="mb-2 w-10 h-10 text-gray-400" />
                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span class="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">PDF files only (MAX. 10MB)</p>
                </Fileupload>

                <Button 
                    on:click={handleUpload} 
                    disabled={!selectedFile || uploading}
                    class="w-full"
                >
                    {#if uploading}
                        <Spinner class="me-3" size="4" color="white" />
                        Processing...
                    {:else}
                        <UploadOutline class="me-2" />
                        Preview Changes
                    {/if}
                </Button>
            </div>
        </Card>
    {:else}
        <!-- Results section with "Try Different File" button -->
        <div class="flex items-center justify-between mb-5 w-full">
            <p class="text-gray-600 dark:text-gray-400">
                {#if selectedFile}
                    Processing: <span class="font-medium">{selectedFile.name}</span>
                {:else}
                    Statement processing results
                {/if}
            </p>
            <Button 
                on:click={handleTryDifferentFile}
                color="alternative"
                size="sm"
            >
                Try Different File
            </Button>
        </div>
    {/if}

    {#if error}
        <Alert color="red" class="mb-6 w-full">
            <span class="font-medium">Error:</span> {error}
        </Alert>
    {/if}

    {#if parseResult}
        {#if parseResult.success && parseResult.interimResult}
            <!-- Check if there are any changes -->
            {#if !hasChanges(parseResult)}
                <!-- No Changes Detected -->
                <Alert color="yellow" class="mb-6 w-full">
                    <CheckCircleOutline slot="icon" class="w-4 h-4" />
                    <span class="font-medium">No Changes Detected</span> - Your purchases and due date are already up to date with this statement.
                </Alert>
            {:else}
                <!-- Interim Results Display -->
                <Alert color="blue" class="mb-6 w-full">
                    <CheckCircleOutline slot="icon" class="w-4 h-4" />
                    <span class="font-medium">Preview Ready!</span> Review the changes below and click Confirm to apply them.
                </Alert>
            {/if}

            <!-- Due Date Display -->
            {#if parseResult.dueDate && hasChanges(parseResult)}
                <Alert color="green" class="mb-6 w-full">
                    <CheckCircleOutline slot="icon" class="w-4 h-4" />
                    <span class="font-medium">Next Payment Due Date:</span> 
                    <FormattedDate value={parseResult.dueDate} />
                </Alert>
            {/if}

            <!-- New Purchases -->
            {#if parseResult.interimResult.newPurchases.length > 0}
                <Card class="mb-6 w-full" style="max-width: none;">
                    <div class="flex items-center gap-2 mb-4">
                        <Heading tag="h6">New Purchases</Heading>
                        <Badge color="green">{parseResult.interimResult.newPurchases.length}</Badge>
                    </div>
                    <div class="w-full overflow-x-auto" style="max-width: none;">
                        <Table striped={true} class="border w-full" style="max-width: none;">
                            <TableHead class="border-b">
                                <TableHeadCell>Name</TableHeadCell>
                                <TableHeadCell>Total Amount</TableHeadCell>
                                <TableHeadCell>Remaining</TableHeadCell>
                                <TableHeadCell>Start Date</TableHeadCell>
                                <TableHeadCell>Expiry Date</TableHeadCell>
                            </TableHead>
                            <TableBody tableBodyClass="divide-y">
                                {#each parseResult.interimResult.newPurchases as purchase}
                                <TableBodyRow>
                                    <TableBodyCell>{purchase.name}</TableBodyCell>
                                    <TableBodyCell><Currency value={purchase.total} /></TableBodyCell>
                                    <TableBodyCell><Currency value={purchase.remaining} /></TableBodyCell>
                                    <TableBodyCell><FormattedDate value={purchase.startDate} /></TableBodyCell>
                                    <TableBodyCell><FormattedDate value={purchase.expiryDate} /></TableBodyCell>
                                </TableBodyRow>
                                {/each}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            {/if}

            <!-- Updated Purchases -->
            {#if parseResult.interimResult.updatedPurchases.length > 0 && parseResult.interimResult.updatedPurchases.some(purchase => purchase.oldRemaining !== purchase.newRemaining)}
                <Card class="mb-6 w-full" style="max-width: none;">
                    <div class="flex items-center gap-2 mb-4">
                        <Heading tag="h6">Updated Purchases</Heading>
                        <Badge color="yellow">{parseResult.interimResult.updatedPurchases.filter(purchase => purchase.oldRemaining !== purchase.newRemaining).length}</Badge>
                    </div>
                    <div class="w-full overflow-x-auto" style="max-width: none;">
                        <Table striped={true} class="border w-full" style="max-width: none;">
                            <TableHead class="border-b">
                                <TableHeadCell>Name</TableHeadCell>
                                <TableHeadCell>Old Remaining</TableHeadCell>
                                <TableHeadCell></TableHeadCell>
                                <TableHeadCell>New Remaining</TableHeadCell>
                            </TableHead>
                            <TableBody tableBodyClass="divide-y">
                                {#each parseResult.interimResult.updatedPurchases.filter(purchase => purchase.oldRemaining !== purchase.newRemaining) as purchase}
                                <TableBodyRow>
                                    <TableBodyCell>{purchase.name}</TableBodyCell>
                                    <TableBodyCell><Currency value={purchase.oldRemaining} /></TableBodyCell>
                                    <TableBodyCell class="text-center"><ArrowRightOutline class="w-4 h-4 text-gray-400" /></TableBodyCell>
                                    <TableBodyCell><Currency value={purchase.newRemaining} /></TableBodyCell>
                                </TableBodyRow>
                                {/each}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            {/if}

            <!-- Paid Off Purchases -->
            {#if parseResult.interimResult.paidOffPurchases.length > 0}
                <Card class="mb-6 w-full" style="max-width: none;">
                    <div class="flex items-center gap-2 mb-4">
                        <Heading tag="h6">Paid Off Purchases</Heading>
                        <Badge color="red">{parseResult.interimResult.paidOffPurchases.length}</Badge>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        These purchases were not found in the new statement and appear to be paid off.
                    </p>
                    <div class="w-full overflow-x-auto" style="max-width: none;">
                        <Table striped={true} class="border w-full" style="max-width: none;">
                            <TableHead class="border-b">
                                <TableHeadCell>Name</TableHeadCell>
                                <TableHeadCell>Total Amount</TableHeadCell>
                                <TableHeadCell>Last Remaining</TableHeadCell>
                            </TableHead>
                            <TableBody tableBodyClass="divide-y">
                                {#each parseResult.interimResult.paidOffPurchases as purchase}
                                <TableBodyRow>
                                    <TableBodyCell>{purchase.name}</TableBodyCell>
                                    <TableBodyCell><Currency value={purchase.total} /></TableBodyCell>
                                    <TableBodyCell><Currency value={purchase.remaining} /></TableBodyCell>
                                </TableBodyRow>
                                {/each}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            {/if}

            <!-- Confirmation Button - Only show if there are changes -->
            {#if hasChanges(parseResult)}
                <Card class="w-full" style="max-width: none;">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <Heading tag="h6" class="mb-2">Ready to Apply Changes?</Heading>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                {#if parseResult.interimResult.newPurchases.length > 0 || parseResult.interimResult.updatedPurchases.some(p => p.oldRemaining !== p.newRemaining) || parseResult.interimResult.paidOffPurchases.length > 0}
                                    This will update your purchases with the changes shown above.
                                {/if}
                                {#if parseResult.dueDate && parseResult.currentDueDate && new Date(parseResult.dueDate).toISOString().split('T')[0] !== new Date(parseResult.currentDueDate).toISOString().split('T')[0]}
                                    {#if parseResult.interimResult.newPurchases.length > 0 || parseResult.interimResult.updatedPurchases.some(p => p.oldRemaining !== p.newRemaining) || parseResult.interimResult.paidOffPurchases.length > 0}
                                        <br>
                                    {/if}
                                    The due date will also be updated to <FormattedDate value={parseResult.dueDate} />.
                                {/if}
                            </p>
                        </div>
                        <Button 
                            on:click={handleConfirm}
                            disabled={confirming}
                            color="green"
                            size="lg"
                            class="sm:flex-shrink-0"
                        >
                            {#if confirming}
                                <Spinner class="me-3" size="4" color="white" />
                                Confirming...
                            {:else}
                                <CheckCircleOutline class="me-2" />
                                Confirm Changes
                            {/if}
                        </Button>
                    </div>
                </Card>
            {/if}

        {:else if parseResult.success && parseResult.calculation}
            <!-- Changes Applied Successfully -->
            <Alert color="green" class="mb-6 w-full">
                <CheckCircleOutline slot="icon" class="w-4 h-4" />
                <span class="font-medium">Success!</span> Your purchases have been updated successfully.
            </Alert>

        {:else}
            <!-- Parsing Failed -->
            <Alert color="red" class="mb-6 w-full">
                <span class="font-medium">Parsing Failed:</span> {parseResult.error}
            </Alert>
        {/if}
    {/if}
</div>

<style>
    :global(.file-upload-label) {
        cursor: pointer;
    }
</style> 