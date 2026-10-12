import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, Button, CircularProgress, Stack, Tab, Tabs } from '@mui/material';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import ProductCard from '../../libs/components/common/ProductCard';
import RoomTourCard from '../../libs/components/common/RoomTourCard';
import NoData from '../../libs/components/common/NoData';
import { userVar } from '../../apollo/store';
import { GET_BOARD_ARTICLES, GET_MEMBER, GET_PRODUCTS } from '../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { Member } from '../../libs/types/member/member';
import { Product } from '../../libs/types/product/product';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { DEFAULT_AVATAR, imageUrl } from '../../libs/config';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

type MemberTab = 'products' | 'roomTours' | 'posts';

/** Public profile of any member: a store (AGENT) or a user with Room Tours and used listings. */
const MemberPage: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const memberId = (router.query.memberId as string) ?? '';
	const [member, setMember] = useState<Member | null>(null);
	const [tab, setTab] = useState<MemberTab>('products');
	const [products, setProducts] = useState<Product[]>([]);
	const [articles, setArticles] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);

	const {
		loading,
		refetch: getMemberRefetch,
		data: queryData,
		error: queryError,
	} = useQuery(GET_MEMBER, {
		fetchPolicy: 'cache-and-network',
		variables: { input: memberId },
		skip: !memberId,
		notifyOnNetworkStatusChange: true,
	});

	/** cached results show at once on a revisit, fresh ones replace them a moment later */
	useEffect(() => {
		const data: T = queryData;
		if (!data) return;
		const result: Member | null = data?.getMember ?? null;
		setMember(result);
		if (result && result.memberType !== MemberType.AGENT && result.memberProducts === 0) setTab('roomTours');
	}, [queryData]);

	const { data: queryResult } = useQuery(GET_PRODUCTS, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: { page: 1, limit: 24, sort: 'createdAt', direction: Direction.DESC, search: { memberId } },
		},
		skip: !memberId || tab !== 'products',
	});
	/* read the result on every change, cache hits included (onCompleted skips those) */
	useEffect(() => {
		const data: T = queryResult;
		if (!data) return;
		setProducts(data?.getProducts?.list ?? []);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryResult]);

	const { data: queryResult2 } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: {
				page: 1,
				limit: 24,
				sort: 'createdAt',
				direction: Direction.DESC,
				search: tab === 'roomTours' ? { memberId, articleCategory: BoardArticleCategory.ROOM_TOUR } : { memberId },
			},
		},
		skip: !memberId || tab === 'products',
	});
	/* read the result on every change, cache hits included (onCompleted skips those) */
	useEffect(() => {
		const data: T = queryResult2;
		if (!data) return;
		const list: BoardArticle[] = data?.getBoardArticles?.list ?? [];
		setArticles(
			tab === 'posts' ? list.filter((item) => item.articleCategory !== BoardArticleCategory.ROOM_TOUR) : list,
		);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryResult2]);

	/** HANDLERS **/
	const followHandler = async () => {
		try {
			if (!member) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			const following = Boolean(member.meFollowed?.[0]?.myFollowing);
			if (following) await unsubscribe({ variables: { input: member._id } });
			else await subscribe({ variables: { input: member._id } });
			const { data } = await getMemberRefetch({ input: memberId });
			setMember(data?.getMember ?? null);
		} catch (err: any) {
			console.log('ERROR, followHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if ((loading || (!queryData && !queryError)) && !member) {
		return (
			<Stack className={'loading-box full'}>
				<CircularProgress />
			</Stack>
		);
	}

	if (!member) {
		return (
			<Stack id={'member-page'}>
				<Stack className={'container'}>
					<NoData text={'Member not found'} />
				</Stack>
			</Stack>
		);
	}

	const isMe = member._id === user._id;
	const following = Boolean(member.meFollowed?.[0]?.myFollowing);
	const isStore = member.memberType === MemberType.AGENT;

	return (
		<Stack id={'member-page'}>
			<Stack className={'profile-cover'}>
				<Stack className={'container'}>
					<Avatar src={imageUrl(member.memberImage, DEFAULT_AVATAR)} sx={{ width: 96, height: 96 }} />
					<Stack className={'profile-info'}>
						<span className={'role'}>{isStore ? t('Store') : t('Member')}</span>
						<h1>{member.memberFullName || member.memberNick}</h1>
						<span className={'muted'}>@{member.memberNick}</span>
						{member.memberDesc && <p>{member.memberDesc}</p>}
						<Stack className={'profile-stats'}>
							<span>
								<strong>{member.memberFollowers}</strong> {t('Followers')}
							</span>
							<span>
								<strong>{member.memberFollowings}</strong> {t('Following')}
							</span>
							<span>
								<strong>{member.memberProducts}</strong> {t('Products')}
							</span>
							<span>
								<strong>{member.memberArticles}</strong> {t('Posts')}
							</span>
						</Stack>
					</Stack>
					<Stack className={'profile-actions'}>
						{isMe ? (
							<Link href={'/mypage'}>
								<Button variant={'outlined'}>{t('My Page')}</Button>
							</Link>
						) : (
							<Button variant={following ? 'outlined' : 'contained'} onClick={followHandler}>
								{following ? t('Following') : t('Follow')}
							</Button>
						)}
					</Stack>
				</Stack>
			</Stack>

			<Stack className={'container'}>
				<Tabs value={tab} onChange={(_, value: MemberTab) => setTab(value)} className={'profile-tabs'}>
					<Tab value={'products'} label={isStore ? t('Products') : t('Used listings')} />
					<Tab value={'roomTours'} label={t('Room Tours')} />
					<Tab value={'posts'} label={t('Posts')} />
				</Tabs>

				{tab === 'products' &&
					(products.length ? (
						<Stack className={'grid grid-4'}>
							{products.map((product) => (
								<ProductCard key={product._id} product={product} />
							))}
						</Stack>
					) : (
						<NoData text={'No products yet'} />
					))}

				{tab === 'roomTours' &&
					(articles.length ? (
						<Stack className={'grid grid-3'}>
							{articles.map((article) => (
								<RoomTourCard key={article._id} article={article} />
							))}
						</Stack>
					) : (
						<NoData text={'No Room Tours yet'} />
					))}

				{tab === 'posts' &&
					(articles.length ? (
						<Stack className={'article-list'}>
							{articles.map((article) => (
								<Link
									key={article._id}
									href={{ pathname: '/community/detail', query: { id: article._id } }}
									className={'article-row'}
								>
									<Stack className={'row-main'}>
										<strong>{article.articleTitle}</strong>
										<p>{article.articleContent}</p>
									</Stack>
								</Link>
							))}
						</Stack>
					) : (
						<NoData text={'No posts yet'} />
					))}
			</Stack>
		</Stack>
	);
};

export default withLayoutFull(MemberPage);
