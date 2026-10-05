import { ProductInput } from './product.input';
import { ProductStatus } from '../../enums/product.enum';

export interface ProductUpdate extends Partial<ProductInput> {
	_id: string;
	productStatus?: ProductStatus;
}
