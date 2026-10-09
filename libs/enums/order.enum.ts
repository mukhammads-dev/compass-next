/** Mirror of compass-api order enums. */
export enum OrderType {
	DELIVERY = 'DELIVERY',
	MEETUP = 'MEETUP',
}

export enum OrderStatus {
	PAID = 'PAID',
	PREPARING = 'PREPARING',
	SHIPPING = 'SHIPPING',
	DELIVERED = 'DELIVERED',
	COMPLETED = 'COMPLETED',
	CANCELED = 'CANCELED',
}

export enum PaymentMethod {
	CARD = 'CARD',
	KAKAO_PAY = 'KAKAO_PAY',
	BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum OrderActor {
	BUYER = 'BUYER',
	SELLER = 'SELLER',
	ADMIN = 'ADMIN',
	SYSTEM = 'SYSTEM',
}
