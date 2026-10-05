import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import { GET_PRODUCTS } from '../../../apollo/user/query';
import { ProductsInquiry } from '../../types/product/product.input';
import { ProductType } from '../../enums/product.enum';
import { Direction } from '../../enums/common.enum';
import { CATEGORY_PHOTOS, imageUrl, productTypes, unsplash } from '../../config';
import { enumLabel } from '../../utils';
import { T } from '../../types/common';

const listHref = (type: string) => ({
	pathname: '/product',
	query: {
		input: JSON.stringify({ page: 1, limit: 12, sort: 'productRank', direction: 'DESC', search: { typeList: [type] } }),
	},
});

/**
 * One circle = one tiny query (limit 1): the category's most popular product gives the photo,
 * metaCounter gives the real product count. A stock photo stands in until a product exists.
 */
const CategoryCircle = ({ type }: { type: string }) => {
	const { t } = useTranslation('common');
	const [photo, setPhoto] = useState<string>(unsplash(CATEGORY_PHOTOS[type], 320));
	const [total, setTotal] = useState<number>(0);

	const inquiry: ProductsInquiry = {
		page: 1,
		limit: 1,
		sort: 'productRank',
		direction: Direction.DESC,
		search: { typeList: [type as ProductType] },
	};

	/** APOLLO REQUESTS **/
	useQuery(GET_PRODUCTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: inquiry },
		onCompleted: (data: T) => {
			const top = data?.getProducts?.list?.[0];
			if (top?.productImages?.[0]) setPhoto(imageUrl(top.productImages[0], photo));
			setTotal(data?.getProducts?.metaCounter?.[0]?.total ?? 0);
		},
	});

	return (
		<Link href={listHref(type)} className={'cat-circle'}>
			<span className={'ring'}>
				<img src={photo} alt={''} loading={'lazy'} />
			</span>
			<strong>{t(enumLabel(type))}</strong>
			{total > 0 && (
				<small>
					{total} {t(total === 1 ? 'product' : 'products')}
				</small>
			)}
		</Link>
	);
};

const CategoryCircles = () => {
	const { t } = useTranslation('common');
	return (
		<Stack className={'home-section'}>
			<Stack className={'container'}>
				<Stack className={'section-head'}>
					<h2>{t('Shop by category')}</h2>
				</Stack>
				<div className={'cat-circles'}>
					{productTypes.map((type) => (
						<CategoryCircle key={type} type={type} />
					))}
				</div>
			</Stack>
		</Stack>
	);
};

export default CategoryCircles;
