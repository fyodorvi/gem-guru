import "./app.pcss";
import App from "./App.svelte";
import { amplitudeService } from "./services/amplitude";

// Initialize Amplitude (only in production)
amplitudeService.init();

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
