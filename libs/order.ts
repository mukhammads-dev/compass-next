import { OrderActor, OrderStatus, OrderType } from './enums/order.enum';
import { Order } from './types/order/order';

/** Order helpers shared by cart, checkout and order pages. Dates are Korea time, like the API. */

const KST = 'Asia/Seoul';
const DAY_MS = 24 * 60 * 60 * 1000;

const LOCALES: Record<string, string> = { en: 'en-US', ko: 'ko-KR', uz: 'uz-UZ' };

/** e.g. "Mon, Oct 12" / "10월 12일 (월)" */
export const formatDay = (iso: string | Date, locale = 'en'): string =>
	new Intl.DateTimeFormat(LOCALES[locale] ?? 'en-US', {
		timeZone: KST,
		month: 'short',
		day: 'numeric',
		weekday: 'short',
	}).format(new Date(iso));

export const formatDateTime = (iso: string | Date, locale = 'en'): string =>
	new Intl.DateTimeFormat(LOCALES[locale] ?? 'en-US', {
		timeZone: KST,
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(iso));

const kstWeekday = (date: Date): number => new Date(date.getTime() + 9 * 60 * 60 * 1000).getUTCDay();

/** Every bookable day between two dates (inclusive), optionally without Sundays. */
export const daysBetween = (from: string | Date, to: string | Date, skipSundays: boolean): Date[] => {
	const days: Date[] = [];
	for (let time = new Date(from).getTime(); time <= new Date(to).getTime(); time += DAY_MS) {
		const day = new Date(time);
		if (!skipSundays || kstWeekday(day) !== 0) days.push(day);
	}
	return days;
};

/** The steps an order goes through, for the progress line. */
export const orderSteps = (type: OrderType): OrderStatus[] =>
	type === OrderType.MEETUP
		? [OrderStatus.PAID, OrderStatus.COMPLETED]
		: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.SHIPPING, OrderStatus.DELIVERED, OrderStatus.COMPLETED];

/** What the buyer reads for each status. */
export const statusLabel = (order: Pick<Order, 'orderType' | 'orderStatus'>): string => {
	if (order.orderType === OrderType.MEETUP) {
		if (order.orderStatus === OrderStatus.PAID) return 'Reserved, waiting for pick-up';
		if (order.orderStatus === OrderStatus.COMPLETED) return 'Picked up';
	}
	return (
		{
			[OrderStatus.PAID]: 'Paid',
			[OrderStatus.PREPARING]: 'Preparing',
			[OrderStatus.SHIPPING]: 'On the way',
			[OrderStatus.DELIVERED]: 'Delivered',
			[OrderStatus.COMPLETED]: 'Completed',
			[OrderStatus.CANCELED]: 'Canceled',
		}[order.orderStatus] ?? order.orderStatus
	);
};

export const statusTone = (status: OrderStatus): 'ok' | 'progress' | 'done' | 'bad' => {
	if (status === OrderStatus.CANCELED) return 'bad';
	if (status === OrderStatus.COMPLETED || status === OrderStatus.DELIVERED) return 'done';
	if (status === OrderStatus.PAID) return 'ok';
	return 'progress';
};

/** Next step a seller can take on a delivery, with its button label. */
export const sellerNextStep = (order: Order): { status: OrderStatus; label: string } | null => {
	if (order.orderType !== OrderType.DELIVERY) return null;
	if (order.orderStatus === OrderStatus.PAID) return { status: OrderStatus.PREPARING, label: 'Accept and prepare' };
	if (order.orderStatus === OrderStatus.PREPARING)
		return { status: OrderStatus.SHIPPING, label: 'Send out for delivery' };
	if (order.orderStatus === OrderStatus.SHIPPING) return { status: OrderStatus.DELIVERED, label: 'Mark as delivered' };
	return null;
};

/** Same rules as the API (order.rules.ts canCancel / canBuyerComplete). */
export const canCancelAs = (order: Order, actor: OrderActor): boolean => {
	if (order.orderStatus === OrderStatus.CANCELED || order.orderStatus === OrderStatus.COMPLETED) return false;
	if (actor === OrderActor.ADMIN) return order.orderStatus !== OrderStatus.DELIVERED;
	if (order.orderType === OrderType.MEETUP) return order.orderStatus === OrderStatus.PAID;
	if (actor === OrderActor.BUYER) return order.orderStatus === OrderStatus.PAID;
	return order.orderStatus === OrderStatus.PAID || order.orderStatus === OrderStatus.PREPARING;
};

export const canBuyerComplete = (order: Order): boolean =>
	order.orderType === OrderType.DELIVERY
		? order.orderStatus === OrderStatus.DELIVERED
		: order.orderStatus === OrderStatus.PAID;

/** "Linen sofa" or "Linen sofa and 2 more" */
export const itemsSummary = (order: Pick<Order, 'items'>, more: (count: number) => string): string => {
	const [first, ...rest] = order.items;
	return rest.length ? `${first.productTitle} ${more(rest.length)}` : (first?.productTitle ?? '');
};
