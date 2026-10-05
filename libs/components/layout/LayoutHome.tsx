import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import useRestoreAuth from '../../hooks/useRestoreAuth';
import Top from '../Top';
import Footer from '../Footer';
import HeroGallery from '../homepage/HeroGallery';

/** Home page: navbar + photo gallery hero with search filter + footer. */
const withLayoutHome = (Component: any) => {
	const LayoutHome = (props: any) => {
		const { t } = useTranslation('common');

		/** LIFECYCLES **/
		useRestoreAuth();

		return (
			<>
				<Head>
					<title>{`Compass — ${t('Shop straight from real homes')}`}</title>
				</Head>
				<Stack id={'pc-wrap'}>
					<Stack id={'top'}>
						<Top />
					</Stack>

					<HeroGallery />

					<Stack id={'main'} className={'main-home'}>
						<Component {...props} />
					</Stack>

					<Stack id={'footer'}>
						<Footer />
					</Stack>
				</Stack>
			</>
		);
	};
	return LayoutHome;
};

export default withLayoutHome;
