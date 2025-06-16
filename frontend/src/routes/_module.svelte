<script lang="ts">
    import { beforeUrlChange, isActive } from '@roxi/routify'
    import {useAuth0} from "../services/auth0";
    import {onMount} from 'svelte';
    import { Button } from 'flowbite-svelte';
    import logo from '../assets/logo.png';
    import { Spinner } from 'flowbite-svelte';
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, Dropdown, DropdownItem, DropdownHeader } from 'flowbite-svelte';

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
        
        // Navigate to calculator by default if authenticated and on root
        if ($isAuthenticated && (window.location.pathname === '/' || window.location.pathname === '')) {
            window.location.href = '/calculator';
        }
    });

    // Watch for authentication changes to redirect to calculator
    $: if ($isAuthenticated && (window.location.pathname === '/' || window.location.pathname === '')) {
        window.location.href = '/calculator';
    }
</script>

{#if $isLoading}
    <div class="flex h-screen">
        <div class="m-auto text-center">
            <Spinner />
        </div>
    </div>
{:else}
    {#if $isAuthenticated}
        <div class="w-full max-w-[900px] mx-auto">
        <Navbar>
            <NavBrand href="/calculator">
                <!--<img src="/images/flowbite-svelte-icon-logo.svg" class="me-3 h-6 sm:h-9" alt="Flowbite Logo" />-->
                <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white font-serif">Gem Guru</span>
            </NavBrand>
            <div class="flex items-center md:order-2">
                <Avatar id="avatar-menu" class="cursor-pointer" />
                <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
            </div>
            <Dropdown placement="bottom" triggeredBy="#avatar-menu">
                <DropdownHeader>
                    <span class="block truncate text-sm font-medium">{$user.email}</span>
                </DropdownHeader>
                <DropdownItem href="/profile">Profile</DropdownItem>
                <DropdownItem on:click={() => logout({ logoutParams: {returnTo: window.location.origin,}})}>Sign out</DropdownItem>
            </Dropdown>
            <NavUl>
                <NavLi href="/calculator" active={true}>Calculator</NavLi>
                <NavLi href="/projection">Projection</NavLi>
                <NavLi href="/statement">Statement</NavLi>
            </NavUl>
        </Navbar>
        </div>
            <div class="p-5">
                <div class="w-full max-w-[900px] mx-auto">
                <slot />
                </div>
            </div>

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