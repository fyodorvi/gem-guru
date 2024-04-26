<script lang="ts">
    import { beforeUrlChange } from '@roxi/routify'
    import {useAuth0} from "../services/auth0";
    import {onMount} from 'svelte';
    import { Button } from 'flowbite-svelte';
    import logo from '../assets/logo.png';

    let { isLoading, isAuthenticated, login, signup, logout, initializeAuth0, user } = useAuth0;

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

{#if $isLoading}
    <p>Loading...</p>
{:else}
    {#if $isAuthenticated}
    <a href="/calculator">Calculator</a> {$user.email}
    <Button on:click={() => logout({ logoutParams: {
      returnTo: window.location.origin,
    }})}>Logout</Button>
    <slot />
    {:else}
    <div class="flex h-screen">
        <div class="m-auto text-center">
            <img src={logo} class="w-80" alt="logo" />
            <div class="w-auto"><h1 class="text-3xl mb-10 font-serif">Gem Guru</h1></div>
            <div class="w-auto md:space-x-5">
                <Button class="w-32" on:click={() => login()}>Login</Button>
                <Button class="w-32" on:click={() => signup()}>Sign Up</Button>
            </div>
        </div>
    </div>
    {/if}
{/if}