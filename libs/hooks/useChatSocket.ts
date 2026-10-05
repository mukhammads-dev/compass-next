import { useEffect } from 'react';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { chatSocket } from '../../apollo/socket';
import { getJwtToken } from '../auth';

/**
 * Keeps the live chat socket connected for the whole app.
 * Reconnects with the new token when the member logs in or out, so the server knows who writes.
 * Used once, in _app, which never unmounts, so there is no disconnect-on-unmount: under React
 * StrictMode that would close and reopen the socket on every page load in development.
 */
const useChatSocket = (): void => {
	const user = useReactiveVar(userVar);

	// The stored token is read on every login/logout. Reading it (instead of waiting for userVar)
	// also means a returning member connects as themselves on the first render, not as a guest first.
	useEffect(() => {
		chatSocket.connect(getJwtToken());
	}, [user._id]);
};

export default useChatSocket;
