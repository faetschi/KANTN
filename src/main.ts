import {bootstrapApplication} from '@angular/platform-browser';
import {isDevMode} from '@angular/core';
import {App} from './app/app';
import {appConfig} from './app/app.config';

// In dev mode, unregister any service worker that a previous production
// build (or `ng serve --configuration production`) may have installed on
// localhost. A stale service worker can intercept chunk requests and cause
// "Failed to fetch dynamically imported module" errors for lazy-loaded routes.
if (isDevMode() && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
	navigator.serviceWorker.getRegistrations()
		.then((registrations) => {
			for (const reg of registrations) void reg.unregister();
		})
		.catch(() => {});
}

function doBootstrap() {
	return bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}

// Support HMR (Hot Module Replacement)
declare const module: any;

if (module && module.hot) {
	module.hot.accept();
	module.hot.dispose(() => {
		const ngRef = (window as any).__ng_hmr_ref;
		if (ngRef && typeof ngRef.destroy === 'function') {
			ngRef.destroy();
		}
	});
	doBootstrap().then((ref) => (window as any).__ng_hmr_ref = ref);
} else {
	doBootstrap();
}
