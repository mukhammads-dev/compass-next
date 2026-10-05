import { BoardArticleCategory, BoardArticleStatus, HomeType, TagSource } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import { ProductStyle } from '../../enums/product.enum';
import { Range } from '../common';

export interface TaggedProductInput {
	productId: string;
	imageIndex: number;
	x: number;
	y: number;
	source?: TagSource;
}

export interface BoardArticleInput {
	articleCategory: BoardArticleCategory;
	articleTitle: string;
	articleContent: string;
	articleImage?: string;
	roomImages?: string[];
	homeType?: HomeType;
	homeSize?: number;
	homeStyle?: ProductStyle;
	taggedProducts?: TaggedProductInput[];
}

export interface BAISearch {
	articleCategory?: BoardArticleCategory;
	homeTypeList?: HomeType[];
	homeSizeRange?: Range;
	styleList?: ProductStyle[];
	memberId?: string;
	text?: string;
}

export interface BoardArticlesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: BAISearch;
}

export interface ProductRoomToursInquiry {
	productId: string;
	page: number;
	limit: number;
}

export interface AllBoardArticlesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { articleStatus?: BoardArticleStatus; articleCategory?: BoardArticleCategory };
}
