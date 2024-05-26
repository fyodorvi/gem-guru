<script lang="ts">
    import ValidatedFormElement from "./ValidatedFormElement.svelte";
    import {writable} from "svelte/store";
    import type {form} from "svelte-forms";
    import CurrencyInput from "./CurrencyInput.svelte";

    export let title: string | undefined = undefined;
    export let formStore: ReturnType<typeof form>;
    export let validationMessages: {[index:string]: string};

    export let value: number;

    export let autoFocus: boolean = false;

    let hasError = writable(false);
</script>

<ValidatedFormElement {title} errorStore={hasError} formStore={formStore} validationMessages={validationMessages}>
    <CurrencyInput {autoFocus} color={$hasError ? 'red' : undefined} type="text" bind:value={value} {...$$props} />
</ValidatedFormElement>