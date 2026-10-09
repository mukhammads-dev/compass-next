import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Order } from '../../types/order/order';
import { OrderType } from '../../enums/order.enum';
import { DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../config';
import { formatPrice } from '../../utils';
import { formatDay, itemsSummary } from '../../order';
import OrderStatusPill from './OrderStatusPill';

interface OrderCardProps {
	order: Order;
	/** whose name to show: the store for the buyer, the buyer for the store */
	side: 'buyer' | 'seller';
	action?: React.ReactNode;
}

/** One order in a list: what, from whom, how much, and where it stands. */
const OrderCard = ({ order, side, action }: OrderCardProps) => {
	const { t } = useTranslation('common');
	const { locale } = useRouter();
	const counterpart = side === 'buyer' ? order.sellerNick : order.buyerNick;
	const when = order.orderType === OrderType.MEETUP ? order.meetup?.meetupDate : order.delivery?.preferredDate;

	return (
		<article className={'order-card'}>
			<Link href={{ pathname: '/order', query: { id: order._id } }} className={'order-card-main'}>
				<img src={imageUrl(order.items[0]?.productImage, DEFAULT_PRODUCT_IMAGE)} alt={''} />
				<div className={'order-card-info'}>
					<OrderStatusPill order={order} />
					<strong>{itemsSummary(order, (count) => t('and {{count}} more', { count }))}</strong>
					<span>
						{side === 'buyer' ? t('from {{name}}', { name: counterpart }) : t('for {{name}}', { name: counterpart })}
						{when && (
							<>
								{' · '}
								{order.orderType === OrderType.MEETUP ? t('Pick-up') : t('Delivery')} {formatDay(when, locale)}
							</>
						)}
					</span>
				</div>
				<div className={'order-card-total'}>
					<strong>{formatPrice(order.orderTotal)}</strong>
					<small>{order.orderNo}</small>
				</div>
			</Link>
			{action && <div className={'order-card-action'}>{action}</div>}
		</article>
	);
};

export default OrderCard;
