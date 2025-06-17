<script lang="ts">
    import {Chart, Heading, Spinner, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell} from "flowbite-svelte";
    import {onMount} from "svelte";
    import {loadProjection} from "../services/api";
    import type {ApexOptions} from "apexcharts";
    import {toCurrencyDisplay} from "../services/format";
    import { calculation } from '../services/store';
    import Currency from "../components/display/Currency.svelte";

    let loading = true;
    let projection: any;

    let options: ApexOptions;

    onMount(async () => {
        projection = await loadProjection();

        options = {
            chart: {
                height: '400px',
                type: 'line',
                fontFamily: 'Inter, sans-serif',
                dropShadow: {
                    enabled: false
                },
                toolbar: {
                    show: false
                }
            },
            tooltip: {
                enabled: true,
                theme: 'dark',
                x: {
                    show: false
                }
            },
            dataLabels: {
                formatter: (value: number) => {
                    const roundedValue = Math.round(value / 100) * 100;
                    return '$' + Math.round(roundedValue / 100);
                },
                enabled: true
            },
            stroke: {
                width: 6,
                curve: 'smooth'
            },
            grid: {
                show: true,
                strokeDashArray: 4,
                padding: {
                    left: 2,
                    right: 30,
                    top: 10,
                    bottom: 20
                }
            },
            series: [
                {
                    name: 'Payment',
                    data: projection.months.map((month) => Math.round(month.amountToPay / 100) * 100),
                    color: '#1A56DB'
                },
            ],
            legend: {
                show: false
            },
            xaxis: {
                categories: projection.months.map((month) => month.date),
                labels: {
                    show: true,
                    style: {
                        fontFamily: 'Inter, sans-serif',
                        cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
                    },
                    rotate: -45,
                    rotateAlways: true
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    formatter: (value) => {
                        const roundedValue = Math.round(value / 100) * 100;
                        return '$' + Math.round(roundedValue / 100);
                    },
                    style: {
                        fontFamily: 'Inter, sans-serif',
                        cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
                    },
                    offsetX: -8
                },
                show: true,
                min: 0,
                max: function(max) {
                    // Add breathing room by adding 10% to the max value
                    return Math.round(max * 1.1);
                },
                tickAmount: 5
            }
        };

        loading = false;
    });
</script>

<Heading tag="h5" class="font-normal mb-5">Projection</Heading>

{#if !loading}
    <Chart {options} />
    
    <div class="mt-8">
        <Heading tag="h6" class="font-normal mb-4">Monthly Breakdown</Heading>
        <div class="w-full overflow-x-auto">
            <Table striped={true} class="border">
                <TableHead class="border-b">
                    <TableHeadCell>Month</TableHeadCell>
                    <TableHeadCell>Payment</TableHeadCell>
                </TableHead>
                <TableBody tableBodyClass="divide-y">
                    {#each projection.months as month}
                    <TableBodyRow>
                        <TableBodyCell>{month.date}</TableBodyCell>
                        <TableBodyCell><Currency value={month.amountToPay} /></TableBodyCell>
                    </TableBodyRow>
                    {/each}
                </TableBody>
            </Table>
        </div>
    </div>
{:else}
    <Spinner />
{/if}