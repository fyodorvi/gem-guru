<script lang="ts">
  import {toCurrencyDisplay} from "../../services/format";
  export let value: number;
  $: dollars = toCurrencyDisplay(value);
</script>

{dollars}