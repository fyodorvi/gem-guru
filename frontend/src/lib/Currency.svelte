<script lang="ts">
  export let value: number;
  const dollars = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((value / 100));
  //const dollars = (value / 100).toLocaleString("us-US", {style:"currency", currency:"USD"});
</script>

${dollars}