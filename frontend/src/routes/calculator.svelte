<script lang="ts">
    import {onMount} from "svelte";
    import axios from 'axios';
    import {useAuth0} from "../services/auth0";

    let { getAccessToken } = useAuth0;
    let greeting: {message: string};

    onMount(async () => {
        const token = await getAccessToken({ authorizationParams: { audience: import.meta.env.VITE_API_URL }});
        console.log(token);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/hello`, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });

        greeting = response.data;
    })
</script>

<p>{greeting ? greeting.message : 'Loading calculator'}</p>