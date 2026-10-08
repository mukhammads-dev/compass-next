import { NextPage } from 'next';
import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import ProductList from '../../../libs/components/admin/products/ProductList';
import AdminHeader from '../../../libs/components/admin/common/AdminHeader';
import AdminSegments from '../../../libs/components/admin/common/AdminSegments';
import AdminSearch from '../../../libs/components/admin/common/AdminSearch';
import AdminPager from '../../../libs/components/admin/common/AdminPager';
import NoData from '../../../libs/components/common/NoData';
import { GET_ALL_PRODUCTS_BY_ADMIN } from '../../../apollo/admin/query';
import { REMOVE_PRODUCT_BY_ADMIN, UPDATE_PRODUCT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Product } from '../../../libs/types/product/product';
import { AllProductsInquiry } from '../../../libs/types/product/product.input';
import { ProductStatus } from '../../../libs/enums/product.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const initialInquiry: AllProductsInquiry = {
	page: 1,
	limit: 20,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: {},
};

const AdminProducts: NextPage = () => {
	const [productsInquiry, setProductsInquiry] = useState<AllProductsInquiry>(initialInquiry);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [updateProductByAdmin] = useMutation(UPDATE_PRODUCT_BY_ADMIN);
	const [removeProductByAdmin] = useMutation(REMOVE_PRODUCT_BY_ADMIN);

	const { refetch: getAllProductsRefetch } = useQuery(GET_ALL_PRODUCTS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: productsInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setProducts(data?.getAllProductsByAdmin?.list ?? []);
			setTotal(data?.getAllProductsByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const reload = async () => {
		const { data } = await getAllProductsRefetch({ input: productsInquiry });
		setProducts(data?.getAllProductsByAdmin?.list ?? []);
		setTotal(data?.getAllProductsByAdmin?.metaCounter?.[0]?.total ?? 0);
	};

	const updateProductHandler = async (id: string, productStatus: ProductStatus) => {
		try {
			if (productStatus === ProductStatus.DELETE && !(await sweetConfirmAlert('Hide this product from the store?')))
				return;
			await updateProductByAdmin({ variables: { input: { _id: id, productStatus } } });
			await reload();
			await sweetTopSmallSuccessAlert('Updated', 800);
		} catch (err: any) {
			console.log('ERROR, updateProductHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const removeProductHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert('Permanently remove this product? This cannot be undone.'))) return;
			await removeProductByAdmin({ variables: { input: id } });
			await reload();
		} catch (err: any) {
			console.log('ERROR, removeProductHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const changeSearch = (search: AllProductsInquiry['search']) =>
		setProductsInquiry({ ...productsInquiry, page: 1, search });

	return (
		<Stack id={'admin-products-page'} className={'admin-page'}>
			<AdminHeader title={'Products'} total={total} unit={total === 1 ? 'product' : 'products'} />

			<div className={'admin-toolbar'}>
				<AdminSegments
					label={'Status'}
					options={Object.values(ProductStatus)}
					value={productsInquiry.search.productStatus}
					onChange={(productStatus) =>
						changeSearch({ ...productsInquiry.search, productStatus: productStatus as ProductStatus })
					}
				/>
				<AdminSearch
					placeholder={'Search by title'}
					onSearch={(text) => changeSearch({ ...productsInquiry.search, text })}
				/>
			</div>

			{products.length ? (
				<ProductList
					products={products}
					updateProductHandler={updateProductHandler}
					removeProductHandler={removeProductHandler}
				/>
			) : (
				<NoData />
			)}

			<AdminPager
				page={productsInquiry.page}
				limit={productsInquiry.limit}
				total={total}
				onPage={(page) => setProductsInquiry({ ...productsInquiry, page })}
			/>
		</Stack>
	);
};

export default withAdminLayout(AdminProducts);
