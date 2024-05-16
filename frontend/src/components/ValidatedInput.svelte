<script lang="ts">
import ValidatedFormElement from "./ValidatedFormElement.svelte";
import {Input} from "flowbite-svelte";
import {writable} from "svelte/store";
import type {form} from "svelte-forms";

export let title: string | undefined;
export let formStore: ReturnType<typeof form>;
export let validationMessages: {[index:string]: string};

export let value: string;

let hasError = writable(false);
</script>

<ValidatedFormElement {title} errorStore={hasError} formStore={formStore} validationMessages={validationMessages}>
    <Input color={$hasError ? 'red' : undefined} type="text" bind:value={value} {...$$props} />
</ValidatedFormElement>

