<script lang="ts">
    import {Chart, Heading, Spinner, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell} from "flowbite-svelte";
    import {onMount} from "svelte";
    import {loadProjection} from "../services/api";
    import type {ApexOptions} from "apexcharts";
    import {toCurrencyDisplay} from "../services/format";
    import { calculation } from '../services/store';

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
                    return toCurrencyDisplay(value);
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
                    right: 2,
                    top: 10
                }
            },
            series: [
                {
                    name: 'Payment',
                    data: projection.months.map((month) => month.amountToPay),
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
                    }
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
                        return toCurrencyDisplay(value);
                    },
                    style: {
                        fontFamily: 'Inter, sans-serif',
                        cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
                    }
                },
                show: true
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
                        <TableBodyCell>{toCurrencyDisplay(month.amountToPay)}</TableBodyCell>
                    </TableBodyRow>
                    {/each}
                </TableBody>
            </Table>
        </div>
    </div>
{:else}
    <Spinner />
{/if}