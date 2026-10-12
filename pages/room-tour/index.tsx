import { NextPage } from 'next';
import Link from 'next/link';
import { ChangeEvent, useState, useEffect } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Button, CircularProgress, MenuItem, Pagination, Select, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import RoomTourFilter from '../../libs/components/room-tour/RoomTourFilter';
import RoomTourCard from '../../libs/components/common/RoomTourCard';
import NoData from '../../libs/components/common/NoData';
import useInquiry from '../../libs/hooks/useInquiry';
import { userVar } from '../../apollo/store';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ROOM_TOURS_PAGE_LIMIT } from '../../libs/config';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';
import { flipLike, settleLike } from '../../libs/like';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const SORTS = [
	{ id: 'articleRank', label: 'Trending' },
	{ id: 'createdAt', label: 'Newest' },
	{ id: 'articleLikes', label: 'Most liked' },
	{ id: 'articleViews', label: 'Most viewed' },
];

const initialInput: BoardArticlesInquiry = {
	page: 1,
	limit: ROOM_TOURS_PAGE_LIMIT,
	sort: 'articleRank',
	direction: Direction.DESC,
	search: {},
};

const RoomTourList: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [searchFilter, pushSearchFilter, ready] = useInquiry<BoardArticlesInquiry>(initialInput);
	const [roomTours, setRoomTours] = useState<BoardArticle[]>([]);
	const [total, setTotal] = useState<number>(0);
	// the category is fixed on this page, whatever the URL says
	const input: BoardArticlesInquiry = {
		...searchFilter,
		search: { ...searchFilter.search, articleCategory: BoardArticleCategory.ROOM_TOUR },
	};

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const {
		loading,
		data: queryData,
		error: queryError,
	} = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input },
		skip: !ready,
		notifyOnNetworkStatusChange: true,
	});

	/** cached results show at once on a revisit, fresh ones replace them a moment later */
	useEffect(() => {
		const data: T = queryData;
		if (!data) return;
		setRoomTours(data?.getBoardArticles?.list ?? []);
		setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
	}, [queryData]);

	/** HANDLERS **/
	const likeArticleHandler = async (user: T, id: string) => {
		if (!id) return;
		if (!user._id) return sweetMixinErrorAlert(Message.NOT_AUTHENTICATED);
		const before = roomTours;
		setRoomTours((list) => list.map((item) => (item._id === id ? flipLike(item, 'articleLikes') : item)));
		try {
			const { data } = await likeTargetBoardArticle({ variables: { input: id } });
			const reply = data?.likeTargetBoardArticle;
			setRoomTours((list) => list.map((item) => (item._id === id ? settleLike(item, 'articleLikes', reply) : item)));
		} catch (err: any) {
			setRoomTours(before);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const paginationHandler = async (_: ChangeEvent<unknown>, value: number) => {
		await pushSearchFilter({ ...searchFilter, page: value });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<Stack id={'room-tour-list-page'}>
			<Stack className={'container'}>
				<Stack className={'list-toolbar'}>
					<RoomTourFilter
						key={JSON.stringify(searchFilter.search)}
						searchFilter={searchFilter}
						onChange={pushSearchFilter}
					/>
				</Stack>
				<Stack className={'list-toolbar'}>
					<span>
						<strong>{total}</strong> {t('Room Tours')}
					</span>
					<Stack className={'toolbar-right'}>
						<Select
							size={'small'}
							value={searchFilter.sort ?? 'articleRank'}
							onChange={(e) => pushSearchFilter({ ...searchFilter, page: 1, sort: e.target.value as string })}
						>
							{SORTS.map((option) => (
								<MenuItem key={option.id} value={option.id}>
									{t(option.label)}
								</MenuItem>
							))}
						</Select>
						{user._id && (
							<Link href={{ pathname: '/mypage', query: { category: 'writeArticle', articleCategory: 'ROOM_TOUR' } }}>
								<Button variant={'contained'} startIcon={<AddIcon />}>
									{t('Share my room')}
								</Button>
							</Link>
						)}
					</Stack>
				</Stack>

				{(loading || (!queryData && !queryError)) && !roomTours.length ? (
					<Stack className={'loading-box'}>
						<CircularProgress />
					</Stack>
				) : roomTours.length === 0 ? (
					<NoData text={'No Room Tours yet'} />
				) : (
					<Stack className={'grid grid-3'}>
						{roomTours.map((article: BoardArticle) => (
							<RoomTourCard key={article._id} article={article} likeArticleHandler={likeArticleHandler} />
						))}
					</Stack>
				)}

				{total > searchFilter.limit && (
					<Stack className={'pagination-config'}>
						<Pagination
							page={searchFilter.page}
							count={Math.ceil(total / searchFilter.limit)}
							onChange={paginationHandler}
							shape={'rounded'}
							color={'primary'}
						/>
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(RoomTourList);
