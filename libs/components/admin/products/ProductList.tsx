import Link from 'next/link';
import moment from 'moment';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Product } from '../../../types/product/product';
import { ProductStatus } from '../../../enums/product.enum';
import { DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../../config';
import { formatPrice } from '../../../utils';
import StatusSelect from '../common/StatusSelect';
import { adminLabel } from '../common/adminLabels';

interface ProductListProps {
	products: Product[];
	updateProductHandler: (id: string, productStatus: ProductStatus) => void;
	removeProductHandler: (id: string) => void;
}

const ProductList = ({ products, updateProductHandler, removeProductHandler }: ProductListProps) => {
	return (
		<Table className={'admin-table'}>
			<TableHead>
				<TableRow>
					<TableCell>Product</TableCell>
					<TableCell>Seller</TableCell>
					<TableCell align={'right'}>Price</TableCell>
					<TableCell>Location</TableCell>
					<TableCell>Listed</TableCell>
					<TableCell>Status</TableCell>
					<TableCell />
				</TableRow>
			</TableHead>
			<TableBody>
				{products.map((product) => (
					<TableRow key={product._id}>
						<TableCell>
							<Link href={{ pathname: '/product/detail', query: { id: product._id } }} className={'cell-main'}>
								<img src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)} alt={''} />
								<span>
									<strong>{product.productTitle}</strong>
									<small>
										{adminLabel(product.productCondition)} · {adminLabel(product.productType)}
									</small>
								</span>
							</Link>
						</TableCell>
						<TableCell>{product.memberData?.memberNick}</TableCell>
						<TableCell align={'right'} className={'cell-strong'}>
							{formatPrice(product.productSalePrice || product.productPrice)}
						</TableCell>
						<TableCell className={'cell-muted'}>{adminLabel(product.productLocation)}</TableCell>
						<TableCell className={'cell-muted'}>{moment(product.createdAt).format('YYYY.MM.DD')}</TableCell>
						<TableCell>
							<StatusSelect
								label={`Status of ${product.productTitle}`}
								value={product.productStatus}
								options={Object.values(ProductStatus)}
								disabled={product.productStatus === ProductStatus.DELETE}
								onChange={(status) => updateProductHandler(product._id, status)}
							/>
						</TableCell>
						<TableCell align={'right'}>
							{product.productStatus === ProductStatus.DELETE && (
								<button
									type={'button'}
									className={'row-action danger'}
									onClick={() => removeProductHandler(product._id)}
								>
									Remove for good
								</button>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default ProductList;
