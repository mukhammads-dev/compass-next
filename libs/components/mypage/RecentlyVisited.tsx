import { ChangeEvent, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Pagination, Stack } from '@mui/material';
import { GET_VISITED } from '../../../apollo/user/query';
import { Product } from '../../types/product/product';
import { OrdinaryInquiry } from '../../types/product/product.input';
import ProductCard from '../common/ProductCard';
import NoData from '../common/NoData';
import { T } from '../../types/common';

const RecentlyVisited = () => {
	const { t } = useTranslation('common');
	const [inquiry, setInquiry] = useState<OrdinaryInquiry>({ page: 1, limit: 9 });
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	useQuery(GET_VISITED, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setProducts(data?.getVisited?.list ?? []);
			setTotal(data?.getVisited?.metaCounter?.[0]?.total ?? 0);
		},
	});

	return (
		<Stack className={'my-section'}>
			<h2>{t('Recently viewed')}</h2>
			{products.length === 0 ? (
				<NoData text={'You have not viewed any products yet'} />
			) : (
				<Stack className={'grid grid-3'}>
					{products.map((product) => (
						<ProductCard key={product._id} product={product} />
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

export default RecentlyVisited;
