import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, CircularProgress, Stack } from '@mui/material';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import CommentSection from '../../libs/components/common/CommentSection';
import NoData from '../../libs/components/common/NoData';
import { userVar } from '../../apollo/store';
import { GET_BOARD_ARTICLE } from '../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Message } from '../../libs/enums/common.enum';
import { DEFAULT_AVATAR, imageUrl } from '../../libs/config';
import { enumLabel } from '../../libs/utils';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';
import { flipLike, settleLike } from '../../libs/like';
import MediaActions from '../../libs/components/common/MediaActions';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const CommunityDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const articleId = (router.query.id as string) ?? '';
	const [article, setArticle] = useState<BoardArticle | null>(null);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const { loading, refetch: getArticleRefetch } = useQuery(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: { input: articleId },
		skip: !articleId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			const result: BoardArticle | null = data?.getBoardArticle ?? null;
			// Room Tours have their own viewer with product pins
			if (result?.articleCategory === BoardArticleCategory.ROOM_TOUR) {
				router.replace({ pathname: '/room-tour/detail', query: { id: result._id } }).then();
				return;
			}
			setArticle(result);
		},
	});

	/** HANDLERS **/
	const reloadArticle = async () => {
		const { data } = await getArticleRefetch({ input: articleId });
		setArticle(data?.getBoardArticle ?? null);
	};

	const likeArticleHandler = async () => {
		if (!article) return;
		if (!user._id) return sweetMixinErrorAlert(Message.NOT_AUTHENTICATED);
		const before = article;
		setArticle(flipLike(article, 'articleLikes'));
		try {
			const { data } = await likeTargetBoardArticle({ variables: { input: article._id } });
			setArticle((current) => (current ? settleLike(current, 'articleLikes', data?.likeTargetBoardArticle) : current));
		} catch (err: any) {
			setArticle(before);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (loading && !article) {
		return (
			<Stack className={'loading-box full'}>
				<CircularProgress />
			</Stack>
		);
	}

	if (!article) {
		return (
			<Stack id={'community-detail-page'}>
				<Stack className={'container'}>
					<NoData text={'Post not found'} />
				</Stack>
			</Stack>
		);
	}

	const liked = Boolean(article.meLiked?.[0]?.myFavorite);

	return (
		<Stack id={'community-detail-page'}>
			<Stack className={'container narrow'}>
				<Link href={{ pathname: '/community', query: { category: article.articleCategory } }} className={'back-link'}>
					← {t(enumLabel(article.articleCategory))}
				</Link>
				<h1>{article.articleTitle}</h1>
				<Stack className={'author-row'}>
					<Link href={{ pathname: '/member', query: { memberId: article.memberId } }}>
						<Avatar src={imageUrl(article.memberData?.memberImage, DEFAULT_AVATAR)} sx={{ width: 32, height: 32 }} />
						<strong>{article.memberData?.memberNick}</strong>
					</Link>
					<span className={'muted'}>
						{moment(article.createdAt).format('YYYY.MM.DD HH:mm')} · {t('Views')} {article.articleViews}
					</span>
					<MediaActions
						liked={liked}
						likes={article.articleLikes ?? 0}
						onLike={likeArticleHandler}
						title={article.articleTitle}
					/>
				</Stack>

				{article.articleImage && <img className={'article-image'} src={imageUrl(article.articleImage, '')} alt={''} />}
				<p className={'article-content'}>{article.articleContent}</p>

				<CommentSection commentGroup={CommentGroup.ARTICLE} commentRefId={article._id} onChange={reloadArticle} />
			</Stack>
		</Stack>
	);
};

export default withLayoutFull(CommunityDetail);
