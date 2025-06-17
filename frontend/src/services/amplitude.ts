import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = 'b1519701d68212d5766eb7660b15aa9';

class AmplitudeService {
    private initialized = false;
    private isProduction = import.meta.env.PROD;

    init() {
        if (!this.isProduction || this.initialized) {
            return;
        }

        try {
            amplitude.init(AMPLITUDE_API_KEY, {
                // Basic configuration options
                defaultTracking: {
                    sessions: true,
                    pageViews: true,
                    formInteractions: true,
                    fileDownloads: true,
                },
                // Privacy settings
                trackingOptions: {
                    ipAddress: false, // Don't track IP for privacy
                },
            });

            this.initialized = true;
            console.log('Amplitude initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Amplitude:', error);
        }
    }

    // Identify user with email from Auth0
    identifyUser(email: string, additionalProperties?: Record<string, any>) {
        if (!this.isProduction || !this.initialized) {
            return;
        }

        try {
            amplitude.setUserId(email);
            const identify = new amplitude.Identify()
                .set('email', email)
                .set('authenticated', true);
            
            if (additionalProperties) {
                Object.entries(additionalProperties).forEach(([key, value]) => {
                    identify.setOnce(key, value);
                });
            }
            
            amplitude.identify(identify);
        } catch (error) {
            console.error('Failed to identify user in Amplitude:', error);
        }
    }

    // Reset user when logging out
    reset() {
        if (!this.isProduction || !this.initialized) {
            return;
        }

        try {
            amplitude.reset();
        } catch (error) {
            console.error('Failed to reset Amplitude:', error);
        }
    }
}

// Export singleton instance
export const amplitudeService = new AmplitudeService(); 