import { useMemo } from 'react';
import { ApolloClient, ApolloLink, from, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { getJwtToken, removeJwtToken } from '../libs/auth/token';
import { emptyUser, userVar } from './store';

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

/** Sends the bearer token with every request, so components never touch it. */
const authLink = new ApolloLink((operation, forward) => {
	const token = getJwtToken();
	operation.setContext(({ headers = {} }) => ({
		headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
	}));
	return forward(operation);
});

/** Central error log. An expired or invalid token signs the user out locally. */
const errorLink = onError(({ graphQLErrors, networkError }) => {
	graphQLErrors?.forEach((error) => {
		// compass-api formatError flattens the error to { code, message }
		const code = (error as unknown as { code?: string }).code ?? error.extensions?.code;
		console.warn(`[GraphQL error]: ${error.message}`);
		if (code === 'UNAUTHENTICATED' && getJwtToken()) {
			removeJwtToken();
			userVar(emptyUser);
		}
	});
	if (networkError) console.warn(`[Network error]: ${networkError}`);
});

function createApolloClient() {
	const httpLink = new HttpLink({ uri: process.env.REACT_APP_API_GRAPHQL_URL });
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: from([errorLink, authLink, httpLink]),
		cache: new InMemoryCache(),
	});
}

/** Browser: one shared client (cache survives page changes). Server: a fresh client per call. */
export function initializeApollo(initialState: NormalizedCacheObject | null = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;
	return _apolloClient;
}

export function useApollo(initialState: NormalizedCacheObject | null) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
