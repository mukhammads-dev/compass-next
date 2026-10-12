import type { AppProps } from 'next/app';
import { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { appWithTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useApollo } from '../apollo/client';
import Chat from '../libs/components/Chat';
import RouteProgress from '../libs/components/common/RouteProgress';
import useChatSocket from '../libs/hooks/useChatSocket';
import { light } from '../scss/MaterialTheme';
import '../scss/app.scss';
import '../scss/pc/main.scss';

const App = ({ Component, pageProps }: AppProps) => {
	const [theme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState ?? null);
	const router = useRouter();
	useChatSocket();

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<RouteProgress />
				<Component {...pageProps} />
				{/* live chat floats over every page except the admin panel and the login screen */}
				{!router.pathname.startsWith('/_admin') && router.pathname !== '/account/join' && <Chat />}
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
