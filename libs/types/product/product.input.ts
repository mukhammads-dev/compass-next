import { Direction } from '../../enums/common.enum';
import {
	ProductCondition,
	ProductLocation,
	ProductMaterial,
	ProductRoom,
	ProductStatus,
	ProductStyle,
	ProductType,
} from '../../enums/product.enum';
import { Range } from '../common';

export interface ProductInput {
	productType: ProductType;
	productRoom: ProductRoom;
	productStyle: ProductStyle;
	productMaterial: ProductMaterial;
	productCondition: ProductCondition;
	productLocation: ProductLocation;
	productAddress: string;
	productTitle: string;
	productPrice: number;
	productSalePrice?: number;
	productWidth: number;
	productDepth: number;
	productHeight: number;
	productColor: string;
	productDeliveryFee?: number;
	productAssembly?: boolean;
	productImages: string[];
	productDesc?: string;
}

/** "Fits my space" filter, all values in cm. */
export interface SizeFit {
	maxWidth?: number;
	maxDepth?: number;
	maxHeight?: number;
}

export interface PISearch {
	memberId?: string;
	typeList?: ProductType[];
	roomList?: ProductRoom[];
	styleList?: ProductStyle[];
	materialList?: ProductMaterial[];
	conditionList?: ProductCondition[];
	locationList?: ProductLocation[];
	pricesRange?: Range;
	sizeFit?: SizeFit;
	text?: string;
	/** only products with a sale price lower than the price */
	onSale?: boolean;
}

export interface ProductsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: PISearch;
}

export interface AgentProductsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { productStatus?: ProductStatus };
}

export interface AllProductsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { productStatus?: ProductStatus; productLocationList?: ProductLocation[]; text?: string };
}

export interface OrdinaryInquiry {
	page: number;
	limit: number;
}
