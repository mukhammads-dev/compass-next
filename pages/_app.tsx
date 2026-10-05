import type { AppProps } from 'next/app';
import { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { appWithTranslation } from 'next-i18next';
import { useApollo } from '../apollo/client';
import useChatSocket from '../libs/hooks/useChatSocket';
import { light } from '../scss/MaterialTheme';
import '../scss/app.scss';
import '../scss/pc/main.scss';

const App = ({ Component, pageProps }: AppProps) => {
	const [theme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState ?? null);
	useChatSocket();

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
