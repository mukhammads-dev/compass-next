import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Slider, Stack } from '@mui/material';
import { GET_PRODUCTS } from '../../../apollo/user/query';
import { Product } from '../../types/product/product';
import { ProductsInquiry } from '../../types/product/product.input';
import { Direction } from '../../enums/common.enum';
import { DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../config';
import { formatPrice } from '../../utils';
import { T } from '../../types/common';

const MIN_CM = 60;
const MAX_CM = 300;

/** Plan-view drawing: the wall you have, and the widest piece that fits on it. */
const WallDrawing = ({ wall, piece }: { wall: number; piece: number | null }) => {
	const scale = 520 / MAX_CM;
	const wallW = wall * scale;
	const x0 = (560 - wallW) / 2;
	const pieceW = piece ? Math.min(piece, wall) * scale : 0;
	return (
		<svg viewBox={'0 0 560 200'} className={'wall-drawing'} role={'img'} aria-label={`${wall} cm`}>
			{/* dimension line */}
			<line x1={x0} y1={28} x2={x0 + wallW} y2={28} className={'dim'} />
			<line x1={x0} y1={18} x2={x0} y2={38} className={'dim'} />
			<line x1={x0 + wallW} y1={18} x2={x0 + wallW} y2={38} className={'dim'} />
			<text x={280} y={16} textAnchor={'middle'} className={'dim-label'}>
				{wall} cm
			</text>
			{/* wall */}
			<rect x={x0} y={50} width={wallW} height={10} rx={2} className={'wall'} />
			{/* the piece, drawn as a simple sofa in plan */}
			{piece ? (
				<g transform={`translate(${280 - pieceW / 2}, 66)`} className={'piece'}>
					<rect width={pieceW} height={84} rx={14} />
					<rect x={8} y={6} width={pieceW - 16} height={22} rx={8} className={'back'} />
					<text x={pieceW / 2} y={64} textAnchor={'middle'} className={'piece-label'}>
						{piece} cm
					</text>
				</g>
			) : null}
		</svg>
	);
};

/** "Will it fit?" — the Compass feature people do not get elsewhere, as a live control. */
const FitsMySpace = () => {
	const { t } = useTranslation('common');
	const [width, setWidth] = useState<number>(180);
	const [query, setQuery] = useState<number>(180);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** Wait for the slider to settle before asking the server. */
	useEffect(() => {
		const timer = window.setTimeout(() => setQuery(width), 250);
		return () => window.clearTimeout(timer);
	}, [width]);

	const inquiry: ProductsInquiry = {
		page: 1,
		limit: 3,
		sort: 'productWidth',
		direction: Direction.DESC,
		search: { sizeFit: { maxWidth: query } },
	};

	/** APOLLO REQUESTS **/
	const { loading } = useQuery(GET_PRODUCTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setProducts(data?.getProducts?.list ?? []);
			setTotal(data?.getProducts?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const shopHref = {
		pathname: '/product',
		query: { input: JSON.stringify({ ...inquiry, limit: 12, sort: 'productRank' }) },
	};

	return (
		<Stack className={'home-section fits-space'}>
			<Stack className={'container'}>
				<div className={'fits-panel'}>
					<div className={'fits-control'}>
						<h2>{t('Will it fit?')}</h2>
						<p>{t('Slide to the width of your wall. Every product on Compass has real measurements.')}</p>
						<WallDrawing wall={width} piece={products[0]?.productWidth ?? null} />
						<Slider
							value={width}
							min={MIN_CM}
							max={MAX_CM}
							step={10}
							onChange={(_, value) => setWidth(value as number)}
							aria-label={t('Wall width') as string}
							valueLabelDisplay={'auto'}
							valueLabelFormat={(value) => `${value} cm`}
						/>
					</div>

					<div className={`fits-result ${loading ? 'is-loading' : ''}`} aria-live={'polite'}>
						<div className={'fits-count'}>
							<strong>{total}</strong>
							<span>{t('pieces fit a {{width}} cm wall', { width: query })}</span>
						</div>
						<div className={'fits-list'}>
							{products.map((product) => (
								<Link
									key={product._id}
									href={{ pathname: '/product/detail', query: { id: product._id } }}
									className={'fits-item'}
								>
									<img
										src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)}
										alt={product.productTitle}
										loading={'lazy'}
									/>
									<span className={'title'}>{product.productTitle}</span>
									<span className={'size'}>
										{product.productWidth} × {product.productDepth} cm
									</span>
									<strong>{formatPrice(product.productSalePrice || product.productPrice)}</strong>
								</Link>
							))}
						</div>
						<Link href={shopHref} className={'fits-cta'}>
							{t('See everything that fits')}
						</Link>
					</div>
				</div>
			</Stack>
		</Stack>
	);
};

export default FitsMySpace;
