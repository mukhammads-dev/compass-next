import Link from 'next/link';
import { ChangeEvent, useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Button, Pagination, Stack } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticlesInquiry } from '../../types/board-article/board-article.input';
import { BoardArticleUpdate } from '../../types/board-article/board-article.update';
import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import { DEFAULT_ROOM_IMAGE, imageUrl } from '../../config';
import { enumLabel } from '../../utils';
import { sweetConfirmAlert, sweetMixinErrorAlert } from '../../sweetAlert';
import NoData from '../common/NoData';
import { T } from '../../types/common';

const MyArticles = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [articleInquiry, setArticleInquiry] = useState<BoardArticlesInquiry>({
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { memberId: user._id },
	});
	const [articles, setArticles] = useState<BoardArticle[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [updateBoardArticle] = useMutation<unknown, { input: BoardArticleUpdate }>(UPDATE_BOARD_ARTICLE);

	const { refetch: getArticlesRefetch } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: articleInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setArticles(data?.getBoardArticles?.list ?? []);
			setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const removeArticleHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert(t('Delete this post?') as string))) return;
			await updateBoardArticle({ variables: { input: { _id: id, articleStatus: BoardArticleStatus.DELETE } } });
			const { data } = await getArticlesRefetch({ input: articleInquiry });
			setArticles(data?.getBoardArticles?.list ?? []);
			setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		} catch (err: any) {
			console.log('ERROR, removeArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack className={'my-section'}>
			<Stack className={'section-title'}>
				<h2>{t('My posts')}</h2>
				<Link href={{ pathname: '/mypage', query: { category: 'writeArticle' } }}>
					<Button variant={'contained'}>{t('Write')}</Button>
				</Link>
			</Stack>

			{articles.length === 0 ? (
				<NoData text={'You have not posted yet'} />
			) : (
				<Stack className={'listing-table'}>
					{articles.map((article) => {
						const isRoomTour = article.articleCategory === BoardArticleCategory.ROOM_TOUR;
						return (
							<Stack key={article._id} className={'listing-row'}>
								<Link
									href={{
										pathname: isRoomTour ? '/room-tour/detail' : '/community/detail',
										query: { id: article._id },
									}}
									className={'listing-main'}
								>
									{isRoomTour && <img src={imageUrl(article.roomImages?.[0], DEFAULT_ROOM_IMAGE)} alt={''} />}
									<Stack>
										<span className={'category-chip'}>{t(enumLabel(article.articleCategory))}</span>
										<strong>{article.articleTitle}</strong>
										<span className={'muted'}>
											{moment(article.createdAt).format('YYYY.MM.DD')} · {t('Likes')} {article.articleLikes} ·{' '}
											{t('Comments')} {article.articleComments}
										</span>
									</Stack>
								</Link>
								<Stack className={'listing-actions'}>
									<Link href={{ pathname: '/mypage', query: { category: 'writeArticle', articleId: article._id } }}>
										<Button size={'small'} variant={'outlined'}>
											{t('Edit')}
										</Button>
									</Link>
									<Button size={'small'} color={'error'} onClick={() => removeArticleHandler(article._id)}>
										{t('Delete')}
									</Button>
								</Stack>
							</Stack>
						);
					})}
				</Stack>
			)}

			{total > articleInquiry.limit && (
				<Pagination
					page={articleInquiry.page}
					count={Math.ceil(total / articleInquiry.limit)}
					onChange={(_: ChangeEvent<unknown>, value: number) => setArticleInquiry({ ...articleInquiry, page: value })}
					shape={'rounded'}
					color={'primary'}
				/>
			)}
		</Stack>
	);
};

export default MyArticles;
