import {
	ProductCondition,
	ProductLocation,
	ProductMaterial,
	ProductRoom,
	ProductStatus,
	ProductStyle,
	ProductType,
} from '../../enums/product.enum';
import { MeLiked, TotalCounter } from '../common';
import { Member } from '../member/member';

export interface Product {
	_id: string;
	productType: ProductType;
	productRoom: ProductRoom;
	productStyle: ProductStyle;
	productMaterial: ProductMaterial;
	productCondition: ProductCondition;
	productStatus: ProductStatus;
	productLocation: ProductLocation;
	productAddress: string;
	productTitle: string;
	productPrice: number;
	productSalePrice?: number;
	productWidth: number;
	productDepth: number;
	productHeight: number;
	productColor: string;
	productDeliveryFee: number;
	productAssembly: boolean;
	productImages: string[];
	productDesc?: string;
	productViews: number;
	productLikes: number;
	productComments: number;
	productRank: number;
	productRoomTours: number;
	memberId: string;
	soldAt?: Date;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	memberData?: Member;
}

export interface Products {
	list: Product[];
	metaCounter: TotalCounter[];
}
