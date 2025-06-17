<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { ChevronUpOutline, ChevronDownOutline, ChevronLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
    import { Button } from 'flowbite-svelte';
    
    export let value: string = ''; // ISO date string
    export let updating: boolean = false;
    
    const dispatch = createEventDispatcher();
    
    let day = 1;
    let month = 0; // 0-based month
    let year = new Date().getFullYear();
    let isInitialized = false;
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Parse initial value only once
    $: if (value && !isInitialized) {
        const date = new Date(value);
        day = date.getDate();
        month = date.getMonth();
        year = date.getFullYear();
        isInitialized = true;
    }
    
    // Get number of days in current month
    $: daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const incrementDay = () => {
        const newDay = day < daysInMonth ? day + 1 : 1;
        day = newDay;
        updateValue();
    };
    
    const decrementDay = () => {
        const newDay = day > 1 ? day - 1 : daysInMonth;
        day = newDay;
        updateValue();
    };
    
    const incrementMonth = () => {
        if (month < 11) {
            month = month + 1;
        } else {
            month = 0;
            year = year + 1;
        }
        // Adjust day if it's invalid for new month
        const newDaysInMonth = new Date(year, month + 1, 0).getDate();
        if (day > newDaysInMonth) {
            day = newDaysInMonth;
        }
        updateValue();
    };
    
    const decrementMonth = () => {
        if (month > 0) {
            month = month - 1;
        } else {
            month = 11;
            year = year - 1;
        }
        // Adjust day if it's invalid for new month
        const newDaysInMonth = new Date(year, month + 1, 0).getDate();
        if (day > newDaysInMonth) {
            day = newDaysInMonth;
        }
        updateValue();
    };
    
    const updateValue = () => {
        // Use UTC to avoid timezone issues
        const newDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        const isoString = newDate.toISOString();
        value = isoString;
        // Don't auto-dispatch change, wait for confirm
    };
    
    const confirmChange = () => {
        dispatch('confirm', value);
    };
    
    const cancel = () => {
        dispatch('cancel');
    };
</script>

<div class="flex items-center gap-2">
    <!-- Day Field -->
    <div class="flex flex-col items-center">
        <button 
            type="button"
            on:click={incrementDay}
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Increment day"
        >
            <ChevronUpOutline class="w-7 h-7" />
        </button>
        
        <div class="flex flex-col items-center my-2 min-w-[3rem] pt-2 pb-2">
            <span class="text-2xl font-bold text-gray-900 dark:text-white text-center">
                {day.toString().padStart(2, '0')}
            </span>
        </div>
        
        <button 
            type="button"
            on:click={decrementDay}
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Decrement day"
        >
            <ChevronDownOutline class="w-7 h-7" />
        </button>
    </div>
    
    <!-- Month Field -->
    <div class="flex flex-col items-center">
        <button 
            type="button"
            on:click={incrementMonth}
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Next month"
        >
            <ChevronUpOutline class="w-7 h-7" />
        </button>
        
        <div class="flex flex-col items-center my-2 min-w-[6rem] pt-0">
            <span class="text-lg font-semibold text-gray-900 dark:text-white text-center">
                {monthNames[month]}
            </span>
            <span class="text-sm text-gray-600 dark:text-gray-300">
                {year}
            </span>
        </div>
        
        <button 
            type="button"
            on:click={decrementMonth}
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Previous month"
        >
            <ChevronDownOutline class="w-7 h-7" />
        </button>
    </div>

<!-- Confirm/Cancel Buttons -->
<div class="flex gap-2 mt-4 mb-4">
        <Button on:click={confirmChange} disabled={updating} color="primary" size="sm">
            {#if updating}
                <svg class="animate-spin -ml-1 mr-3 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
            {:else}
                Confirm
            {/if}
        </Button>
        <Button on:click={cancel} color="alternative" size="sm">Cancel</Button>
    </div>
</div>

<style>
    button {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }
    
    button:active {
        transform: scale(0.95);
    }
</style> 