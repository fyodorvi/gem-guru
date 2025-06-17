<script lang="ts">
  import {toCurrencyDisplay} from "../../services/format";
  export let underline = false;
  export let value: number;
  $: dollars = toCurrencyDisplay(value);
</script>

{#if underline}
    $<span class="underline cursor-pointer decoration-dotted">{dollars}</span>
{:else}
    ${dollars}
{/if}