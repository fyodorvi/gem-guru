<script lang="ts">
import ValidatedFormElement from "./ValidatedFormElement.svelte";
import {Input} from "flowbite-svelte";
import {writable} from "svelte/store";
import type {form} from "svelte-forms";
import {onMount} from "svelte";

export let title: string | undefined;
export let formStore: ReturnType<typeof form>;
export let validationMessages: {[index:string]: string};

export let value: string;

export let autoFocus: boolean = false;
const name = Math.random().toString();

onMount(() => {
    if (autoFocus) {
        const el = document.querySelectorAll(`[name="${name}"]`);
        if (el.length && el.length === 1) {
            (el[0] as HTMLInputElement).focus();
        }
    }
});

let hasError = writable(false);
</script>

<ValidatedFormElement {title} errorStore={hasError} formStore={formStore} validationMessages={validationMessages}>
    <Input {name} color={$hasError ? 'red' : undefined} type="text" bind:value={value} {...$$props} />
</ValidatedFormElement>

