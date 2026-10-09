import { OrderActor, OrderStatus, OrderType, PaymentMethod } from '../../enums/order.enum';
import { TotalCounter } from '../common';

export interface OrderItem {
	productId: string;
	productTitle: string;
	productImage: string;
	productWidth: number;
	productDepth: number;
	productHeight: number;
	unitPrice: number;
	quantity: number;
	assembly: boolean;
	assemblyFee: number;
}

export interface OrderDelivery {
	recipient: string;
	phone: string;
	address: string;
	addressDetail?: string;
	postalCode: string;
	floor: number;
	elevator: boolean;
	preferredDate: string;
	memo?: string;
}

export interface OrderMeetup {
	meetupDate: string;
	meetupPlace: string;
	note?: string;
}

export interface OrderPayment {
	method: PaymentMethod;
	amount: number;
	approvalNo: string;
	cardBrand?: string;
	cardLast4?: string;
	paidAt: string;
	refundedAt?: string;
}

export interface OrderEvent {
	status: OrderStatus;
	actor: OrderActor;
	note?: string;
	at: string;
}

export interface Order {
	_id: string;
	orderNo: string;
	checkoutId: string;
	orderType: OrderType;
	orderStatus: OrderStatus;
	buyerId: string;
	buyerNick: string;
	sellerId: string;
	sellerNick: string;
	sellerImage?: string;
	items: OrderItem[];
	itemsTotal: number;
	deliveryFee: number;
	assemblyTotal: number;
	stairsFee: number;
	orderTotal: number;
	delivery?: OrderDelivery;
	meetup?: OrderMeetup;
	payment: OrderPayment;
	sellerNote?: string;
	cancelReason?: string;
	canceledBy?: OrderActor;
	history: OrderEvent[];
	createdAt: string;
	updatedAt: string;
}

export interface Orders {
	list: Order[];
	metaCounter: TotalCounter[];
}

export interface StoreQuote {
	sellerId: string;
	sellerNick: string;
	sellerImage?: string;
	items: OrderItem[];
	itemsTotal: number;
	deliveryFee: number;
	assemblyTotal: number;
	stairsFee: number;
	orderTotal: number;
}

export interface CheckoutQuote {
	stores: StoreQuote[];
	itemsTotal: number;
	deliveryTotal: number;
	assemblyTotal: number;
	stairsTotal: number;
	grandTotal: number;
	earliestDate: string;
	latestDate: string;
}

export interface PaymentInput {
	method: PaymentMethod;
	cardNumber?: string;
	cardExpiry?: string;
	cardHolder?: string;
}

export interface OrdersInquiry {
	page: number;
	limit: number;
	search: { orderStatus?: OrderStatus; orderType?: OrderType; text?: string };
}
