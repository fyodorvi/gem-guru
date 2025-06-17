<script lang="ts">
    import { beforeUrlChange, goto, page } from '@roxi/routify'
    import {useAuth0} from "../services/auth0";
    import {onMount} from 'svelte';

    import { Spinner } from 'flowbite-svelte';
    import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Avatar, Dropdown, DropdownItem, DropdownHeader } from 'flowbite-svelte';

    import { UserSolid } from 'flowbite-svelte-icons';
    let { isLoading, isAuthenticated, logout, initializeAuth0, user } = useAuth0;

    // Add dropdown state management
    let dropdownOpen = false;
    
    // Get current URL from Routify page store
    $: activeUrl = $page.path;

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
            $goto('/calculator');
        }
    });

    // Watch for authentication changes to redirect to calculator
    $: if ($isAuthenticated && (window.location.pathname === '/' || window.location.pathname === '')) {
        $goto('/calculator');
    }

    // Function to handle dropdown item clicks
    const handleDropdownItemClick = (callback?: () => void) => {
        dropdownOpen = false;
        if (callback) {
            callback();
        }
    };

    // Function to handle mobile menu navigation
    const handleMobileNavClick = (toggleFn: () => void, href: string) => {
        // Only close the menu on mobile screens (below md breakpoint - 768px)
        if (window.innerWidth < 768) {
            toggleFn();
        }
        // Then navigate
        $goto(href);
    };
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
        <Navbar let:toggle>
            <NavBrand href="/calculator">
                <!--<img src="/images/flowbite-svelte-icon-logo.svg" class="me-3 h-6 sm:h-9" alt="Flowbite Logo" />-->
                <span class="self-center whitespace-nowrap text-xl font-normal dark:text-white font-serif">Gem Guru</span>
            </NavBrand>
            <div class="flex items-center md:order-2">
                <Avatar id="avatar-menu" class="cursor-pointer dark:bg-transparent" on:click={() => dropdownOpen = !dropdownOpen}>
                    <UserSolid class="w-10 h-10" />
                </Avatar>
                <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
            </div>
            <Dropdown placement="bottom" triggeredBy="#avatar-menu" bind:open={dropdownOpen}>
                <DropdownHeader>
                    <span class="block truncate text-sm font-medium">{$user.email}</span>
                </DropdownHeader>
                <!-- <DropdownItem on:click={() => handleDropdownItemClick(handleProfileClick)}>Profile</DropdownItem> -->
                <DropdownItem on:click={() => handleDropdownItemClick(() => logout({ logoutParams: {returnTo: window.location.origin,}}))}>Sign out</DropdownItem>
            </Dropdown>
            <NavUl {activeUrl}>
                <NavLi class="cursor-pointer" activeClass="text-white bg-primary-700 md:bg-transparent md:text-primary-700" href="/calculator" on:click={() => handleMobileNavClick(toggle, '/calculator')}>Calculator</NavLi>
                <NavLi class="cursor-pointer" activeClass="text-white bg-primary-700 md:bg-transparent md:text-primary-700" href="/projection" on:click={() => handleMobileNavClick(toggle, '/projection')}>Projection</NavLi>
                <NavLi class="cursor-pointer" activeClass="text-white bg-primary-700 md:bg-transparent md:text-primary-700" href="/statement" on:click={() => handleMobileNavClick(toggle, '/statement')}>Statement</NavLi>
                <NavLi class="cursor-pointer" activeClass="text-white bg-primary-700 md:bg-transparent md:text-primary-700" href="/about" on:click={() => handleMobileNavClick(toggle, '/about')}>About</NavLi>
            </NavUl>
        </Navbar>
        </div>
        <div class="p-5 max-w-[900px] mx-auto w-full">
            <slot />
        </div>
    {:else}
        <slot />
    {/if}
{/if}