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
        TableBody, TableBodyRow, TableBodyCell
    } from 'flowbite-svelte';
    import { PlusOutline, DotsHorizontalOutline, CalendarMonthOutline } from 'flowbite-svelte-icons';

    let { getAccessToken } = useAuth0;
    let message: string;
    let loading = true;
    let dataValue = '';

    onMount(async () => {
        const token = await getAccessToken({ authorizationParams: { audience: import.meta.env.VITE_API_URL }});
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/hello`, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        message = response.data.message;
        loading = false;
    });

    async function loadData() {
        loading = true;
        const token = await getAccessToken({ authorizationParams: { audience: import.meta.env.VITE_API_URL }});
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/load-data`, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        message = 'loaded';
        dataValue = response.data.data;
        loading = false;
    }

    async function saveData() {
        loading = true;
        const token = await getAccessToken({ authorizationParams: { audience: import.meta.env.VITE_API_URL }});
        await axios.post(`${import.meta.env.VITE_API_URL}/save-data`, { data: dataValue }, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        message = 'saved';
        loading = false;
    }
</script>
{#if !loading}
    <div class="lg:max-w-[50%] sm:max-w-[75%]">
        <Heading tag="h5" class="font-normal mb-5">My Purchases <Button class="inline-block ml-2 p-2"><PlusOutline /></Button></Heading>
        <ul>
            <li class="p-3 border first:rounded-t-lg last:rounded-b-lg border-slate-300 sm:flex md:justify-between">
                <div>
                    <Heading tag="h6">LG Fridge</Heading>
                    <div class="mt-3">Total: <span class="font-bold">$9400</span></div>
                    <div class="mt-1">Remaining: <span class="font-bold">$6700</span> <Button class="inline-block ml-2 p-1" color="alternative"><DotsHorizontalOutline /></Button></div>
                    <div class="mt-4"><CalendarMonthOutline class="inline-block" /> 12 March 2025</div>
                </div>
                <div class="sm:ml-auto w-44 sm:mt-10 mt-4">
                    Payments: 3 out of 4
                    <Progressbar progress="50" class="w-32 mt-2" />
                </div>
            </li>
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
                <TableBodyRow>
                    <TableBodyCell>LG Fridge</TableBodyCell>
                    <TableBodyCell>$120.50</TableBodyCell>
                    <TableBodyCell>18</TableBodyCell>
                </TableBodyRow>
                <TableBodyRow>
                    <TableBodyCell>Dishwasher</TableBodyCell>
                    <TableBodyCell>$200</TableBodyCell>
                    <TableBodyCell>5</TableBodyCell>
                </TableBodyRow>
                <TableBodyRow>
                    <TableBodyCell>Watch</TableBodyCell>
                    <TableBodyCell>$195.40</TableBodyCell>
                    <TableBodyCell>8</TableBodyCell>
                </TableBodyRow>
            </TableBody>
        </Table>
        <div class="text-xl mb-4">Total remaining: <span class="font-bold">$8700</span></div>
        <div class="text-xl">Amount to pay today: <span class="font-bold bg-primary-300 p-2 rounded-xl">$1600.40</span></div>
    </div>
{:else}
    <!-- <Skeleton /> -->
    <Spinner />
{/if}