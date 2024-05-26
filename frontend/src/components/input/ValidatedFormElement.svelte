<script lang="ts">
import type {form} from "svelte-forms";
import {Helper, Label} from "flowbite-svelte";
import type {Writable} from "svelte/store";
import {fade} from 'svelte/transition';

export let formStore: ReturnType<typeof form>;
export let validationMessages: {[index:string]: string};
export let title: string | undefined;

export let errorStore: Writable<boolean>;
let hasError: boolean;

$: hasError = Object.keys(validationMessages).find(field => $formStore.hasError(field)) !== undefined;
$: errorStore.set(hasError);
</script>

<Label color={hasError ? 'red' : 'gray'} {...$$props} >
    {#if title}
        <span class="block mb-1">{title}</span>
    {/if}
    <slot />
    <div>
    {#each Object.keys(validationMessages) as field}
        {#if $formStore.hasError(field)}
            <div in:fade={{duration:200}}>
                <Helper class="mt-2" color="red">
                    {validationMessages[field]}
                </Helper>
            </div>
        {/if}
    {/each}
    </div>
</Label>
