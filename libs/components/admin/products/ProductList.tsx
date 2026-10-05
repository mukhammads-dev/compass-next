import Link from 'next/link';
import moment from 'moment';
import { Button, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Product } from '../../../types/product/product';
import { ProductStatus } from '../../../enums/product.enum';
import { DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../../config';
import { formatPrice } from '../../../utils';

interface ProductListProps {
	products: Product[];
	updateProductHandler: (id: string, productStatus: ProductStatus) => void;
	removeProductHandler: (id: string) => void;
}

const ProductList = ({ products, updateProductHandler, removeProductHandler }: ProductListProps) => {
	return (
		<Table size={'small'} className={'admin-table'}>
			<TableHead>
				<TableRow>
					<TableCell>Product</TableCell>
					<TableCell>Seller</TableCell>
					<TableCell>Condition</TableCell>
					<TableCell align={'right'}>Price</TableCell>
					<TableCell>Location</TableCell>
					<TableCell>Listed</TableCell>
					<TableCell>Status</TableCell>
					<TableCell />
				</TableRow>
			</TableHead>
			<TableBody>
				{products.map((product) => (
					<TableRow key={product._id} hover>
						<TableCell>
							<Link href={{ pathname: '/product/detail', query: { id: product._id } }} className={'cell-product'}>
								<img src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)} alt={''} />
								{product.productTitle}
							</Link>
						</TableCell>
						<TableCell>{product.memberData?.memberNick}</TableCell>
						<TableCell>{product.productCondition}</TableCell>
						<TableCell align={'right'}>{formatPrice(product.productPrice)}</TableCell>
						<TableCell>{product.productLocation}</TableCell>
						<TableCell>{moment(product.createdAt).format('YYYY.MM.DD')}</TableCell>
						<TableCell>
							<Select
								size={'small'}
								value={product.productStatus}
								disabled={product.productStatus === ProductStatus.DELETE}
								onChange={(e) => updateProductHandler(product._id, e.target.value as ProductStatus)}
							>
								{Object.values(ProductStatus).map((status) => (
									<MenuItem key={status} value={status}>
										{status}
									</MenuItem>
								))}
							</Select>
						</TableCell>
						<TableCell>
							{product.productStatus === ProductStatus.DELETE && (
								<Button size={'small'} color={'error'} onClick={() => removeProductHandler(product._id)}>
									Remove
								</Button>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default ProductList;
