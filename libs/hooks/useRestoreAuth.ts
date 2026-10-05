import { useEffect } from 'react';
import { getJwtToken, updateUserInfo } from '../auth';

/**
 * Restores the signed-in member from the stored token on page load (F5),
 * and keeps tabs in sync: a login/logout in one tab is applied in the others.
 */
const useRestoreAuth = (): void => {
	useEffect(() => {
		updateUserInfo(getJwtToken());

		const onStorage = (event: StorageEvent) => {
			if (event.key === 'login' || event.key === 'logout') window.location.reload();
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);
};

export default useRestoreAuth;
