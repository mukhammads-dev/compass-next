const TOKEN_KEY = 'accessToken';

/**
 * "Remember me" on  → localStorage: the member stays signed in after the browser closes.
 * "Remember me" off → sessionStorage: signed out when the browser (tab session) closes.
 */
const storages = (): Storage[] => [localStorage, sessionStorage];

export function getJwtToken(): string {
	if (typeof window === 'undefined') return '';
	return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? '';
}

/** Keeps the current choice when no `remember` is given (e.g. a token refreshed after a profile update). */
export function setJwtToken(token: string, remember: boolean = !sessionStorage.getItem(TOKEN_KEY)): void {
	storages().forEach((storage) => storage.removeItem(TOKEN_KEY));
	(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
	localStorage.setItem('login', Date.now().toString());
}

export function removeJwtToken(): void {
	storages().forEach((storage) => storage.removeItem(TOKEN_KEY));
	localStorage.setItem('logout', Date.now().toString());
}
