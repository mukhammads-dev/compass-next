import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import { userVar } from '../../../apollo/store';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { Member } from '../../types/member/member';
import { DEFAULT_AVATAR, imageUrl } from '../../config';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface StoreCardProps {
	store: Member;
	/** 1-based position when the list is sorted by rank; top 3 get a badge. */
	rank?: number;
}

/**
 * Store card: blurred-logo cover, follow + like with optimistic counters.
 * The card owns its own mutations, so it works the same on /store and on the home page.
 */
const StoreCard = ({ store, rank }: StoreCardProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);

	const [liked, setLiked] = useState<boolean>(Boolean(store.meLiked?.[0]?.myFavorite));
	const [likes, setLikes] = useState<number>(store.memberLikes ?? 0);
	const [following, setFollowing] = useState<boolean>(Boolean(store.meFollowed?.[0]?.myFollowing));
	const [followers, setFollowers] = useState<number>(store.memberFollowers ?? 0);
	const [busy, setBusy] = useState<boolean>(false);

	/** Server data wins whenever the list is refetched (login, sort change...). */
	useEffect(() => {
		setLiked(Boolean(store.meLiked?.[0]?.myFavorite));
		setLikes(store.memberLikes ?? 0);
		setFollowing(Boolean(store.meFollowed?.[0]?.myFollowing));
		setFollowers(store.memberFollowers ?? 0);
	}, [store]);

	/** APOLLO REQUESTS **/
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);

	const profileHref = { pathname: '/member', query: { memberId: store._id } };
	const avatar = imageUrl(store.memberImage, DEFAULT_AVATAR);
	const hasPhoto = avatar !== DEFAULT_AVATAR;
	const isMe = user?._id === store._id;
	const since = store.createdAt ? new Date(store.createdAt).getFullYear() : null;

	/** HANDLERS **/
	const likeHandler = async () => {
		try {
			if (!user?._id) throw new Error(Message.NOT_AUTHENTICATED);
			const next = !liked;
			setLiked(next);
			setLikes((count) => Math.max(0, count + (next ? 1 : -1)));
			await likeTargetMember({ variables: { input: store._id } });
		} catch (err: any) {
			setLiked(Boolean(store.meLiked?.[0]?.myFavorite));
			setLikes(store.memberLikes ?? 0);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const followHandler = async () => {
		if (busy) return;
		try {
			if (!user?._id) throw new Error(Message.NOT_AUTHENTICATED);
			setBusy(true);
			if (following) await unsubscribe({ variables: { input: store._id } });
			else await subscribe({ variables: { input: store._id } });
			setFollowers((count) => Math.max(0, count + (following ? -1 : 1)));
			setFollowing(!following);
			await sweetTopSmallSuccessAlert(following ? t('Unfollowed') : t('Followed'), 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className={'store-card'}>
			<Link href={profileHref} className={'store-cover'} aria-label={store.memberNick}>
				{hasPhoto && <span className={'cover-photo'} style={{ backgroundImage: `url(${avatar})` }} />}
				{rank && rank <= 3 && <span className={'rank-badge'}>#{rank}</span>}
			</Link>

			<div className={'store-top'}>
				<Link href={profileHref} className={'store-avatar'}>
					<Avatar src={avatar} alt={store.memberNick} />
				</Link>
				<button
					className={`like-btn ${liked ? 'liked' : ''}`}
					onClick={likeHandler}
					aria-label={t('Like') as string}
					aria-pressed={liked}
				>
					{liked ? <FavoriteIcon fontSize={'small'} /> : <FavoriteBorderIcon fontSize={'small'} />}
				</button>
			</div>

			<div className={'store-body'}>
				<Link href={profileHref} className={'store-name'}>
					<strong>{store.memberFullName || store.memberNick}</strong>
					<NorthEastIcon className={'arrow'} />
				</Link>
				<span className={'store-nick'}>@{store.memberNick}</span>
				<p className={'store-desc'}>{store.memberDesc || t('Furniture and home goods, curated for real rooms.')}</p>

				<div className={'store-chips'}>
					<span>
						<PlaceOutlinedIcon />
						{store.memberAddress || t('Online store')}
					</span>
					{since && (
						<span>
							<CalendarTodayOutlinedIcon />
							{t('Since')} {since}
						</span>
					)}
				</div>

				<div className={'store-stats'}>
					<div>
						<strong>{store.memberProducts ?? 0}</strong>
						<span>{t('Products')}</span>
					</div>
					<div>
						<strong>{followers}</strong>
						<span>{t('Followers')}</span>
					</div>
					<div>
						<strong>{likes}</strong>
						<span>{t('Likes')}</span>
					</div>
				</div>

				<div className={'store-actions'}>
					<Link href={profileHref} className={'btn-visit'}>
						{t('Visit store')}
					</Link>
					{!isMe && (
						<button
							className={`btn-follow ${following ? 'following' : ''}`}
							onClick={followHandler}
							disabled={busy}
							aria-pressed={following}
						>
							{following ? <CheckIcon /> : <AddIcon />}
							<span className={'label'}>{following ? t('Following') : t('Follow')}</span>
							{following && <span className={'label-hover'}>{t('Unfollow')}</span>}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default StoreCard;
