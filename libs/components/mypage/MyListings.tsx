import Link from 'next/link';
import { ChangeEvent, useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Button, Pagination, Stack, Tab, Tabs } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { GET_AGENT_PRODUCTS } from '../../../apollo/user/query';
import { UPDATE_PRODUCT } from '../../../apollo/user/mutation';
import { Product } from '../../types/product/product';
import { AgentProductsInquiry } from '../../types/product/product.input';
import { ProductUpdate } from '../../types/product/product.update';
import { ProductStatus } from '../../enums/product.enum';
import { Direction } from '../../enums/common.enum';
import { isAgent } from '../../auth';
import { DEFAULT_PRODUCT_IMAGE, MAX_ACTIVE_USED_LISTINGS, imageUrl } from '../../config';
import { formatPrice } from '../../utils';
import { sweetConfirmAlert, sweetMixinErrorAlert } from '../../sweetAlert';
import NoData from '../common/NoData';
import { T } from '../../types/common';

const MyListings = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [productInquiry, setProductInquiry] = useState<AgentProductsInquiry>({
		page: 1,
		limit: 8,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { productStatus: ProductStatus.ACTIVE },
	});
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [updateProduct] = useMutation<unknown, { input: ProductUpdate }>(UPDATE_PRODUCT);

	const { refetch: getAgentProductsRefetch } = useQuery(GET_AGENT_PRODUCTS, {
		fetchPolicy: 'network-only',
		variables: { input: productInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setProducts(data?.getAgentProducts?.list ?? []);
			setTotal(data?.getAgentProducts?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const changeStatusHandler = async (product: Product, productStatus: ProductStatus) => {
		try {
			const question = productStatus === ProductStatus.SOLD ? 'Mark this product as sold?' : 'Delete this product?';
			if (!(await sweetConfirmAlert(t(question) as string))) return;
			await updateProduct({ variables: { input: { _id: product._id, productStatus } } });
			const { data } = await getAgentProductsRefetch({ input: productInquiry });
			setProducts(data?.getAgentProducts?.list ?? []);
			setTotal(data?.getAgentProducts?.metaCounter?.[0]?.total ?? 0);
		} catch (err: any) {
			console.log('ERROR, changeStatusHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack className={'my-section'}>
			<Stack className={'section-title'}>
				<h2>{isAgent(user) ? t('My products') : t('My used listings')}</h2>
				<Link href={{ pathname: '/mypage', query: { category: 'addProduct' } }}>
					<Button variant={'contained'}>{isAgent(user) ? t('Add product') : t('Sell an item')}</Button>
				</Link>
			</Stack>
			{!isAgent(user) && (
				<p className={'muted'}>
					{t('You can have up to')} {MAX_ACTIVE_USED_LISTINGS} {t('active used listings.')}
				</p>
			)}

			<Tabs
				value={productInquiry.search.productStatus}
				onChange={(_, value: ProductStatus) =>
					setProductInquiry({ ...productInquiry, page: 1, search: { productStatus: value } })
				}
			>
				<Tab value={ProductStatus.ACTIVE} label={t('On sale')} />
				<Tab value={ProductStatus.SOLD} label={t('Sold')} />
			</Tabs>

			{products.length === 0 ? (
				<NoData text={'No products here'} />
			) : (
				<Stack className={'listing-table'}>
					{products.map((product) => (
						<Stack key={product._id} className={'listing-row'}>
							<Link href={{ pathname: '/product/detail', query: { id: product._id } }} className={'listing-main'}>
								<img src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)} alt={''} />
								<Stack>
									<strong>{product.productTitle}</strong>
									<span>{formatPrice(product.productSalePrice ?? product.productPrice)}</span>
									<span className={'muted'}>
										{moment(product.createdAt).format('YYYY.MM.DD')} · {t('Likes')} {product.productLikes} ·{' '}
										{t('Views')} {product.productViews}
									</span>
								</Stack>
							</Link>
							{product.productStatus === ProductStatus.ACTIVE && (
								<Stack className={'listing-actions'}>
									<Link href={{ pathname: '/mypage', query: { category: 'addProduct', productId: product._id } }}>
										<Button size={'small'} variant={'outlined'}>
											{t('Edit')}
										</Button>
									</Link>
									<Button
										size={'small'}
										variant={'outlined'}
										onClick={() => changeStatusHandler(product, ProductStatus.SOLD)}
									>
										{t('Sold')}
									</Button>
									<Button
										size={'small'}
										color={'error'}
										onClick={() => changeStatusHandler(product, ProductStatus.DELETE)}
									>
										{t('Delete')}
									</Button>
								</Stack>
							)}
						</Stack>
					))}
				</Stack>
			)}

			{total > productInquiry.limit && (
				<Pagination
					page={productInquiry.page}
					count={Math.ceil(total / productInquiry.limit)}
					onChange={(_: ChangeEvent<unknown>, value: number) => setProductInquiry({ ...productInquiry, page: value })}
					shape={'rounded'}
					color={'primary'}
				/>
			)}
		</Stack>
	);
};

export default MyListings;
