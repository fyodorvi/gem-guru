import {
    createAuth0Client,
    User,
    type Auth0Client,
    type RedirectLoginOptions,
    type LogoutOptions, type GetTokenSilentlyOptions
} from "@auth0/auth0-spa-js";
import { get, writable, type Writable } from "svelte/store";
import { amplitudeService } from "./amplitude";

interface Auth0Config {
    onRedirectCallback?: (appState: unknown) => void;
}

const _useAuth0 = () => {
    const auth0Client: Writable<Auth0Client> = writable();
    const isAuthenticated = writable(false);
    const isLoading = writable(true);
    const user: Writable<User> = writable();
    const error = writable(null);

    const initializeAuth0 = async (config: Auth0Config = {}) => {
        auth0Client.set(await createAuth0Client({
            domain: import.meta.env.VITE_AUTH0_DOMAIN,
            clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
            authorizationParams: {
                redirect_uri: import.meta.env.VITE_AUTH0_CALLBACK_URL,
                audience: import.meta.env.VITE_API_URL
            }
        }));

        if (!config.onRedirectCallback) {
            config.onRedirectCallback = () =>
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );
        }

        try {
            const search = window.location.search;

            if (
                (search.includes("code=") || search.includes("error=")) &&
                search.includes("state=")
            ) {
                const { appState } = await get(auth0Client).handleRedirectCallback();

                config.onRedirectCallback(appState);
            }
        } catch (err) {
            error.set(err as any);
        } finally {
            const auth0IsAuthenticated = await get(auth0Client).isAuthenticated()
            const auth0User = await get(auth0Client).getUser();
            isAuthenticated.set(auth0IsAuthenticated);
            if (auth0IsAuthenticated && auth0User) {
                user.set(auth0User);
                
                // Identify user in Amplitude when authenticated
                if (auth0User.email) {
                    amplitudeService.identifyUser(auth0User.email, {
                        user_id: auth0User.sub
                    });
                }
            }
            isLoading.set(false);
        }
    };

    const login = (options?: RedirectLoginOptions) => {
        get(auth0Client).loginWithRedirect(options);
    };

    const signup = (options?: RedirectLoginOptions) => {
        get(auth0Client).loginWithRedirect({...options, authorizationParams: { screen_hint: 'signup' }});
    };

    const logout = (options?: LogoutOptions) => {
        // Reset Amplitude user when logging out
        amplitudeService.reset();
        get(auth0Client).logout(options);
    };

    const getAccessToken = async (options?: GetTokenSilentlyOptions) => {
        return await get(auth0Client).getTokenSilently(options);
    };

    return {
        isAuthenticated,
        isLoading,
        user,
        error,

        initializeAuth0,
        login,
        signup,
        logout,
        getAccessToken,
    };
};

export const useAuth0 = _useAuth0();
