<script lang="ts">
    import { beforeUrlChange } from '@roxi/routify'
    import {useAuth0} from "../services/auth0";
    import {onMount} from 'svelte';

    let { isLoading, isAuthenticated, login, logout, initializeAuth0, user } = useAuth0;

    $beforeUrlChange(() => {
        return $isAuthenticated;
    });

    const onRedirectCallback = (appState: any) => {
        window.history.replaceState(
            {},
            document.title,
            appState && appState.targetUrl
                ? appState.targetUrl
                : window.location.pathname
        );
    };

    onMount(async () => {
        await initializeAuth0({ onRedirectCallback });
    });

</script>

<a href="/calculator">Calculator</a>

{#if $isLoading}
    <p>Loading...</p>
{:else}
    {#if $isAuthenticated}
    {$user.email}
    <button on:click={() => logout({ logoutParams: {
      returnTo: window.location.origin,
    }})}>Logout</button>
    <slot />
    {:else}
    <button on:click={() => login()}>Login</button>
    {/if}
{/if}