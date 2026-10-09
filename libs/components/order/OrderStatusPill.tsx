import { useTranslation } from 'next-i18next';
import { Order } from '../../types/order/order';
import { statusLabel, statusTone } from '../../order';

const OrderStatusPill = ({ order }: { order: Pick<Order, 'orderType' | 'orderStatus'> }) => {
	const { t } = useTranslation('common');
	return (
		<span className={`order-status ${statusTone(order.orderStatus)}`}>
			<i />
			{t(statusLabel(order))}
		</span>
	);
};

export default OrderStatusPill;
