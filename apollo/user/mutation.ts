import { gql } from '@apollo/client';
import {
	ARTICLE_FIELDS,
	MEMBER_FIELDS,
	MY_ROOM_FIELDS,
	ORDER_FIELDS,
	OWNER_FIELDS,
	PRODUCT_FIELDS,
} from '../fragments';

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
			...MemberFields
			accessToken
		}
	}
	${MEMBER_FIELDS}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
			...MemberFields
			accessToken
		}
	}
	${MEMBER_FIELDS}
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
			...MemberFields
			accessToken
		}
	}
	${MEMBER_FIELDS}
`;

export const LIKE_TARGET_MEMBER = gql`
	mutation LikeTargetMember($input: String!) {
		likeTargetMember(memberId: $input) {
			_id
			memberLikes
		}
	}
`;

/**************************
 *        PRODUCT         *
 *************************/

export const CREATE_PRODUCT = gql`
	mutation CreateProduct($input: ProductInput!) {
		createProduct(input: $input) {
			...ProductFields
		}
	}
	${PRODUCT_FIELDS}
`;

export const UPDATE_PRODUCT = gql`
	mutation UpdateProduct($input: ProductUpdate!) {
		updateProduct(input: $input) {
			...ProductFields
		}
	}
	${PRODUCT_FIELDS}
`;

export const LIKE_TARGET_PRODUCT = gql`
	mutation LikeTargetProduct($input: String!) {
		likeTargetProduct(productId: $input) {
			_id
			productLikes
		}
	}
`;

/**************************
 *     BOARD ARTICLE      *
 *************************/

export const CREATE_BOARD_ARTICLE = gql`
	mutation CreateBoardArticle($input: BoardArticleInput!) {
		createBoardArticle(input: $input) {
			...ArticleFields
		}
	}
	${ARTICLE_FIELDS}
`;

export const UPDATE_BOARD_ARTICLE = gql`
	mutation UpdateBoardArticle($input: BoardArticleUpdate!) {
		updateBoardArticle(input: $input) {
			...ArticleFields
		}
	}
	${ARTICLE_FIELDS}
`;

export const LIKE_TARGET_BOARD_ARTICLE = gql`
	mutation LikeTargetBoardArticle($input: String!) {
		likeTargetBoardArticle(articleId: $input) {
			_id
			articleLikes
		}
	}
`;

/**************************
 *        COMMENT         *
 *************************/

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
			commentContent
		}
	}
`;

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
			commentStatus
			commentContent
		}
	}
`;

/**************************
 *         FOLLOW         *
 *************************/

export const SUBSCRIBE = gql`
	mutation Subscribe($input: String!) {
		subscribe(input: $input) {
			_id
			followingId
			followerId
		}
	}
`;

export const UNSUBSCRIBE = gql`
	mutation Unsubscribe($input: String!) {
		unsubscribe(input: $input) {
			_id
			followingId
			followerId
		}
	}
`;

/**************************
 *      NOTIFICATION      *
 *************************/

export const READ_NOTIFICATION = gql`
	mutation ReadNotification($input: String!) {
		readNotification(notificationId: $input) {
			_id
			notificationStatus
		}
	}
`;

export const READ_ALL_NOTIFICATIONS = gql`
	mutation ReadAllNotifications {
		readAllNotifications
	}
`;

/**************************
 *        MY ROOM         *
 *************************/

export const SAVE_MY_ROOM = gql`
	mutation SaveMyRoom($input: MyRoomInput!) {
		saveMyRoom(input: $input) {
			...MyRoomFields
		}
	}
	${MY_ROOM_FIELDS}
`;

export const UPDATE_MY_ROOM = gql`
	mutation UpdateMyRoom($input: MyRoomUpdate!) {
		updateMyRoom(input: $input) {
			...MyRoomFields
		}
	}
	${MY_ROOM_FIELDS}
`;

/**************************
 *          LENS          *
 *************************/

/** Sent as multipart by libs/upload.ts (searchPhoto), not through useMutation. */
export const LENS_SEARCH = gql`
	mutation LensSearch($file: Upload!) {
		lensSearch(file: $file) {
			image
			finds {
				label
				productType
				score
				x
				y
				w
				h
				products {
					...ProductFields
					memberData {
						...OwnerFields
					}
				}
			}
		}
	}
	${PRODUCT_FIELDS}
	${OWNER_FIELDS}
`;

/**************************
 *     CART & ORDERS      *
 *************************/

export const ADD_TO_CART = gql`
	mutation AddToCart($input: CartItemInput!) {
		addToCart(input: $input) {
			_id
			productId
			quantity
			assembly
			available
			maxQuantity
		}
	}
`;

export const UPDATE_CART_ITEM = gql`
	mutation UpdateCartItem($input: CartItemUpdate!) {
		updateCartItem(input: $input) {
			_id
			productId
			quantity
			assembly
			available
			maxQuantity
		}
	}
`;

export const REMOVE_CART_ITEM = gql`
	mutation RemoveCartItem($productId: String!) {
		removeCartItem(productId: $productId)
	}
`;

export const CREATE_ORDERS = gql`
	mutation CreateOrders($input: CheckoutInput!) {
		createOrders(input: $input) {
			...OrderFields
		}
	}
	${ORDER_FIELDS}
`;

export const RESERVE_PRODUCT = gql`
	mutation ReserveProduct($input: ReserveInput!) {
		reserveProduct(input: $input) {
			...OrderFields
		}
	}
	${ORDER_FIELDS}
`;

export const UPDATE_ORDER_BY_SELLER = gql`
	mutation UpdateOrderBySeller($input: OrderStatusUpdate!) {
		updateOrderBySeller(input: $input) {
			...OrderFields
		}
	}
	${ORDER_FIELDS}
`;

export const CANCEL_ORDER = gql`
	mutation CancelOrder($input: CancelOrderInput!) {
		cancelOrder(input: $input) {
			...OrderFields
		}
	}
	${ORDER_FIELDS}
`;

export const COMPLETE_ORDER = gql`
	mutation CompleteOrder($orderId: String!) {
		completeOrder(orderId: $orderId) {
			...OrderFields
		}
	}
	${ORDER_FIELDS}
`;
