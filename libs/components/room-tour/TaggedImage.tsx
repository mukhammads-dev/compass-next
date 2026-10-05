import Link from 'next/link';
import { MouseEvent, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { IconButton, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { Product } from '../../types/product/product';
import { TaggedProduct } from '../../types/board-article/board-article';
import { DEFAULT_PRODUCT_IMAGE, DEFAULT_ROOM_IMAGE, imageUrl } from '../../config';
import { discountPercent, formatPrice } from '../../utils';

interface TaggedImageProps {
	images: string[];
	tags: TaggedProduct[];
	products?: Product[];
	/** edit mode: clicking the photo reports the position in percent (0-100) */
	onPickPosition?: (imageIndex: number, x: number, y: number) => void;
	onRemoveTag?: (tagIndex: number) => void;
}

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Room Tour photo with product pins. x / y are percentages, so pins stay in place at any size.
 * View mode: tap a pin → product card. Edit mode: tap the photo → onPickPosition.
 */
const TaggedImage = (props: TaggedImageProps) => {
	const { images, tags, products = [], onPickPosition, onRemoveTag } = props;
	const { t } = useTranslation('common');
	const [imageIndex, setImageIndex] = useState<number>(0);
	const [openTag, setOpenTag] = useState<number | null>(null);
	const editable = Boolean(onPickPosition);
	const safeImages = images.length ? images : [''];

	/** HANDLERS **/
	const pickPositionHandler = (e: MouseEvent<HTMLDivElement>) => {
		if (!onPickPosition) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = round(((e.clientX - rect.left) / rect.width) * 100);
		const y = round(((e.clientY - rect.top) / rect.height) * 100);
		onPickPosition(imageIndex, Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
	};

	const changeImageHandler = (step: number) => {
		setOpenTag(null);
		setImageIndex((prev) => (prev + step + safeImages.length) % safeImages.length);
	};

	const findProduct = (productId: string) => products.find((product) => product._id === productId);

	return (
		<Stack className={`tagged-image ${editable ? 'editable' : ''}`}>
			<div className={'stage'} onClick={pickPositionHandler}>
				<img src={imageUrl(safeImages[imageIndex], DEFAULT_ROOM_IMAGE)} alt={''} />

				{tags.map((tag, index) => {
					if (tag.imageIndex !== imageIndex) return null;
					const product = findProduct(tag.productId);
					const price = product
						? discountPercent(product.productPrice, product.productSalePrice) > 0
							? product.productSalePrice
							: product.productPrice
						: undefined;
					return (
						<div
							key={`${tag.productId}-${index}`}
							className={`pin ${openTag === index ? 'open' : ''}`}
							style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
							onClick={(e) => e.stopPropagation()}
						>
							<button className={'pin-dot'} onClick={() => setOpenTag(openTag === index ? null : index)}>
								+
							</button>
							{openTag === index && (
								<div className={`pin-card ${tag.x > 60 ? 'left' : ''}`}>
									{product ? (
										<Link href={{ pathname: '/product/detail', query: { id: product._id } }}>
											<img src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)} alt={''} />
											<span>
												<em>{product.memberData?.memberNick}</em>
												<strong>{product.productTitle}</strong>
												<b>{formatPrice(price)}</b>
											</span>
										</Link>
									) : (
										<span className={'pin-missing'}>{t('Product is no longer available')}</span>
									)}
									{onRemoveTag && (
										<IconButton size={'small'} className={'pin-remove'} onClick={() => onRemoveTag(index)}>
											<CloseIcon fontSize={'inherit'} />
										</IconButton>
									)}
								</div>
							)}
						</div>
					);
				})}

				{safeImages.length > 1 && (
					<>
						<IconButton
							className={'nav prev'}
							onClick={(e) => {
								e.stopPropagation();
								changeImageHandler(-1);
							}}
						>
							<ChevronLeftIcon />
						</IconButton>
						<IconButton
							className={'nav next'}
							onClick={(e) => {
								e.stopPropagation();
								changeImageHandler(1);
							}}
						>
							<ChevronRightIcon />
						</IconButton>
						<span className={'counter'}>
							{imageIndex + 1} / {safeImages.length}
						</span>
					</>
				)}
			</div>

			{editable && <p className={'edit-hint'}>{t('Tap the photo where the product is to place a pin')}</p>}
		</Stack>
	);
};

export default TaggedImage;
