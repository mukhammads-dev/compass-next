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
import EventsBanner from '../libs/components/homepage/EventsBanner';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/**
 * The hero (in LayoutHome) shows a real room you can shop.
 * Below it, each section answers one question a shopper has:
 * what kind of thing → what's my style → what's popular → how do others live →
 * will it fit → can I buy used → who sells here → what's on.
 */
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
			<EventsBanner />
		</Stack>
	);
};

export default withLayoutHome(Home);
