import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorderRounded';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import { userVar } from '../../../apollo/store';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { Member } from '../../types/member/member';
import { DEFAULT_AVATAR, imageUrl } from '../../config';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert } from '../../sweetAlert';

interface StoreCardProps {
	store: Member;
}

/**
 * Store card as a shop window: the store's newest pieces come first,
 * so you see what they sell before you read who they are.
 * Follow + like are optimistic.
 * The card owns its own mutations, so it works the same on /store and on the home page.
 */
const StoreCard = ({ store }: StoreCardProps) => {
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
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setBusy(false);
		}
	};

	/** "Seongsu-dong 2-ga, Seongdong-gu, Seoul" → "Seongdong-gu, Seoul": the part people recognise */
	const area = store.memberAddress ? store.memberAddress.split(',').slice(-2).join(',').trim() : t('Online store');
	const windowPhotos = (store.storeWindow ?? []).filter(Boolean).slice(0, 3);

	return (
		<article className={'sf-card'}>
			<Link href={profileHref} className={'sf-window'} aria-label={store.memberNick} tabIndex={-1}>
				{windowPhotos.length ? (
					<span className={`sf-panes n${windowPhotos.length}`}>
						{windowPhotos.map((image) => (
							<img key={image} src={imageUrl(image, '')} alt={''} loading={'lazy'} />
						))}
					</span>
				) : (
					<span className={'sf-panes empty'}>
						{hasPhoto && <img src={avatar} alt={''} />}
						<em>{t('The window is being dressed')}</em>
					</span>
				)}
			</Link>

			<div className={'media-actions'}>
				<button
					type={'button'}
					className={`media-btn like ${liked ? 'on' : ''}`}
					onClick={likeHandler}
					aria-label={t('Like') as string}
					aria-pressed={liked}
				>
					{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
					{likes > 0 && <span>{likes}</span>}
				</button>
			</div>

			<div className={'sf-body'}>
				<div className={'sf-id'}>
					<Link href={profileHref} className={'sf-avatar'}>
						<Avatar src={avatar} alt={store.memberNick} />
					</Link>
					<div className={'sf-name'}>
						<Link href={profileHref}>
							<strong>{store.memberFullName || store.memberNick}</strong>
						</Link>
						<span>
							<PlaceOutlinedIcon />
							{area}
						</span>
					</div>
					{!isMe && (
						<button
							type={'button'}
							className={`sf-follow ${following ? 'on' : ''}`}
							onClick={followHandler}
							disabled={busy}
							aria-pressed={following}
						>
							{following ? <CheckIcon /> : <AddIcon />}
							{following ? t('Following') : t('Follow')}
						</button>
					)}
				</div>

				<p className={'sf-desc'}>{store.memberDesc || t('Furniture and home goods, curated for real rooms.')}</p>

				<Link href={profileHref} className={'sf-ledger'}>
					<span>
						<b>{store.memberProducts ?? 0}</b> {t('pieces')}
					</span>
					<span>
						<b>{followers}</b> {t('Followers')}
					</span>
					<span className={'sf-visit'}>
						{t('Visit store')}
						<NorthEastIcon />
					</span>
				</Link>
			</div>
		</article>
	);
};

export default StoreCard;
