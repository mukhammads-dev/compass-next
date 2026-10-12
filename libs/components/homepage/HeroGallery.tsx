import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import CenterFocusWeakRoundedIcon from '@mui/icons-material/CenterFocusWeakRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { lensPhotoVar } from '../../../apollo/store';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticlesInquiry } from '../../types/board-article/board-article.input';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import { STOCK_ROOMS, imageUrl, unsplash } from '../../config';
import { enumLabel } from '../../utils';
import { T } from '../../types/common';
import usePhotoPicker from '../../hooks/usePhotoPicker';
import HeaderFilter from './HeaderFilter';

interface Slide {
	key: string;
	image: string;
	href: { pathname: string; query?: Record<string, string> };
	caption: string;
	meta: string;
	pin?: { x: number; y: number; label: string };
}

const GALLERY_SIZE = 10;

const initialInput: BoardArticlesInquiry = {
	page: 1,
	limit: GALLERY_SIZE,
	sort: 'articleRank',
	direction: Direction.DESC,
	search: { articleCategory: BoardArticleCategory.ROOM_TOUR },
};

/**
 * Home hero (Nestar idea, Compass content): an endless strip of real homes.
 * Real Room Tours come first; stock interiors fill the strip until there are enough.
 * Your own room photo can be shopped too: pick, drop or paste it anywhere on the hero (Compass Lens).
 */
const HeroGallery = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [roomTours, setRoomTours] = useState<BoardArticle[]>([]);

	const lensHandler = useCallback(
		(file: File) => {
			lensPhotoVar(file);
			router.push('/lens').then();
		},
		[router],
	);
	const { open, dragging, dropProps, inputProps } = usePhotoPicker(lensHandler);

	/** APOLLO REQUESTS **/
	useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		onCompleted: (data: T) => setRoomTours(data?.getBoardArticles?.list ?? []),
	});

	const realSlides: Slide[] = roomTours
		.filter((article) => article.roomImages?.length)
		.map((article) => {
			const tag = article.taggedProducts?.find((item) => item.imageIndex === 0);
			return {
				key: article._id,
				image: imageUrl(article.roomImages[0], ''),
				href: { pathname: '/room-tour/detail', query: { id: article._id } },
				caption: article.articleTitle,
				meta: [article.homeType && t(enumLabel(article.homeType)), article.homeSize && `${article.homeSize}㎡`]
					.filter(Boolean)
					.join(' · '),
				pin: tag ? { x: tag.x, y: tag.y, label: `${article.taggedProducts.length} ${t('products')}` } : undefined,
			};
		});

	const stockSlides: Slide[] = STOCK_ROOMS.map((room) => ({
		key: room.id,
		image: unsplash(room.id, 640),
		href: { pathname: '/room-tour' },
		caption: t(room.caption),
		meta: `${t(enumLabel(room.homeType))} · ${room.homeSize}㎡`,
		pin: { ...room.pin, label: t(room.pin.label) },
	}));

	const slides = [...realSlides, ...stockSlides].slice(0, Math.max(GALLERY_SIZE, realSlides.length));

	const renderSlide = (slide: Slide, index: number, copy: string) => (
		<Link
			key={`${copy}-${slide.key}-${index}`}
			href={slide.href}
			className={`slide ${index % 2 ? 'low' : ''}`}
			// the second copy only exists to make the loop seamless
			aria-hidden={copy === 'b'}
			tabIndex={copy === 'b' ? -1 : undefined}
		>
			<img src={slide.image} alt={slide.caption} loading={index < 5 ? 'eager' : 'lazy'} />
			{slide.pin && (
				<span className={'pin'} style={{ left: `${slide.pin.x}%`, top: `${slide.pin.y}%` }}>
					<i />
					<em>{slide.pin.label}</em>
				</span>
			)}
			<span className={'caption'}>
				<strong>{slide.caption}</strong>
				<small>{slide.meta}</small>
			</span>
		</Link>
	);

	return (
		<Stack className={`header-main ${dragging ? 'is-dragging' : ''}`} {...dropProps}>
			<Stack className={'container hero-head'}>
				<h1>
					<span>{t('See it in a real home.')}</span>
					<span>{t('Make it yours.')}</span>
				</h1>
				<div className={'lens-entry ai-entry'}>
					<button type={'button'} className={'lens-btn ai'} onClick={open}>
						<span className={'ai-scan'} aria-hidden />
						<CenterFocusWeakRoundedIcon />
						{t('Find it from a photo')}
						<span className={'ai-chip'}>
							<AutoAwesomeRoundedIcon />
							AI
						</span>
					</button>
					<input {...inputProps} />
				</div>
			</Stack>

			{dragging && (
				<div className={'lens-drop-veil'} aria-hidden>
					<span>
						<CenterFocusWeakRoundedIcon />
						{t('Drop the photo to search')}
					</span>
				</div>
			)}

			<div className={'hero-gallery'}>
				<div className={'track'}>
					{slides.map((slide, index) => renderSlide(slide, index, 'a'))}
					{slides.map((slide, index) => renderSlide(slide, index, 'b'))}
				</div>
			</div>

			<Stack className={'container hero-filter'}>
				<HeaderFilter />
			</Stack>
		</Stack>
	);
};

export default HeroGallery;
