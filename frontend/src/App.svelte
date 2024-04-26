<script lang="ts">
  import { onMount } from 'svelte';
  import { Router, createRouter } from '@roxi/routify'
  import routes from '../.routify/routes.default.js'
  import { Alert } from 'flowbite-svelte';

  export const router = createRouter({ routes })
</script>


<div class="container md:mx-auto">
  <Router {router} />
</div>


<style>

</style>
