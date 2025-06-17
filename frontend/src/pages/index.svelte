<script>
    import logo from '../assets/logo.png';
    import {useAuth0} from "../services/auth0";
    import AboutContent from '../components/AboutContent.svelte';

    let { isAuthenticated } = useAuth0;
</script>

{#if !$isAuthenticated}
    <div class="w-full">
        <!-- Logo Section -->
        <div class="text-center mb-12">
            <img src={logo} class="w-80 mx-auto mb-6" alt="logo" />
        </div>
        
        <!-- About Content -->
        <AboutContent />
    </div>
{/if}