import { gql } from '@apollo/client';
import { ARTICLE_FIELDS, MEMBER_FIELDS, ORDER_FIELDS, OWNER_FIELDS, PRODUCT_FIELDS } from '../fragments';

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
				...MemberFields
			}
			metaCounter {
				total
			}
		}
	}
	${MEMBER_FIELDS}
`;

export const GET_ALL_PRODUCTS_BY_ADMIN = gql`
	query GetAllProductsByAdmin($input: AllProductsInquiry!) {
		getAllProductsByAdmin(input: $input) {
			list {
				...ProductFields
				memberData {
					...OwnerFields
				}
			}
			metaCounter {
				total
			}
		}
	}
	${PRODUCT_FIELDS}
	${OWNER_FIELDS}
`;

export const GET_ALL_BOARD_ARTICLES_BY_ADMIN = gql`
	query GetAllBoardArticlesByAdmin($input: AllBoardArticlesInquiry!) {
		getAllBoardArticlesByAdmin(input: $input) {
			list {
				...ArticleFields
				memberData {
					...OwnerFields
				}
			}
			metaCounter {
				total
			}
		}
	}
	${ARTICLE_FIELDS}
	${OWNER_FIELDS}
`;

export const GET_ALL_NOTICES_BY_ADMIN = gql`
	query GetAllNoticesByAdmin($input: AllNoticesInquiry!) {
		getAllNoticesByAdmin(input: $input) {
			list {
				_id
				noticeCategory
				noticeStatus
				noticeTitle
				noticeContent
				eventStartAt
				eventEndAt
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_ALL_ORDERS_BY_ADMIN = gql`
	query GetAllOrdersByAdmin($input: OrdersInquiry!) {
		getAllOrdersByAdmin(input: $input) {
			list {
				...OrderFields
			}
			metaCounter {
				total
			}
		}
	}
	${ORDER_FIELDS}
`;
