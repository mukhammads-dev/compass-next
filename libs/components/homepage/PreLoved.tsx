import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import { GET_PRODUCTS } from '../../../apollo/user/query';
import { Product } from '../../types/product/product';
import { ProductsInquiry } from '../../types/product/product.input';
import { ProductCondition } from '../../enums/product.enum';
import { Direction } from '../../enums/common.enum';
import { DEFAULT_PRODUCT_IMAGE, MAX_ACTIVE_USED_LISTINGS, imageUrl } from '../../config';
import { enumLabel, formatPrice } from '../../utils';
import { T } from '../../types/common';

const inquiry: ProductsInquiry = {
	page: 1,
	limit: 4,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: { conditionList: [ProductCondition.USED] },
};

/**
 * Used furniture gets its own look: kraft paper and a hand-tied price tag,
 * so it never reads like the new-from-store shelves above it.
 */
const PreLoved = () => {
	const { t } = useTranslation('common');
	const [products, setProducts] = useState<Product[]>([]);

	/** APOLLO REQUESTS **/
	useQuery(GET_PRODUCTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: inquiry },
		onCompleted: (data: T) => setProducts(data?.getProducts?.list ?? []),
	});

	const allHref = { pathname: '/product', query: { input: JSON.stringify({ ...inquiry, limit: 12 }) } };

	return (
		<Stack className={'home-section pre-loved'}>
			<Stack className={'container'}>
				<div className={'loved-layout'}>
					<div className={'loved-intro'}>
						<h2>{t('Pre-loved, from your neighbours')}</h2>
						<p>
							{t('Good furniture deserves a second home. Buy used pieces from people in your city, or list up to {{count}} of your own for free.', {
								count: MAX_ACTIVE_USED_LISTINGS,
							})}
						</p>
						<div className={'loved-actions'}>
							<Link href={allHref} className={'btn-dark'}>
								{t('Browse used')}
							</Link>
							<Link href={{ pathname: '/mypage', query: { category: 'addProduct' } }} className={'btn-line'}>
								{t('Sell your furniture')}
							</Link>
						</div>
					</div>

					<div className={'loved-items'}>
						{products.map((product, index) => (
							<Link
								key={product._id}
								href={{ pathname: '/product/detail', query: { id: product._id } }}
								className={'loved-item'}
								style={{ ['--tilt' as string]: `${[-3, 2, -1.5, 3][index % 4]}deg` }}
							>
								<span className={'photo'}>
									<img
										src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)}
										alt={product.productTitle}
										loading={'lazy'}
									/>
								</span>
								<span className={'price-tag'}>
									<strong>{formatPrice(product.productSalePrice || product.productPrice)}</strong>
									<small>{t(enumLabel(product.productLocation))}</small>
								</span>
								<span className={'title'}>{product.productTitle}</span>
							</Link>
						))}
						{products.length === 0 && (
							<p className={'loved-empty'}>{t('No used pieces listed yet. Be the first to sell one.')}</p>
						)}
					</div>
				</div>
			</Stack>
		</Stack>
	);
};

export default PreLoved;
