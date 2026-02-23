import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';

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
