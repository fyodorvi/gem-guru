<script lang="ts">
  import { onMount } from 'svelte';
  import { Router, createRouter } from '@roxi/routify'
  import routes from '../.routify/routes.default.js'
  import { Alert } from 'flowbite-svelte';
  import Modal from 'svelte-simple-modal';

  export const router = createRouter({ routes })
</script>


<Modal closeOnEsc={false} closeOnOuterClick={false}>
  <div class="container md:mx-auto">
    <Router {router} />
  </div>
</Modal>


<style>

</style>
