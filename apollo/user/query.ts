import { gql } from '@apollo/client';
import { ARTICLE_FIELDS, MEMBER_FIELDS, MY_ROOM_FIELDS, OWNER_FIELDS, PRODUCT_FIELDS } from '../fragments';

/**************************
 *         MEMBER         *
 *************************/

export const GET_AGENTS = gql`
	query GetAgents($input: AgentsInquiry!) {
		getAgents(input: $input) {
			list {
				...MemberFields
				meLiked { memberId likeRefId myFavorite }
				meFollowed { followingId followerId myFollowing }
			}
			metaCounter { total }
		}
	}
	${MEMBER_FIELDS}
`;

export const GET_MEMBER = gql`
	query GetMember($input: String!) {
		getMember(memberId: $input) {
			...MemberFields
			meLiked { memberId likeRefId myFavorite }
			meFollowed { followingId followerId myFollowing }
		}
	}
	${MEMBER_FIELDS}
`;

/**************************
 *        PRODUCT         *
 *************************/

export const GET_PRODUCT = gql`
	query GetProduct($input: String!) {
		getProduct(productId: $input) {
			...ProductFields
			memberData { ...OwnerFields memberDesc }
			meLiked { memberId likeRefId myFavorite }
		}
	}
	${PRODUCT_FIELDS}
	${OWNER_FIELDS}
`;

export const GET_PRODUCTS = gql`
	query GetProducts($input: ProductsInquiry!) {
		getProducts(input: $input) {
			list {
				...ProductFields
				memberData { ...OwnerFields }
				meLiked { memberId likeRefId myFavorite }
			}
			metaCounter { total }
		}
	}
	${PRODUCT_FIELDS}
	${OWNER_FIELDS}
`;

export const GET_SIMILAR_PRODUCTS = gql`
	query GetSimilarProducts($input: String!) {
		getSimilarProducts(productId: $input) {
			...ProductFields
			memberData { ...OwnerFields }
			meLiked { memberId likeRefId myFavorite }
		}
	}
	${PRODUCT_FIELDS}
	${OWNER_FIELDS}
`;

export const GET_AGENT_PRODUCTS = gql`
	query GetAgentProducts($input: AgentProductsInquiry!) {
		getAgentProducts(input: $input) {
			list {
				...ProductFields
			}
			metaCounter { total }
		}
	}
	${PRODUCT_FIELDS}
`;

export const GET_FAVORITES = gql`
	query GetFavorites($input: OrdinaryInquiry!) {
		getFavorites(input: $input) {
			list {
				...ProductFields
				memberData { ...OwnerFields }
			}
			metaCounter { total }
		}
	}
	${PRODUCT_FIELDS}
	${OWNER_FIELDS}
`;

export const GET_VISITED = gql`
	query GetVisited($input: OrdinaryInquiry!) {
		getVisited(input: $input) {
			list {
				...ProductFields
				memberData { ...OwnerFields }
			}
			metaCounter { total }
		}
	}
	${PRODUCT_FIELDS}
	${OWNER_FIELDS}
`;

/**************************
 *     BOARD ARTICLE      *
 *************************/

export const GET_BOARD_ARTICLE = gql`
	query GetBoardArticle($input: String!) {
		getBoardArticle(articleId: $input) {
			...ArticleFields
			memberData { ...OwnerFields }
			meLiked { memberId likeRefId myFavorite }
			taggedProductsData {
				...ProductFields
			}
		}
	}
	${ARTICLE_FIELDS}
	${OWNER_FIELDS}
	${PRODUCT_FIELDS}
`;

export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
				...ArticleFields
				memberData { ...OwnerFields }
				meLiked { memberId likeRefId myFavorite }
			}
			metaCounter { total }
		}
	}
	${ARTICLE_FIELDS}
	${OWNER_FIELDS}
`;

export const GET_PRODUCT_ROOM_TOURS = gql`
	query GetProductRoomTours($input: ProductRoomToursInquiry!) {
		getProductRoomTours(input: $input) {
			list {
				...ArticleFields
				memberData { ...OwnerFields }
			}
			metaCounter { total }
		}
	}
	${ARTICLE_FIELDS}
	${OWNER_FIELDS}
`;

/**************************
 *        COMMENT         *
 *************************/

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData { _id memberNick memberImage memberType }
			}
			metaCounter { total }
		}
	}
`;

/**************************
 *         FOLLOW         *
 *************************/

export const GET_MEMBER_FOLLOWERS = gql`
	query GetMemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				meFollowed { followingId followerId myFollowing }
				followerData { ...OwnerFields }
			}
			metaCounter { total }
		}
	}
	${OWNER_FIELDS}
`;

export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				meFollowed { followingId followerId myFollowing }
				followingData { ...OwnerFields }
			}
			metaCounter { total }
		}
	}
	${OWNER_FIELDS}
`;

/**************************
 *      NOTIFICATION      *
 *************************/

export const GET_NOTIFICATIONS = gql`
	query GetNotifications($input: NotificationsInquiry!) {
		getNotifications(input: $input) {
			list {
				_id
				notificationType
				notificationStatus
				notificationGroup
				notificationTitle
				notificationDesc
				authorId
				receiverId
				productId
				articleId
				createdAt
				authorData { _id memberNick memberImage }
			}
			metaCounter { total }
		}
	}
`;

/**************************
 *         NOTICE         *
 *************************/

export const GET_NOTICES = gql`
	query GetNotices($input: NoticesInquiry!) {
		getNotices(input: $input) {
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
			metaCounter { total }
		}
	}
`;

/**************************
 *        MY ROOM         *
 *************************/

export const GET_MY_ROOMS = gql`
	query GetMyRooms {
		getMyRooms {
			...MyRoomFields
		}
	}
	${MY_ROOM_FIELDS}
`;

export const CHECK_PRODUCT_FIT = gql`
	query CheckProductFit($input: ProductFitInput!) {
		checkProductFit(input: $input) {
			productId
			myRoomId
			fitsRoom
			fitsDoor
			warnings
		}
	}
`;
