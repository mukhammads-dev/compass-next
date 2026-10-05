import { NextPage } from 'next';
import { ChangeEvent, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack, Tab, TablePagination, Tabs, TextField } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import ProductList from '../../../libs/components/admin/products/ProductList';
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

const initialInquiry: AllProductsInquiry = { page: 1, limit: 20, sort: 'createdAt', direction: Direction.DESC, search: {} };

const AdminProducts: NextPage = () => {
	const [productsInquiry, setProductsInquiry] = useState<AllProductsInquiry>(initialInquiry);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [text, setText] = useState<string>('');

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
			if (productStatus === ProductStatus.DELETE && !(await sweetConfirmAlert('Soft-delete this product?'))) return;
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

	return (
		<Stack id={'admin-products-page'} className={'admin-page'}>
			<Stack className={'admin-toolbar'}>
				<Tabs
					value={productsInquiry.search.productStatus ?? 'ALL'}
					onChange={(_, value: string) =>
						setProductsInquiry({
							...productsInquiry,
							page: 1,
							search: { ...productsInquiry.search, productStatus: value === 'ALL' ? undefined : (value as ProductStatus) },
						})
					}
				>
					<Tab value={'ALL'} label={'All'} />
					{Object.values(ProductStatus).map((status) => (
						<Tab key={status} value={status} label={status} />
					))}
				</Tabs>
				<TextField
					size={'small'}
					placeholder={'Search title'}
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) =>
						e.key === 'Enter' &&
						setProductsInquiry({
							...productsInquiry,
							page: 1,
							search: { ...productsInquiry.search, text: text.trim() || undefined },
						})
					}
				/>
			</Stack>

			{products.length ? (
				<ProductList
					products={products}
					updateProductHandler={updateProductHandler}
					removeProductHandler={removeProductHandler}
				/>
			) : (
				<NoData />
			)}

			<TablePagination
				component={'div'}
				count={total}
				page={productsInquiry.page - 1}
				rowsPerPage={productsInquiry.limit}
				rowsPerPageOptions={[10, 20, 50]}
				onPageChange={(_, page: number) => setProductsInquiry({ ...productsInquiry, page: page + 1 })}
				onRowsPerPageChange={(e: ChangeEvent<HTMLInputElement>) =>
					setProductsInquiry({ ...productsInquiry, page: 1, limit: parseInt(e.target.value, 10) })
				}
			/>
		</Stack>
	);
};

export default withAdminLayout(AdminProducts);
