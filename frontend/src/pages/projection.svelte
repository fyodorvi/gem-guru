<script lang="ts">
    import {Chart, Heading, Spinner, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell} from "flowbite-svelte";
    import {onMount} from "svelte";
    import {loadProjection} from "../services/api";
    import type {ApexOptions} from "apexcharts";
    import Currency from "../components/display/Currency.svelte";

    let loading = true;
    let projection: any;
    let hasActiveProjection = false;

    let options: ApexOptions;

    onMount(async () => {
        projection = await loadProjection();

        // Check if there are any purchases with actual amounts to pay
        hasActiveProjection = projection.months.some((month) => month.amountToPay > 0);

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
                },
                animations: {
                    enabled: false
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
                enabled: true,
                background: {
                    enabled: true,
                    foreColor: '#fff',
                    backgroundColor: '#7c3aed',
                    padding: 4,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#7c3aed',
                    opacity: 1
                }
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
                    color: '#7c3aed'
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
    {#if hasActiveProjection}
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
        <div class="text-center py-16">
            <div class="text-gray-400 dark:text-gray-500 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No purchases to project</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Add some purchases to see your payment projection over the next 12 months.</p>
            <a href="/calculator" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                Go to Calculator
            </a>
        </div>
    {/if}
{:else}
    <Spinner />
{/if}