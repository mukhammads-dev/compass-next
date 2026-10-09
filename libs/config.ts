import {
	ProductCondition,
	ProductLocation,
	ProductMaterial,
	ProductRoom,
	ProductStyle,
	ProductType,
} from './enums/product.enum';
import { HomeType } from './enums/board-article.enum';

const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}`;
export const REACT_APP_API_GRAPHQL_URL = `${process.env.REACT_APP_API_GRAPHQL_URL}`;

/* ---- images ---- */
export const DEFAULT_PRODUCT_IMAGE = '/img/placeholder/product.svg';
export const DEFAULT_ROOM_IMAGE = '/img/placeholder/room.svg';
export const DEFAULT_AVATAR = '/img/placeholder/avatar.svg';
export const validImageTypes = 'image/jpg, image/jpeg, image/png, image/webp';

/** Backend stores relative paths ("uploads/product/x.jpg"). */
export const imageUrl = (path: string | undefined, fallback: string): string => {
	if (!path) return fallback;
	if (path.startsWith('http') || path.startsWith('/')) return path;
	return `${REACT_APP_API_URL}/${path}`;
};

/* ---- option lists (mirror backend enums) ---- */
export const productTypes = Object.values(ProductType);
export const productRooms = Object.values(ProductRoom);
export const productStyles = Object.values(ProductStyle);
export const productMaterials = Object.values(ProductMaterial);
export const productConditions = Object.values(ProductCondition);
export const productLocations = Object.values(ProductLocation);
export const homeTypes = Object.values(HomeType);

/* ---- business limits (mirror backend config) ---- */
export const MAX_ROOM_TOUR_TAGS = 20;
export const MAX_ROOM_TOUR_IMAGES = 10;
export const MAX_PRODUCT_IMAGES = 10;
export const MAX_ACTIVE_USED_LISTINGS = 5;

/* ---- cart & orders (mirror backend config) ---- */
export const MAX_ITEM_QUANTITY = 10;
export const ASSEMBLY_FEE = 30_000;
export const STAIRS_FREE_FLOORS = 2;
export const STAIRS_FEE_PER_FLOOR = 10_000;
export const MEETUP_MAX_DAYS = 14;
/** simulated payment: shown on the checkout so anyone can try both outcomes */
export const TEST_CARD = '4242 4242 4242 4242';
export const TEST_DECLINED_CARD = '4000 0000 0000 0002';

/* ---- Compass Lens ---- */
export const LENS_MAX_PHOTO_BYTES = 15_000_000; // same as the API upload limit
export const LENS_TAP_SIZE = 0.3; // a tapped spot searches a square this share of the photo

/* ---- list page sizes ---- */
export const PRODUCTS_PAGE_LIMIT = 12;
export const ROOM_TOURS_PAGE_LIMIT = 9;
export const COMMENTS_PAGE_LIMIT = 5;

/* ---- stock interior photos (Unsplash, free license), used until real Room Tours exist ---- */
export const unsplash = (id: string, width: number = 900): string =>
	`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=75`;

interface StockRoom {
	id: string;
	caption: string;
	homeType: string;
	homeSize: number;
	/** where the demo pin sits on the photo, in percent */
	pin: { x: number; y: number; label: string };
}

export const STOCK_ROOMS: StockRoom[] = [
	{
		id: 'photo-1583847268964-b28dc8f51f92',
		caption: 'Sunny living room',
		homeType: 'APARTMENT',
		homeSize: 84,
		pin: { x: 42, y: 70, label: 'Linen sofa' },
	},
	{
		id: 'photo-1616594039964-ae9021a400a0',
		caption: 'Soft white bedroom',
		homeType: 'OFFICETEL',
		homeSize: 33,
		pin: { x: 50, y: 66, label: 'Upholstered bed' },
	},
	{
		id: 'photo-1600210491892-03d54c0aaf87',
		caption: 'Fireplace corner',
		homeType: 'HOUSE',
		homeSize: 120,
		pin: { x: 38, y: 64, label: 'Lounge chair' },
	},
	{
		id: 'photo-1628797285815-453c1d0d21e3',
		caption: 'Rustic kitchen',
		homeType: 'VILLA',
		homeSize: 59,
		pin: { x: 48, y: 72, label: 'Oak island' },
	},
	{
		id: 'photo-1616047006789-b7af5afb8c20',
		caption: 'Leather & oak',
		homeType: 'APARTMENT',
		homeSize: 76,
		pin: { x: 44, y: 68, label: 'Tan sectional' },
	},
	{
		id: 'photo-1583329550487-0fa300a4cd1a',
		caption: 'Seoul one-room',
		homeType: 'ONE_ROOM',
		homeSize: 20,
		pin: { x: 55, y: 70, label: 'Low table' },
	},
	{
		id: 'photo-1632119580908-ae947d4c7691',
		caption: 'Green velvet',
		homeType: 'APARTMENT',
		homeSize: 92,
		pin: { x: 40, y: 66, label: 'Velvet sofa' },
	},
	{
		id: 'photo-1724582586458-a51791349977',
		caption: 'Big window living',
		homeType: 'OFFICETEL',
		homeSize: 45,
		pin: { x: 52, y: 70, label: 'Modular sofa' },
	},
	{
		id: 'photo-1615529182904-14819c35db37',
		caption: 'Pattern play',
		homeType: 'VILLA',
		homeSize: 66,
		pin: { x: 46, y: 64, label: 'Grey sofa' },
	},
	{
		id: 'photo-1750764515068-80d222d974bb',
		caption: 'Open minimal',
		homeType: 'APARTMENT',
		homeSize: 110,
		pin: { x: 58, y: 72, label: 'Dining set' },
	},
];

/** Fallback photo per category circle, used until the category has a product with a photo. */
export const CATEGORY_PHOTOS: Record<string, string> = {
	FURNITURE: 'photo-1555041469-a586c61ea9bc',
	LIGHTING: 'photo-1580130281320-0ef0754f2bf7',
	TEXTILE: 'photo-1600210491305-7396500b5b31',
	KITCHEN: 'photo-1556912167-f556f1f39fdf',
	DECOR: 'photo-1612196808214-b8e1d6145a8c',
	PLANT: 'photo-1583753075968-1236ccb83c66',
	STORAGE: 'photo-1593430980369-68efc5a5eb34',
	APPLIANCE: 'photo-1570222094114-d054a817e56b',
};

/** One room photo per style for the "Find your style" picker (stock until real Room Tours exist). */
export const STYLE_PHOTOS: { style: ProductStyle; photo: string }[] = [
	{ style: ProductStyle.SCANDINAVIAN, photo: 'photo-1583847268964-b28dc8f51f92' },
	{ style: ProductStyle.MINIMAL, photo: 'photo-1750764515068-80d222d974bb' },
	{ style: ProductStyle.NATURAL, photo: 'photo-1628797285815-453c1d0d21e3' },
	{ style: ProductStyle.MODERN, photo: 'photo-1724582586458-a51791349977' },
	{ style: ProductStyle.VINTAGE, photo: 'photo-1615529182904-14819c35db37' },
	{ style: ProductStyle.KOREAN_MODERN, photo: 'photo-1583329550487-0fa300a4cd1a' },
];
