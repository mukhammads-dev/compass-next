import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack } from '@mui/material';
import withLayoutHome from '../libs/components/layout/LayoutHome';
import CategoryCircles from '../libs/components/homepage/CategoryCircles';
import ProductTabs from '../libs/components/homepage/ProductTabs';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const Home: NextPage = () => {
	return (
		<Stack id={'home-page'}>
			<CategoryCircles />
			<ProductTabs />
		</Stack>
	);
};

export default withLayoutHome(Home);
