<script lang="ts">
import ValidatedFormElement from "./ValidatedFormElement.svelte";
import {Input} from "flowbite-svelte";
import {writable} from "svelte/store";
import type {form} from "svelte-forms";

export let title: string;
export let formStore: ReturnType<typeof form>;
export let validationMessages: {[index:string]: string};

export let value: string;

let hasError = writable(false);
</script>

<ValidatedFormElement errorStore={hasError} formStore={formStore} validationMessages={validationMessages} {...$$props}>
    <span slot="title">{title}</span>
    <Input color={$hasError ? 'red' : undefined} type="text" name="purchase_name" bind:value={value} />
</ValidatedFormElement>