import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import useRestoreAuth from '../../hooks/useRestoreAuth';
import Top from '../Top';
import Footer from '../Footer';

/** List pages: navbar + page banner (title from the route) + footer. */
const withLayoutBasic = (Component: any) => {
	const LayoutBasic = (props: any) => {
		const router = useRouter();
		const { t } = useTranslation('common');

		const memoizedValues = useMemo(() => {
			let title = '';
			let desc = '';
			switch (router.pathname) {
				case '/product':
					title = 'Shop';
					desc = 'New pieces from stores and used finds from neighbours';
					break;
				case '/room-tour':
					title = 'Room Tours';
					desc = 'Real homes, shoppable photos';
					break;
				case '/community':
					title = 'Community';
					desc = 'Ask, share tips, talk about home';
					break;
				case '/store':
					title = 'Stores';
					desc = 'Furniture and home stores on Compass';
					break;
				case '/mypage':
					title = 'My Page';
					desc = 'Your listings, rooms and activity';
					break;
				case '/account/join':
					title = 'Welcome to Compass';
					desc = 'Login or create an account';
					break;
				case '/cs':
					title = 'Customer Center';
					desc = 'Notices, FAQ and events';
					break;
				default:
					break;
			}
			return { title, desc };
		}, [router.pathname]);

		/** LIFECYCLES **/
		useRestoreAuth();

		return (
			<>
				<Head>
					<title>{memoizedValues.title ? `${t(memoizedValues.title)} · Compass` : 'Compass'}</title>
				</Head>
				<Stack id={'pc-wrap'}>
					<Stack id={'top'}>
						<Top />
					</Stack>

					<Stack className={'header-basic'}>
						<Stack className={'container'}>
							<strong>{t(memoizedValues.title)}</strong>
							<span>{t(memoizedValues.desc)}</span>
						</Stack>
					</Stack>

					<Stack id={'main'}>
						<Component {...props} />
					</Stack>

					<Stack id={'footer'}>
						<Footer />
					</Stack>
				</Stack>
			</>
		);
	};
	return LayoutBasic;
};

export default withLayoutBasic;
