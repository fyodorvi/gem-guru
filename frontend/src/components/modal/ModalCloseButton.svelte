<script lang="ts">
import {CloseOutline} from "flowbite-svelte-icons";
import {getContext} from "svelte";
import type {Context} from "svelte-simple-modal";

const { close } = getContext<Context>('simple-modal');
</script>

<button on:click={() => close()} class="focus:outline-none whitespace-normal m-0.5 rounded-lg focus:ring-2 p-1.5 focus:ring-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 ms-auto">
    <CloseOutline />
</button>