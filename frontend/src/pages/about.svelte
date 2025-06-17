<script lang="ts">
    import { Heading, Badge, Alert } from 'flowbite-svelte';
    import { InfoCircleOutline, BrainOutline, ChartPieOutline, CalendarMonthOutline, CreditCardOutline, ClipboardCheckOutline, CogOutline, TerminalOutline } from 'flowbite-svelte-icons';
</script>

<div class="w-full">
    <Heading tag="h5" class="font-normal mb-5">About</Heading>
    
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
                <div class="flex items-start gap-3">
                    <CogOutline class="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                        <h3 class="font-medium mb-1">Privacy Focused</h3>
                        <p class="text-gray-600 dark:text-gray-300 text-sm">
                            All calculations happen locally - your financial data never leaves your device
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
                    The system calculates how much you need to pay monthly to clear each purchase before its interest period ends:
                </p>
                <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                    Monthly Payment = Remaining Balance ÷ Months Left
                </code>
            </div>
            
            <div class="border-l-4 border-primary-500 pl-4">
                <h3 class="font-medium mb-2">2. Minimum Payment Logic</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-2">
                    If a purchase has minimum payment requirements, the system ensures compliance:
                </p>
                <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                    Payment = max(Minimum Payment, Equal Payment)
                </code>
            </div>
            
            <div class="border-l-4 border-primary-500 pl-4">
                <h3 class="font-medium mb-2">3. Billing Cycle Consideration</h3>
                <p class="text-gray-600 dark:text-gray-300">
                    The system accounts for your statement date and due date to ensure payments are properly timed 
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

    <!-- Example Calculation -->
    <div class="mb-12">
        <div class="flex items-center gap-3 mb-6">
            <ClipboardCheckOutline class="w-6 h-6 text-primary-600" />
            <Heading tag="h2" class="text-xl font-normal">Example Calculation</Heading>
        </div>
        <Alert class="mb-4">
            <InfoCircleOutline slot="icon" class="w-4 h-4" />
            <span class="font-medium">Example Scenario:</span> You purchased a $1,200 engagement ring with 12 months interest-free financing.
        </Alert>
        
        <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-medium mb-3">Purchase Details</h4>
                    <ul class="space-y-2 text-sm">
                        <li><strong>Total Amount:</strong> $1,200</li>
                        <li><strong>Interest-Free Period:</strong> 12 months</li>
                        <li><strong>Purchase Date:</strong> January 15th</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-medium mb-3">Calculated Payment</h4>
                    <ul class="space-y-2 text-sm">
                        <li><strong>Equal Payment:</strong> $1,200 ÷ 12 = $100</li>
                        <li><strong>Monthly Payment:</strong> <span class="text-primary-600 font-bold">$100</span></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Getting Started -->
    <div class="mb-12">
        <div class="flex items-center gap-3 mb-6">
            <ChartPieOutline class="w-6 h-6 text-primary-600" />
            <Heading tag="h2" class="text-xl font-normal">Getting Started</Heading>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
            <div class="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-primary-600 font-bold text-lg">1</span>
                </div>
                <h3 class="font-medium mb-2">Add Your Purchases</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm">
                    Enter your interest-free purchases or upload a statement to get started
                </p>
            </div>
            <div class="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-primary-600 font-bold text-lg">2</span>
                </div>
                <h3 class="font-medium mb-2">Set Your Dates</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm">
                    Configure your payment due date and statement date for accurate calculations
                </p>
            </div>
            <div class="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-primary-600 font-bold text-lg">3</span>
                </div>
                <h3 class="font-medium mb-2">View Your Plan</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm">
                    See your optimized payment schedule and 12-month projection
                </p>
            </div>
        </div>
    </div>

    <!-- Benefits -->
    <div class="mb-12">
        <div class="flex items-center gap-3 mb-6">
            <ChartPieOutline class="w-6 h-6 text-primary-600" />
            <Heading tag="h2" class="text-xl font-normal">Why Use Gem Guru?</Heading>
        </div>
        <div class="grid md:grid-cols-2 gap-4">
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-300">Avoid interest charges completely</span>
            </div>
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-300">Save hundreds or thousands of dollars</span>
            </div>
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-300">Simplify complex payment calculations</span>
            </div>
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-300">Never miss a payment deadline</span>
            </div>
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-300">Optimize multiple purchases at once</span>
            </div>
            <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-300">Keep your financial data private</span>
            </div>
        </div>
    </div>
</div> 