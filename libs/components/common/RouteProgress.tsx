import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

/**
 * A thin oak line at the very top while the next page loads.
 * It waits 120ms before showing, so instant page changes stay calm.
 */
const RouteProgress = () => {
	const router = useRouter();
	const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
	const timer = useRef<number>();

	useEffect(() => {
		const start = (url: string, { shallow }: { shallow: boolean }) => {
			if (shallow || url === router.asPath) return;
			window.clearTimeout(timer.current);
			timer.current = window.setTimeout(() => setState('loading'), 120);
		};
		const end = () => {
			window.clearTimeout(timer.current);
			setState((current) => (current === 'loading' ? 'done' : 'idle'));
			timer.current = window.setTimeout(() => setState('idle'), 350);
		};
		router.events.on('routeChangeStart', start);
		router.events.on('routeChangeComplete', end);
		router.events.on('routeChangeError', end);
		return () => {
			router.events.off('routeChangeStart', start);
			router.events.off('routeChangeComplete', end);
			router.events.off('routeChangeError', end);
			window.clearTimeout(timer.current);
		};
	}, [router]);

	if (state === 'idle') return null;
	return <div className={`route-progress ${state}`} role={'progressbar'} aria-label={'Loading'} />;
};

export default RouteProgress;
