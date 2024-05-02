<script lang="ts">
    import {onMount} from "svelte";
    import axios from 'axios';
    import {useAuth0} from "../services/auth0";
    import {
        Heading,
        Button,
        Spinner,
        Skeleton,
        Progressbar,
        Table,
        TableHead,
        TableHeadCell,
        TableBody, TableBodyRow, TableBodyCell, Modal, Label, Checkbox, Input
    } from 'flowbite-svelte';
    import { PlusOutline, DotsHorizontalOutline, CalendarMonthOutline } from 'flowbite-svelte-icons';
    import {type Calculation, loadCalculation} from "../services/api";

    let { getAccessToken } = useAuth0;
    let loading = true;
    let formModal = false;
    let formModalMinimumPayment = false;
    let calculation: Calculation;

    const reloadCalculation = async() => {
        calculation = await loadCalculation();
        loading = false;
        console.log(calculation)
    }



    onMount(async () => {
        await reloadCalculation();
    });
</script>
{#if !loading}
    <div class="lg:max-w-[50%] sm:max-w-[75%]">
        <Heading tag="h5" class="font-normal mb-5">My Purchases <Button on:click={() => (formModal = true)} class="inline-block ml-2 p-2"><PlusOutline /></Button></Heading>
        <ul>
            {#each calculation.purchases as purchase}
                <li class="p-3 border first:rounded-t-lg last:rounded-b-lg border-slate-300 sm:flex md:justify-between">
                    <div>
                        <Heading tag="h6">{purchase.name}</Heading>
                        <div class="mt-3">Total: <span class="font-bold">${purchase.total}</span></div>
                        <div class="mt-1">Remaining: <span class="font-bold">${purchase.remaining}</span> <Button class="inline-block ml-2 p-1" color="alternative"><DotsHorizontalOutline /></Button></div>
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
                {#each calculation.purchases as purchase}
                <TableBodyRow>
                    <TableBodyCell>{purchase.name}</TableBodyCell>
                    <TableBodyCell>${purchase.paymentToday}</TableBodyCell>
                    <TableBodyCell>{purchase.paymentsTotal-purchase.paymentsDone}</TableBodyCell>
                </TableBodyRow>
                {/each}
            </TableBody>
        </Table>
        <div class="text-xl mb-4">Total remaining: <span class="font-bold">${calculation.totalRemaining}</span></div>
        <div class="text-xl">Amount to pay today: <span class="font-bold bg-primary-300 p-2 rounded-xl">${calculation.totalAmountToPay}</span></div>
    </div>
    <Modal bind:open={formModal} size="xs" autoclose={false} class="w-full">
        <form class="flex flex-col space-y-6" action="#">
            <h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">Add Purchase</h3>
            <Label class="space-y-2">
                <span>Purchase Name</span>
                <Input type="text" name="purchase_name" required />
            </Label>
            <div class="sm:columns-2 space-y-2">
                <Label>
                    <span>Total</span>
                    <Input let:props>
                        <div slot="left">$</div>
                        <input type="number" {...props} required />
                    </Input>
                </Label>
                <Label>
                    <span>Remaining</span>
                    <Input let:props>
                        <div slot="left">$</div>
                        <input type="number" {...props} required />
                    </Input>
                </Label>
            </div>
            <div class="sm:columns-2 space-y-2">
                <Label>
                    <span>Start Date</span>
                    <Input type="date" name="purchase_name" required />
                </Label>
                <Label>
                    <span>Expiry Date</span>
                    <Input type="date" name="purchase_name" required />
                </Label>
            </div>
            <div class="sm:columns-2 space-y-2">
                <Label>
                    <span><Checkbox bind:checked={formModalMinimumPayment}>Minimum payment</Checkbox></span>
                    {#if formModalMinimumPayment}
                    <Input let:props class="mt-2">
                        <div slot="left">$</div>
                        <input type="number" {...props} />
                    </Input>
                    {/if}
                </Label>
                <div>&nbsp;</div>
            </div>
            <Button type="submit" class="w-full1">Add</Button>
        </form>
    </Modal>
{:else}
    <!-- <Skeleton /> -->
    <Spinner />
{/if}