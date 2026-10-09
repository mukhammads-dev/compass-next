import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CircularProgress, Stack } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyMenu, { MyCategory } from '../../libs/components/mypage/MyMenu';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyListings from '../../libs/components/mypage/MyListings';
import AddProduct from '../../libs/components/mypage/AddProduct';
import MyArticles from '../../libs/components/mypage/MyArticles';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MyRooms from '../../libs/components/mypage/MyRooms';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import MemberFollows from '../../libs/components/mypage/MemberFollows';
import MyNotifications from '../../libs/components/mypage/MyNotifications';
import OrderList from '../../libs/components/mypage/OrderList';
import { userVar } from '../../apollo/store';
import { getJwtToken, updateUserInfo } from '../../libs/auth';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const CATEGORIES: MyCategory[] = [
	'myProfile',
	'myListings',
	'addProduct',
	'myArticles',
	'writeArticle',
	'myRooms',
	'myFavorites',
	'recentlyVisited',
	'followers',
	'followings',
	'notifications',
	'myOrders',
	'storeOrders',
];

/** One page, many sections: /mypage?category=<section>. */
const MyPage: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const queryCategory = router.query.category as MyCategory;
	const category: MyCategory = CATEGORIES.includes(queryCategory) ? queryCategory : 'myListings';

	/** LIFECYCLES **/
	useEffect(() => {
		// guests (or expired tokens) go to login and come back here afterwards
		if (router.isReady && !updateUserInfo(getJwtToken())) {
			router.replace({ pathname: '/account/join', query: { back: router.asPath } }).then();
		}
	}, [router]);

	if (!user._id) {
		return (
			<Stack className={'loading-box'}>
				<CircularProgress />
			</Stack>
		);
	}

	return (
		<Stack id={'my-page'}>
			<Stack className={'container my-layout'}>
				<aside>
					<MyMenu category={category} />
				</aside>
				<Stack className={'my-content'}>
					{category === 'myProfile' && <MyProfile />}
					{category === 'myListings' && <MyListings />}
					{category === 'addProduct' && <AddProduct key={(router.query.productId as string) ?? 'new'} />}
					{category === 'myArticles' && <MyArticles />}
					{category === 'writeArticle' && <WriteArticle key={(router.query.articleId as string) ?? 'new'} />}
					{category === 'myRooms' && <MyRooms />}
					{category === 'myFavorites' && <MyFavorites />}
					{category === 'recentlyVisited' && <RecentlyVisited />}
					{category === 'followers' && <MemberFollows mode={'followers'} memberId={user._id} />}
					{category === 'followings' && <MemberFollows mode={'followings'} memberId={user._id} />}
					{category === 'notifications' && <MyNotifications />}
					{category === 'myOrders' && <OrderList side={'buyer'} />}
					{category === 'storeOrders' && <OrderList side={'seller'} />}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(MyPage);
