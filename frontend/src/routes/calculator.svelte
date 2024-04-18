<script lang="ts">
    import {onMount} from "svelte";
    import axios from 'axios';
    import {useAuth0} from "../services/auth0";

    let { getAccessToken } = useAuth0;
    let message: string;
    let loading = true;
    let dataValue = '';

    onMount(async () => {
        const token = await getAccessToken({ authorizationParams: { audience: import.meta.env.VITE_API_URL }});
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/hello`, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        message = response.data.message;
        loading = false;
    });

    async function loadData() {
        loading = true;
        const token = await getAccessToken({ authorizationParams: { audience: import.meta.env.VITE_API_URL }});
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/load-data`, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        message = 'loaded';
        dataValue = response.data.data;
        loading = false;
    }

    async function saveData() {
        loading = true;
        const token = await getAccessToken({ authorizationParams: { audience: import.meta.env.VITE_API_URL }});
        await axios.post(`${import.meta.env.VITE_API_URL}/save-data`, { data: dataValue }, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        message = 'saved';
        loading = false;
    }
</script>

{#if !loading}
    <p>Message: {message}</p>
    <p><textarea bind:value={dataValue}></textarea></p><p><button on:click={() => loadData()}>Load</button> <button on:click={() => saveData()}>Save</button></p>
{:else}
    <p>Loading...</p>
{/if}