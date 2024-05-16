<script lang="ts">
  import { onMount } from 'svelte';
  import { Router, createRouter } from '@roxi/routify'
  import routes from '../.routify/routes.default.js'
  import { Alert } from 'flowbite-svelte';
  import Modal from 'svelte-simple-modal';

  export const router = createRouter({ routes })
</script>


<Modal closeOnEsc={false} closeOnOuterClick={false} unstyled={true}
       classBg="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 dark:bg-opacity-80"
       classWindowWrap="fixed top-0 start-0 end-0 h-modal md:inset-0 md:h-full z-50 w-full p-4 flex justify-center items-center"
       classWindow="flex relative max-w-2xl w-full max-h-full"
       classContent="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 shadow-md relative flex flex-col mx-auto w-full divide-y">
  <div class="container md:mx-auto">
    <Router {router} />
  </div>
</Modal>


<style>

</style>
