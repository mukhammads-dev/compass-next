import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, Button, CircularProgress, Stack } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
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
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';

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
		try {
			if (!articleId) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetBoardArticle({ variables: { input: articleId } });
			await reloadArticle();
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeArticleHandler:', err.message);
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
				</Stack>

				{article.articleImage && (
					<img className={'article-image'} src={imageUrl(article.articleImage, '')} alt={''} />
				)}
				<p className={'article-content'}>{article.articleContent}</p>

				<Stack className={'like-row'}>
					<Button
						variant={liked ? 'contained' : 'outlined'}
						color={liked ? 'secondary' : 'primary'}
						startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
						onClick={likeArticleHandler}
					>
						{article.articleLikes}
					</Button>
				</Stack>

				<CommentSection commentGroup={CommentGroup.ARTICLE} commentRefId={article._id} onChange={reloadArticle} />
			</Stack>
		</Stack>
	);
};

export default withLayoutFull(CommunityDetail);
