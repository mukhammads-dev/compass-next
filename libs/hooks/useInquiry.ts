import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Inquiry state that lives in the URL (?input=<json>), so filters and page survive reloads and can be shared.
 * Returns [inquiry, pushInquiry, ready]: pushInquiry updates the URL, the URL updates the state.
 * `ready` is false until the URL has been read, so pages can `skip` the first query.
 */
const useInquiry = <I extends object>(initialInput: I): [I, (next: I) => Promise<void>, boolean] => {
	const router = useRouter();
	const [inquiry, setInquiry] = useState<I>(initialInput);
	const [ready, setReady] = useState<boolean>(false);

	useEffect(() => {
		if (!router.isReady) return;
		const raw = router.query.input;
		let next: I = initialInput;
		if (typeof raw === 'string') {
			try {
				next = { ...initialInput, ...JSON.parse(raw) };
			} catch (err) {
				next = initialInput;
			}
		}
		setInquiry(next);
		setReady(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.isReady, router.query.input]);

	const pushInquiry = async (next: I): Promise<void> => {
		const query = { ...router.query, input: JSON.stringify(next) };
		await router.push({ pathname: router.pathname, query }, undefined, { scroll: false });
	};

	return [inquiry, pushInquiry, ready];
};

export default useInquiry;
