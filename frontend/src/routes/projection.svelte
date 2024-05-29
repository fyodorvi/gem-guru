<script lang="ts">
    import {Chart, Heading, Spinner} from "flowbite-svelte";
    import {onMount} from "svelte";
    import {getProfile, loadProjection} from "../services/api";
    import type {ApexOptions} from "apexcharts";
    import {toCurrencyDisplay} from "../services/format";

    let loading = true;

    let options: ApexOptions;

    onMount(async () => {
        const projection = await loadProjection();

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
                    top: -26
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
{:else}
    <Spinner />
{/if}