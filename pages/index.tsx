import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack } from '@mui/material';
import withLayoutHome from '../libs/components/layout/LayoutHome';
import CategoryCircles from '../libs/components/homepage/CategoryCircles';
import StyleQuiz from '../libs/components/homepage/StyleQuiz';
import ProductTabs from '../libs/components/homepage/ProductTabs';
import TrendingRoomTours from '../libs/components/homepage/TrendingRoomTours';
import FitsMySpace from '../libs/components/homepage/FitsMySpace';
import PreLoved from '../libs/components/homepage/PreLoved';
import TopStores from '../libs/components/homepage/TopStores';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const Home: NextPage = () => {
	return (
		<Stack id={'home-page'}>
			<CategoryCircles />
			<StyleQuiz />
			<ProductTabs />
			<TrendingRoomTours />
			<FitsMySpace />
			<PreLoved />
			<TopStores />
		</Stack>
	);
};

export default withLayoutHome(Home);
