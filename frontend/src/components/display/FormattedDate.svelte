<script lang="ts">
    import { DateTime } from 'luxon';
    export let value: string;
    let formattedDate: string;
    $: formattedDate = DateTime.fromISO(value).toFormat('d LLLL yyyy');
</script>

{formattedDate}