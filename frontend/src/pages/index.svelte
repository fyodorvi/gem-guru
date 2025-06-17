<script>
    import { Button } from 'flowbite-svelte';
    import logo from '../assets/logo.png';
    import {useAuth0} from "../services/auth0";
    let { login, signup, isAuthenticated } = useAuth0;
</script>
{#if !$isAuthenticated}
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