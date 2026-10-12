import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticlesInquiry } from '../../types/board-article/board-article.input';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Direction, Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { T } from '../../types/common';
import RoomTourCard from '../common/RoomTourCard';
import { flipLike, settleLike } from '../../like';

const initialInput: BoardArticlesInquiry = {
	page: 1,
	limit: 7,
	sort: 'articleRank',
	direction: Direction.DESC,
	search: { articleCategory: BoardArticleCategory.ROOM_TOUR },
};

const TrendingRoomTours = () => {
	const { t } = useTranslation('common');
	const [roomTours, setRoomTours] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const { data: queryResult } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
	});
	/* read the result on every change, cache hits included (onCompleted skips those) */
	useEffect(() => {
		const data: T = queryResult;
		if (!data) return;
		setRoomTours(data?.getBoardArticles?.list ?? []);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryResult]);

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

	if (!roomTours.length) return null;

	return (
		<Stack className={'home-section tours-feed'}>
			<Stack className={'container'}>
				<Stack className={'section-head'}>
					<h2>{t('Room Tours of the week')}</h2>
					<Link href={'/room-tour'}>
						{t('See all')} <ArrowForwardIcon fontSize={'inherit'} />
					</Link>
				</Stack>
				{/* masonry: photo heights vary like a real feed instead of a uniform grid */}
				<div className={'tour-masonry'}>
					{roomTours.map((article: BoardArticle, index: number) => (
						<div key={article._id} className={`masonry-cell shape-${index % 4}`}>
							<RoomTourCard article={article} likeArticleHandler={likeArticleHandler} />
						</div>
					))}
					<Link
						href={{ pathname: '/mypage', query: { category: 'writeArticle', articleCategory: 'ROOM_TOUR' } }}
						className={'masonry-cell share-cell'}
					>
						<strong>{t('Your room could be here')}</strong>
						<span>{t('Share a Room Tour, tag what you own, and earn points when people shop from it.')}</span>
						<em>{t('Share my room')}</em>
					</Link>
				</div>
			</Stack>
		</Stack>
	);
};

export default TrendingRoomTours;
