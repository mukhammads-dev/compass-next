import { LensLabel } from '../../enums/lens.enum';
import { ProductType } from '../../enums/product.enum';
import { Product } from '../product/product';

/** Something found in the photo. x / y / w / h are 0..1 of the photo size. */
export interface LensFind {
	label?: LensLabel;
	productType?: ProductType;
	score: number;
	x: number;
	y: number;
	w: number;
	h: number;
	products: Product[];
}

export interface LensResult {
	/** the stored photo ("uploads/lens/..."), needed again for lensRegion */
	image: string;
	finds: LensFind[];
}

export interface LensRegionInput {
	image: string;
	x: number;
	y: number;
	w: number;
	h: number;
}
