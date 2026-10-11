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
import TaggedImage from '../../libs/components/room-tour/TaggedImage';
import ProductCard from '../../libs/components/common/ProductCard';
import CommentSection from '../../libs/components/common/CommentSection';
import NoData from '../../libs/components/common/NoData';
import { userVar } from '../../apollo/store';
import { GET_BOARD_ARTICLE } from '../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { BoardArticle } from '../../libs/types/board-article/board-article';
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

const RoomTourDetail: NextPage = () => {
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
		onCompleted: (data: T) => setArticle(data?.getBoardArticle ?? null),
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
			<Stack id={'room-tour-detail-page'}>
				<Stack className={'container'}>
					<NoData text={'Room Tour not found'} />
				</Stack>
			</Stack>
		);
	}

	const liked = Boolean(article.meLiked?.[0]?.myFavorite);
	const taggedProducts = article.taggedProductsData ?? [];

	return (
		<Stack id={'room-tour-detail-page'}>
			<Stack className={'container detail-layout'}>
				<Stack className={'detail-main'}>
					<div className={'media-frame'}>
						<TaggedImage images={article.roomImages} tags={article.taggedProducts} products={taggedProducts} />
						<MediaActions
							liked={liked}
							likes={article.articleLikes ?? 0}
							onLike={likeArticleHandler}
							title={article.articleTitle}
						/>
					</div>

					<Stack className={'article-head'}>
						<Stack className={'chips'}>
							{article.homeType && <span>{t(enumLabel(article.homeType))}</span>}
							{article.homeSize ? <span>{article.homeSize}㎡</span> : null}
							{article.homeStyle && <span>{t(enumLabel(article.homeStyle))}</span>}
						</Stack>
						<h1>{article.articleTitle}</h1>
						<span className={'muted'}>
							{moment(article.createdAt).format('YYYY.MM.DD')} · {t('Views')} {article.articleViews}
						</span>
					</Stack>

					<p className={'article-content'}>{article.articleContent}</p>

					<CommentSection commentGroup={CommentGroup.ARTICLE} commentRefId={article._id} onChange={reloadArticle} />
				</Stack>

				<aside className={'detail-side'}>
					<Link href={{ pathname: '/member', query: { memberId: article.memberId } }} className={'author-card'}>
						<Avatar src={imageUrl(article.memberData?.memberImage, DEFAULT_AVATAR)} sx={{ width: 48, height: 48 }} />
						<Stack>
							<strong>{article.memberData?.memberNick}</strong>
							<span>
								{article.memberData?.memberFollowers ?? 0} {t('Followers')}
							</span>
						</Stack>
					</Link>

					<Stack className={'tagged-list'}>
						<h3>
							{t('Products in this room')} <span>{taggedProducts.length}</span>
						</h3>
						{taggedProducts.length ? (
							taggedProducts.map((product) => <ProductCard key={product._id} product={product} compact />)
						) : (
							<p className={'muted'}>{t('No products tagged')}</p>
						)}
					</Stack>
				</aside>
			</Stack>
		</Stack>
	);
};

export default withLayoutFull(RoomTourDetail);
