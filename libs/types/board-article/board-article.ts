import { BoardArticleCategory, BoardArticleStatus, HomeType, TagSource } from '../../enums/board-article.enum';
import { ProductStyle } from '../../enums/product.enum';
import { MeLiked, TotalCounter } from '../common';
import { Member } from '../member/member';
import { Product } from '../product/product';

/** A product pin on a Room Tour image. x and y are percentages (0-100). */
export interface TaggedProduct {
	productId: string;
	imageIndex: number;
	x: number;
	y: number;
	source: TagSource;
}

export interface BoardArticle {
	_id: string;
	articleCategory: BoardArticleCategory;
	articleStatus: BoardArticleStatus;
	articleTitle: string;
	articleContent: string;
	articleImage?: string;
	roomImages: string[];
	homeType?: HomeType;
	homeSize?: number;
	homeStyle?: ProductStyle;
	taggedProducts: TaggedProduct[];
	articleViews: number;
	articleLikes: number;
	articleComments: number;
	articleRank: number;
	memberId: string;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	memberData?: Member;
	taggedProductsData?: Product[];
}

export interface BoardArticles {
	list: BoardArticle[];
	metaCounter: TotalCounter[];
}
