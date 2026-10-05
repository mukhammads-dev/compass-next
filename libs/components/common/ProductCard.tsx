import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { userVar } from '../../../apollo/store';
import { Product } from '../../types/product/product';
import { ProductCondition, ProductStatus } from '../../enums/product.enum';
import { DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../config';
import { discountPercent, enumLabel, formatPrice } from '../../utils';
import { T } from '../../types/common';

interface ProductCardProps {
	product: Product;
	likeProductHandler?: (user: T, id: string) => void;
	compact?: boolean;
}

/** Presentational: the parent owns the like mutation and the refetch. */
const ProductCard = (props: ProductCardProps) => {
	const { product, likeProductHandler, compact } = props;
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const discount = discountPercent(product.productPrice, product.productSalePrice);
	const liked = Boolean(product?.meLiked?.[0]?.myFavorite);
	const detailHref = { pathname: '/product/detail', query: { id: product._id } };

	return (
		<Stack className={`product-card ${compact ? 'compact' : ''}`}>
			<Link href={detailHref} className={'thumb'}>
				<img src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)} alt={product.productTitle} loading={'lazy'} />
				{product.productImages?.[1] && (
					/* second photo slides in on hover: shows the piece from another angle */
					<img className={'alt-photo'} src={imageUrl(product.productImages[1], '')} alt={''} loading={'lazy'} />
				)}
				<Stack className={'badges'}>
					{discount > 0 && <span className={'badge sale'}>-{discount}%</span>}
					{product.productCondition === ProductCondition.USED && <span className={'badge used'}>{t('Used')}</span>}
				</Stack>
				{product.productStatus === ProductStatus.SOLD && <span className={'sold-veil'}>{t('Sold')}</span>}
			</Link>

			{likeProductHandler ? (
				<button
					className={`like-chip ${liked ? 'liked' : ''}`}
					aria-label={'like'}
					onClick={() => likeProductHandler(user, product._id)}
				>
					{liked ? <FavoriteIcon fontSize={'inherit'} /> : <FavoriteBorderIcon fontSize={'inherit'} />}
					<span>{product.productLikes}</span>
				</button>
			) : (
				<span className={'like-chip static'}>
					<FavoriteBorderIcon fontSize={'inherit'} />
					<span>{product.productLikes}</span>
				</span>
			)}

			<Stack className={'info'}>
				<Stack className={'info-top'}>
					<span className={'store'}>{product.memberData?.memberNick ?? t(enumLabel(product.productType))}</span>
					{product.productRoomTours > 0 && (
						<span className={'in-tours'}>
							{product.productRoomTours} {t('Room Tours')}
						</span>
					)}
				</Stack>
				<Link href={detailHref} className={'title'}>
					{product.productTitle}
				</Link>
				<Stack className={'price-row'}>
					{discount > 0 ? (
						<>
							<strong className={'sale'}>{formatPrice(product.productSalePrice)}</strong>
							<del>{formatPrice(product.productPrice)}</del>
						</>
					) : (
						<strong>{formatPrice(product.productPrice)}</strong>
					)}
				</Stack>
				{!compact && (
					<span className={'meta'}>
						{`${product.productWidth}×${product.productDepth}×${product.productHeight}cm`} ·{' '}
						{t(enumLabel(product.productLocation))}
					</span>
				)}
			</Stack>
		</Stack>
	);
};

export default ProductCard;
