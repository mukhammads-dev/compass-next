import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { GET_PRODUCTS } from '../../../apollo/user/query';
import { Product } from '../../types/product/product';
import { ProductsInquiry } from '../../types/product/product.input';
import { ProductStyle } from '../../enums/product.enum';
import { Direction } from '../../enums/common.enum';
import { DEFAULT_PRODUCT_IMAGE, STYLE_PHOTOS, imageUrl, unsplash } from '../../config';
import { enumLabel, formatPrice } from '../../utils';
import { T } from '../../types/common';

const MAX_PICKS = 3;

/**
 * "Find your style": pick the rooms you like, get products in those styles.
 * The picks are the filter — no quiz screens, no sign-up. One room starts picked so the panel shows how it works.
 */
const StyleQuiz = () => {
	const { t } = useTranslation('common');
	const [picks, setPicks] = useState<ProductStyle[]>([ProductStyle.SCANDINAVIAN]);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState<number>(0);

	const inquiry: ProductsInquiry = {
		page: 1,
		limit: 4,
		sort: 'productRank',
		direction: Direction.DESC,
		search: { styleList: picks },
	};

	/** APOLLO REQUESTS **/
	const { loading, data: queryResult } = useQuery(GET_PRODUCTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: inquiry },
		skip: picks.length === 0,
		notifyOnNetworkStatusChange: true,
	});
	/* read the result on every change, cache hits included (onCompleted skips those) */
	useEffect(() => {
		const data: T = queryResult;
		if (!data) return;
		setProducts(data?.getProducts?.list ?? []);
		setTotal(data?.getProducts?.metaCounter?.[0]?.total ?? 0);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryResult]);

	/** HANDLERS **/
	const togglePick = (style: ProductStyle) => {
		setPicks((current) => {
			if (current.includes(style)) return current.filter((item) => item !== style);
			if (current.length >= MAX_PICKS) return [...current.slice(1), style];
			return [...current, style];
		});
	};

	const shopHref = {
		pathname: '/product',
		query: { input: JSON.stringify({ ...inquiry, limit: 12 }) },
	};
	const pickedNames = picks.map((style) => t(enumLabel(style)));

	return (
		<Stack className={'home-section style-quiz'}>
			<Stack className={'container'}>
				<div className={'quiz-layout'}>
					<div className={'quiz-intro'}>
						<h2>{t('Which room feels like home?')}</h2>
					</div>

					<div className={'quiz-rooms'}>
						{STYLE_PHOTOS.map(({ style, photo }) => {
							const order = picks.indexOf(style);
							return (
								<button
									key={style}
									className={`quiz-room ${order >= 0 ? 'picked' : ''}`}
									onClick={() => togglePick(style)}
									aria-pressed={order >= 0}
								>
									<img src={unsplash(photo, 520)} alt={t(enumLabel(style)) as string} loading={'lazy'} />
									<span className={'mark'}>{order >= 0 ? <CheckIcon /> : null}</span>
									<span className={'name'}>{t(enumLabel(style))}</span>
								</button>
							);
						})}
					</div>

					<div className={`quiz-result ${picks.length ? 'has-picks' : ''}`} aria-live={'polite'}>
						{picks.length === 0 ? (
							<p className={'quiz-empty'}>{t('Your matches will appear here.')}</p>
						) : (
							<>
								<div className={'result-head'}>
									<strong>{pickedNames.join(' + ')}</strong>
									<span>
										{total} {t(total === 1 ? 'piece matches' : 'pieces match')}
									</span>
								</div>
								<div className={`result-list ${loading ? 'is-loading' : ''}`}>
									{products.map((product) => (
										<Link
											key={product._id}
											href={{ pathname: '/product/detail', query: { id: product._id } }}
											className={'result-item'}
										>
											<img
												src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)}
												alt={product.productTitle}
												loading={'lazy'}
											/>
											<span>{product.productTitle}</span>
											<strong>{formatPrice(product.productSalePrice || product.productPrice)}</strong>
										</Link>
									))}
									{!loading && products.length === 0 && (
										<p className={'quiz-empty'}>{t('No products in these styles yet. Try another room.')}</p>
									)}
								</div>
								{total > 0 && (
									<Link href={shopHref} className={'result-cta'}>
										{t('Shop this style')}
									</Link>
								)}
							</>
						)}
					</div>
				</div>
			</Stack>
		</Stack>
	);
};

export default StyleQuiz;
