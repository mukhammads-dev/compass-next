import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

interface MediaActionsProps {
	liked: boolean;
	likes: number;
	onLike: () => void;
	title: string;
}

/**
 * Two quiet round buttons over the top-right corner of a photo: like and share.
 * Share opens the phone's share sheet, or copies the link on a desktop; the icon confirms, no popup.
 */
const MediaActions = ({ liked, likes, onLike, title }: MediaActionsProps) => {
	const { t } = useTranslation('common');
	const [copied, setCopied] = useState<boolean>(false);

	const shareHandler = async () => {
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({ title, url });
				return;
			}
			await navigator.clipboard.writeText(url);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			/* the person closed the share sheet */
		}
	};

	return (
		<div className={'media-actions'}>
			<button
				type={'button'}
				className={`media-btn like ${liked ? 'on' : ''}`}
				onClick={onLike}
				aria-pressed={liked}
				aria-label={t(liked ? 'Unlike' : 'Like') as string}
			>
				{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				{likes > 0 && <span>{likes}</span>}
			</button>
			<button
				type={'button'}
				className={`media-btn ${copied ? 'on' : ''}`}
				onClick={shareHandler}
				aria-label={t(copied ? 'Link copied' : 'Share') as string}
				title={t(copied ? 'Link copied' : 'Share') as string}
			>
				{copied ? <CheckRoundedIcon /> : <IosShareRoundedIcon />}
			</button>
		</div>
	);
};

export default MediaActions;
