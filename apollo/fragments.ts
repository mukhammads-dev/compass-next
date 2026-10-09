import { gql } from '@apollo/client';

/** Shared field selections. Keep them in sync with libs/types. */

export const MEMBER_FIELDS = gql`
	fragment MemberFields on Member {
		_id
		memberType
		memberStatus
		memberAuthType
		memberPhone
		memberNick
		memberFullName
		memberImage
		memberAddress
		memberDesc
		memberProducts
		memberArticles
		memberFollowers
		memberFollowings
		memberPoints
		memberLikes
		memberViews
		memberComments
		memberRank
		memberWarnings
		memberBlocks
		createdAt
		updatedAt
	}
`;

export const PRODUCT_FIELDS = gql`
	fragment ProductFields on Product {
		_id
		productType
		productRoom
		productStyle
		productMaterial
		productCondition
		productStatus
		productLocation
		productAddress
		productTitle
		productPrice
		productSalePrice
		productWidth
		productDepth
		productHeight
		productColor
		productStock
		productDeliveryFee
		productAssembly
		productImages
		productDesc
		productViews
		productLikes
		productComments
		productRank
		productRoomTours
		memberId
		soldAt
		createdAt
		updatedAt
	}
`;

export const ARTICLE_FIELDS = gql`
	fragment ArticleFields on BoardArticle {
		_id
		articleCategory
		articleStatus
		articleTitle
		articleContent
		articleImage
		roomImages
		homeType
		homeSize
		homeStyle
		taggedProducts {
			productId
			imageIndex
			x
			y
			source
		}
		articleViews
		articleLikes
		articleComments
		articleRank
		memberId
		createdAt
		updatedAt
	}
`;

export const OWNER_FIELDS = gql`
	fragment OwnerFields on Member {
		_id
		memberType
		memberNick
		memberImage
		memberFollowers
		memberProducts
	}
`;

export const MY_ROOM_FIELDS = gql`
	fragment MyRoomFields on MyRoom {
		_id
		myRoomStatus
		myRoomName
		myRoomType
		myRoomWidth
		myRoomDepth
		myRoomHeight
		myRoomDoorWidth
		myRoomDoorHeight
		myRoomStyle
		myRoomBudget
		myRoomImage
		memberId
		createdAt
	}
`;

export const ORDER_FIELDS = gql`
	fragment OrderFields on Order {
		_id
		orderNo
		checkoutId
		orderType
		orderStatus
		buyerId
		buyerNick
		sellerId
		sellerNick
		sellerImage
		items {
			productId
			productTitle
			productImage
			productWidth
			productDepth
			productHeight
			unitPrice
			quantity
			assembly
			assemblyFee
		}
		itemsTotal
		deliveryFee
		assemblyTotal
		stairsFee
		orderTotal
		delivery {
			recipient
			phone
			address
			addressDetail
			postalCode
			floor
			elevator
			preferredDate
			memo
		}
		meetup {
			meetupDate
			meetupPlace
			note
		}
		payment {
			method
			amount
			approvalNo
			cardBrand
			cardLast4
			paidAt
			refundedAt
		}
		sellerNote
		cancelReason
		canceledBy
		history {
			status
			actor
			note
			at
		}
		createdAt
		updatedAt
	}
`;
