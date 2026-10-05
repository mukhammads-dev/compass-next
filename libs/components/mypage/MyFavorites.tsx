import { ChangeEvent, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Pagination, Stack } from '@mui/material';
import { GET_FAVORITES } from '../../../apollo/user/query';
import { LIKE_TARGET_PRODUCT } from '../../../apollo/user/mutation';
import { Product } from '../../types/product/product';
import { OrdinaryInquiry } from '../../types/product/product.input';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import ProductCard from '../common/ProductCard';
import NoData from '../common/NoData';
import { T } from '../../types/common';

/** Every item here is liked by me, so the heart is shown filled. */
const markLiked = (list: Product[] = []): Product[] =>
	list.map((product) => ({ ...product, meLiked: [{ memberId: '', likeRefId: product._id, myFavorite: true }] }));

const MyFavorites = () => {
	const { t } = useTranslation('common');
	const [inquiry, setInquiry] = useState<OrdinaryInquiry>({ page: 1, limit: 9 });
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetProduct] = useMutation(LIKE_TARGET_PRODUCT);

	const { refetch: getFavoritesRefetch } = useQuery(GET_FAVORITES, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setProducts(markLiked(data?.getFavorites?.list));
			setTotal(data?.getFavorites?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const likeProductHandler = async (_user: T, id: string) => {
		try {
			await likeTargetProduct({ variables: { input: id } });
			const { data } = await getFavoritesRefetch({ input: inquiry });
			setProducts(markLiked(data?.getFavorites?.list));
			setTotal(data?.getFavorites?.metaCounter?.[0]?.total ?? 0);
		} catch (err: any) {
			console.log('ERROR, likeProductHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack className={'my-section'}>
			<h2>{t('Favorites')}</h2>
			{products.length === 0 ? (
				<NoData text={'No favorites yet. Tap ♥ on products you like.'} />
			) : (
				<Stack className={'grid grid-3'}>
					{products.map((product) => (
						<ProductCard key={product._id} product={product} likeProductHandler={likeProductHandler} />
					))}
				</Stack>
			)}
			{total > inquiry.limit && (
				<Pagination
					page={inquiry.page}
					count={Math.ceil(total / inquiry.limit)}
					onChange={(_: ChangeEvent<unknown>, value: number) => setInquiry({ ...inquiry, page: value })}
					shape={'rounded'}
					color={'primary'}
				/>
			)}
		</Stack>
	);
};

export default MyFavorites;
