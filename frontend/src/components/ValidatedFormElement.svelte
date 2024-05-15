<script lang="ts">
import type {form} from "svelte-forms";
import {Helper, Label} from "flowbite-svelte";
import type {Writable} from "svelte/store";

export let formStore: ReturnType<typeof form>;
export let validationMessages: {[index:string]: string};

export let errorStore: Writable<boolean>;
let hasError: boolean;

$: hasError = Object.keys(validationMessages).find(field => $formStore.hasError(field)) !== undefined;
$: errorStore.set(hasError);
</script>

<Label color={hasError ? 'red' : undefined} {...$$props} >
    <slot name="title"></slot>
    <slot />
    {#each Object.keys(validationMessages) as field}
        {#if $formStore.hasError(field)}
            <Helper class="mt-2" color="red">
                {validationMessages[field]}
            </Helper>
        {/if}
    {/each}
</Label>
