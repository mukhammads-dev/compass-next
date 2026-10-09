import { Product } from '../product/product';

export interface CartItem {
	_id: string;
	productId: string;
	quantity: number;
	assembly: boolean;
	/** false when the product sold out, was removed, or is not for delivery */
	available: boolean;
	maxQuantity: number;
	productData?: Product;
}
