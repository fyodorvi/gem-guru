<script>
    import {Button, Heading, Spinner} from "flowbite-svelte";
    import {field, form} from "svelte-forms";
    import {min, required} from "svelte-forms/validators";
    import {onMount} from "svelte";
    import {getProfile, setProfile} from "../services/api";
    import ValidatedNumberInput from "../components/input/ValidatedNumberInput.svelte";

    const paymentDay = field('paymentDay', 1, [required(), min(1)]);
    const profileForm = form(paymentDay);

    let loading = true;

    onMount(async () => {
        const profileSettings = await getProfile();
        paymentDay.set(profileSettings.paymentDay);
        loading = false;
    });

    let submitting = false;
    const onSubmit = async () => {
        submitting = true;
        await setProfile({
            paymentDay: Number($paymentDay.value)
        });
        submitting = false;
    }
</script>

<Heading tag="h5" class="font-normal mb-5">Profile</Heading>

{#if !loading}
<form on:submit|preventDefault={onSubmit}>
    <div class="pb-2">
    <ValidatedNumberInput title="Payment Day of the Month"
                    formStore={profileForm}
                    bind:value={$paymentDay.value}
                    validationMessages={{'name.required': 'Name is required'}} />
    </div>
    <Button on:click={() => onSubmit()} type="submit" disabled={submitting}>{#if submitting}<Spinner class="me-3" size="4" color="white" />{/if} Save</Button>
</form>
{:else}
    <Spinner />
{/if}