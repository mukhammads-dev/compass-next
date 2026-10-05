const TOKEN_KEY = 'accessToken';

export function getJwtToken(): string {
	if (typeof window === 'undefined') return '';
	return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setJwtToken(token: string): void {
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem('login', Date.now().toString());
}

export function removeJwtToken(): void {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.setItem('logout', Date.now().toString());
}
