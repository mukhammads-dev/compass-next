import { NextPage } from 'next';
import { ChangeEvent, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CircularProgress, Drawer, MenuItem, Pagination, Select, Stack } from '@mui/material';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Filter from '../../libs/components/product/Filter';
import ProductCard from '../../libs/components/common/ProductCard';
import NoData from '../../libs/components/common/NoData';
import useInquiry from '../../libs/hooks/useInquiry';
import { GET_PRODUCTS } from '../../apollo/user/query';
import { LIKE_TARGET_PRODUCT } from '../../apollo/user/mutation';
import { Product } from '../../libs/types/product/product';
import { ProductsInquiry } from '../../libs/types/product/product.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { PRODUCTS_PAGE_LIMIT } from '../../libs/config';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';
import { flipLike, settleLike } from '../../libs/like';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** Sort options must stay inside backend availableProductSorts. */
const SORTS: { id: string; label: string; sort: string; direction: Direction }[] = [
	{ id: 'popular', label: 'Popular', sort: 'productRank', direction: Direction.DESC },
	{ id: 'new', label: 'Newest', sort: 'createdAt', direction: Direction.DESC },
	{ id: 'lowest', label: 'Lowest price', sort: 'productPrice', direction: Direction.ASC },
	{ id: 'highest', label: 'Highest price', sort: 'productPrice', direction: Direction.DESC },
	{ id: 'tours', label: 'Most in Room Tours', sort: 'productRoomTours', direction: Direction.DESC },
];

const initialInput: ProductsInquiry = {
	page: 1,
	limit: PRODUCTS_PAGE_LIMIT,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: {},
};

const ProductList: NextPage = () => {
	const { t } = useTranslation('common');
	const [searchFilter, pushSearchFilter, ready] = useInquiry<ProductsInquiry>(initialInput);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

	/** APOLLO REQUESTS **/
	const [likeTargetProduct] = useMutation(LIKE_TARGET_PRODUCT);

	const {
		loading,
		data: queryData,
		error: queryError,
	} = useQuery(GET_PRODUCTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchFilter },
		skip: !ready,
		notifyOnNetworkStatusChange: true,
	});

	/** cached results show at once on a revisit, fresh ones replace them a moment later */
	useEffect(() => {
		const data: T = queryData;
		if (!data) return;
		setProducts(data?.getProducts?.list ?? []);
		setTotal(data?.getProducts?.metaCounter?.[0]?.total ?? 0);
	}, [queryData]);

	/** HANDLERS **/
	const likeProductHandler = async (user: T, id: string) => {
		if (!id) return;
		if (!user._id) return sweetMixinErrorAlert(Message.NOT_AUTHENTICATED);
		const before = products;
		setProducts((list) => list.map((item) => (item._id === id ? flipLike(item, 'productLikes') : item)));
		try {
			const { data } = await likeTargetProduct({ variables: { input: id } });
			const reply = data?.likeTargetProduct;
			setProducts((list) => list.map((item) => (item._id === id ? settleLike(item, 'productLikes', reply) : item)));
		} catch (err: any) {
			setProducts(before);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const sortHandler = async (id: string) => {
		const option = SORTS.find((item) => item.id === id);
		if (!option) return;
		await pushSearchFilter({ ...searchFilter, page: 1, sort: option.sort, direction: option.direction });
	};

	const paginationHandler = async (_: ChangeEvent<unknown>, value: number) => {
		await pushSearchFilter({ ...searchFilter, page: value });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	/** how many filters are on, for the phone "Filters" button */
	const activeFilters = Object.entries(searchFilter.search ?? {}).filter(
		([key, value]) =>
			key !== 'text' && value !== undefined && value !== null && !(Array.isArray(value) && !value.length),
	).length;

	const currentSort =
		SORTS.find((item) => item.sort === searchFilter.sort && item.direction === searchFilter.direction)?.id ?? 'new';

	return (
		<Stack id={'product-list-page'}>
			<Stack className={'container list-layout'}>
				<aside className={'filters-aside'}>
					<Filter key={JSON.stringify(searchFilter.search)} searchFilter={searchFilter} onChange={pushSearchFilter} />
				</aside>

				<Drawer
					anchor={'bottom'}
					open={filtersOpen}
					onClose={() => setFiltersOpen(false)}
					PaperProps={{ className: 'filter-sheet' }}
				>
					<div className={'sheet-grip'} aria-hidden />
					<div className={'sheet-body'}>
						<Filter key={JSON.stringify(searchFilter.search)} searchFilter={searchFilter} onChange={pushSearchFilter} />
					</div>
					<button type={'button'} className={'btn-dark sheet-done'} onClick={() => setFiltersOpen(false)}>
						{t('Show {{count}} products', { count: total })}
					</button>
				</Drawer>

				<Stack className={'list-main'}>
					<Stack className={'list-toolbar'}>
						<span>
							<strong>{total}</strong> {t('products')}
						</span>
						<button type={'button'} className={'m-filter-btn'} onClick={() => setFiltersOpen(true)}>
							<TuneRoundedIcon fontSize={'small'} />
							{t('Filters')}
							{activeFilters > 0 && <b>{activeFilters}</b>}
						</button>
						<Select size={'small'} value={currentSort} onChange={(e) => sortHandler(e.target.value as string)}>
							{SORTS.map((option) => (
								<MenuItem key={option.id} value={option.id}>
									{t(option.label)}
								</MenuItem>
							))}
						</Select>
					</Stack>

					{(loading || (!queryData && !queryError)) && !products.length ? (
						<Stack className={'loading-box'}>
							<CircularProgress />
						</Stack>
					) : products.length === 0 ? (
						<NoData text={'No products match your filters'} />
					) : (
						<Stack className={'grid grid-3'}>
							{products.map((product: Product) => (
								<ProductCard key={product._id} product={product} likeProductHandler={likeProductHandler} />
							))}
						</Stack>
					)}

					{total > searchFilter.limit && (
						<Stack className={'pagination-config'}>
							<Pagination
								page={searchFilter.page}
								count={Math.ceil(total / searchFilter.limit)}
								onChange={paginationHandler}
								shape={'rounded'}
								color={'primary'}
							/>
						</Stack>
					)}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(ProductList);
