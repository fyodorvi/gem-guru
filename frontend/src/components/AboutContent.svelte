<script lang="ts">
    import { Heading, Badge, Alert } from 'flowbite-svelte';
    import { InfoCircleOutline, BrainOutline, ChartPieOutline, CalendarMonthOutline, CreditCardOutline, ClipboardCheckOutline, CogOutline } from 'flowbite-svelte-icons';
</script>

<!-- What is Gem Guru -->
<div class="mb-12">
    <div class="flex items-center gap-3 mb-6">
        <InfoCircleOutline class="w-6 h-6 text-primary-600" />
        <Heading tag="h2" class="text-xl font-normal">What is Gem Guru?</Heading>
    </div>
    <p class="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
        Gem Guru is a smart payment calculator designed specifically for interest-free purchases. It helps you optimize your payment schedule to pay off
        purchases before interest kicks in, while respecting minimum payment requirements and billing cycles.
    </p>
</div>

<!-- Key Features -->
<div class="mb-12">
    <div class="flex items-center gap-3 mb-6">
        <ChartPieOutline class="w-6 h-6 text-primary-600" />
        <Heading tag="h2" class="text-xl font-normal">Key Features</Heading>
    </div>
    <div class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4">
            <div class="flex items-start gap-3">
                <BrainOutline class="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="font-medium mb-1">Smart Payment Calculator</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        Automatically calculates optimal monthly payments to pay off purchases before interest starts
                    </p>
                </div>
            </div>
            <div class="flex items-start gap-3">
                <ClipboardCheckOutline class="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="font-medium mb-1">Statement Parser</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        Upload PDF statements to automatically extract purchase details and payment information
                    </p>
                </div>
            </div>
            <div class="flex items-start gap-3">
                <ChartPieOutline class="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="font-medium mb-1">12-Month Projection</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        Visualize your payment schedule with detailed monthly breakdowns and balance projections
                    </p>
                </div>
            </div>
        </div>
        <div class="space-y-4">
            <div class="flex items-start gap-3">
                <CalendarMonthOutline class="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="font-medium mb-1">Billing Cycle Awareness</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        Accounts for statement dates and due dates to ensure accurate payment timing
                    </p>
                </div>
            </div>
            <div class="flex items-start gap-3">
                <CreditCardOutline class="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="font-medium mb-1">Minimum Payment Support</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        Respects minimum payment requirements while optimizing for early payoff
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- How the Calculation Works -->
<div class="mb-12">
    <div class="flex items-center gap-3 mb-6">
        <CogOutline class="w-6 h-6 text-primary-600" />
        <Heading tag="h2" class="text-xl font-normal">How the Calculation Works</Heading>
    </div>
    <div class="space-y-6">
        <div class="border-l-4 border-primary-500 pl-4">
            <h3 class="font-medium mb-2">1. Equal Payment Distribution</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-2">
                The app calculates how much you need to pay monthly to clear each purchase before its interest period ends:
            </p>
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                Monthly Payment = Remaining Balance ÷ Months Left
            </code>
        </div>
        
        <div class="border-l-4 border-primary-500 pl-4">
            <h3 class="font-medium mb-2">2. Minimum Payment Logic</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-2">
                If a purchase has minimum payment requirements, the app ensures compliance:
            </p>
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                Payment = max(Minimum Payment, Equal Payment)
            </code>
        </div>
        
        <div class="border-l-4 border-primary-500 pl-4">
            <h3 class="font-medium mb-2">3. Billing Cycle Consideration</h3>
            <p class="text-gray-600 dark:text-gray-300">
                The app accounts for your statement date and due date to ensure payments are properly timed
                within your billing cycle, preventing late fees and interest charges.
            </p>
        </div>
        
        <div class="border-l-4 border-primary-500 pl-4">
            <h3 class="font-medium mb-2">4. Payment Schedule</h3>
            <p class="text-gray-600 dark:text-gray-300">
                All individual purchase payments are combined into a single monthly payment amount, 
                making it easy to budget and manage your finances.
            </p>
        </div>
    </div>
</div>