import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Stack } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { userVar } from '../../../apollo/store';
import { BoardArticle } from '../../types/board-article/board-article';
import { DEFAULT_AVATAR, DEFAULT_ROOM_IMAGE, imageUrl } from '../../config';
import { enumLabel } from '../../utils';
import { T } from '../../types/common';

interface RoomTourCardProps {
	article: BoardArticle;
	likeArticleHandler?: (user: T, id: string) => void;
}

/** Photo-first card: the room photo is the content, text sits on it. */
const RoomTourCard = (props: RoomTourCardProps) => {
	const { article, likeArticleHandler } = props;
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const liked = Boolean(article?.meLiked?.[0]?.myFavorite);
	const cover = article.roomImages?.[0] ?? article.articleImage;
	const detailHref = { pathname: '/room-tour/detail', query: { id: article._id } };

	return (
		<Stack className={'room-tour-card'}>
			<Link href={detailHref} className={'thumb'}>
				<img src={imageUrl(cover, DEFAULT_ROOM_IMAGE)} alt={article.articleTitle} loading={'lazy'} />
				{article.taggedProducts?.length > 0 && (
					<span className={'tag-count'}>
						<LocalOfferOutlinedIcon fontSize={'inherit'} />
						{article.taggedProducts.length} {t('products')}
					</span>
				)}
				<Stack className={'overlay'}>
					<Stack className={'chips'}>
						{article.homeType && <span>{t(enumLabel(article.homeType))}</span>}
						{article.homeSize ? <span>{article.homeSize}㎡</span> : null}
					</Stack>
					<strong>{article.articleTitle}</strong>
				</Stack>
			</Link>

			{likeArticleHandler && (
				<button
					className={`like-chip ${liked ? 'liked' : ''}`}
					aria-label={'like'}
					onClick={() => likeArticleHandler(user, article._id)}
				>
					{liked ? <FavoriteIcon fontSize={'inherit'} /> : <FavoriteBorderIcon fontSize={'inherit'} />}
					<span>{article.articleLikes}</span>
				</button>
			)}

			<Link href={{ pathname: '/member', query: { memberId: article.memberId } }} className={'author'}>
				<Avatar src={imageUrl(article.memberData?.memberImage, DEFAULT_AVATAR)} sx={{ width: 24, height: 24 }} />
				<span>{article.memberData?.memberNick}</span>
				{article.homeStyle && <em>{t(enumLabel(article.homeStyle))}</em>}
			</Link>
		</Stack>
	);
};

export default RoomTourCard;
