import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { CircularProgress, Stack } from '@mui/material';
import { GET_MY_ORDERS, GET_STORE_ORDERS } from '../../../apollo/user/query';
import { UPDATE_ORDER_BY_SELLER } from '../../../apollo/user/mutation';
import { Order, OrdersInquiry } from '../../types/order/order';
import { OrderStatus } from '../../enums/order.enum';
import { sellerNextStep } from '../../order';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import OrderCard from '../order/OrderCard';
import NoData from '../common/NoData';

interface OrderListProps {
	/** buyer: what I bought · seller: what was bought from me */
	side: 'buyer' | 'seller';
}

const FILTERS: { id: string; label: string; status?: OrderStatus }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'paid', label: 'New', status: OrderStatus.PAID },
	{ id: 'preparing', label: 'Preparing', status: OrderStatus.PREPARING },
	{ id: 'shipping', label: 'On the way', status: OrderStatus.SHIPPING },
	{ id: 'delivered', label: 'Delivered', status: OrderStatus.DELIVERED },
	{ id: 'completed', label: 'Completed', status: OrderStatus.COMPLETED },
	{ id: 'canceled', label: 'Canceled', status: OrderStatus.CANCELED },
];

const PAGE = 10;

/** My orders (buyer) or orders to fulfil (seller), newest first, with the seller's next step one tap away. */
const OrderList = ({ side }: OrderListProps) => {
	const { t } = useTranslation('common');
	const [filter, setFilter] = useState<string>('all');
	const [limit, setLimit] = useState<number>(PAGE);
	const status = FILTERS.find((item) => item.id === filter)?.status;
	const inquiry: OrdersInquiry = { page: 1, limit, search: status ? { orderStatus: status } : {} };

	const query = side === 'buyer' ? GET_MY_ORDERS : GET_STORE_ORDERS;
	const { data, loading } = useQuery(query, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
	});
	const result = side === 'buyer' ? data?.getMyOrders : data?.getStoreOrders;
	const orders: Order[] = result?.list ?? [];
	const total: number = result?.metaCounter?.[0]?.total ?? 0;

	const [updateOrderBySeller, { loading: moving }] = useMutation(UPDATE_ORDER_BY_SELLER, {
		refetchQueries: ['GetStoreOrders'],
		awaitRefetchQueries: true,
	});

	const nextHandler = async (order: Order, next: OrderStatus) => {
		try {
			await updateOrderBySeller({ variables: { input: { orderId: order._id, orderStatus: next } } });
		} catch (err: any) {
			sweetMixinErrorAlert(t(err.message)).then();
		}
	};

	return (
		<Stack className={'my-section order-list-section'}>
			<header className={'my-section-head'}>
				<h2>{side === 'buyer' ? t('My orders') : t('Orders to fulfil')}</h2>
			</header>

			<div className={'filter-chips'} role={'group'} aria-label={t('Status') as string}>
				{FILTERS.map((item) => (
					<button
						key={item.id}
						type={'button'}
						className={item.id === filter ? 'active' : ''}
						aria-pressed={item.id === filter}
						onClick={() => {
							setFilter(item.id);
							setLimit(PAGE);
						}}
					>
						{t(item.label)}
					</button>
				))}
			</div>

			{loading && !orders.length ? (
				<Stack className={'loading-box'}>
					<CircularProgress />
				</Stack>
			) : orders.length ? (
				<div className={'order-list'}>
					{orders.map((order) => {
						const next = side === 'seller' ? sellerNextStep(order) : null;
						return (
							<OrderCard
								key={order._id}
								order={order}
								side={side}
								action={
									next && (
										<button
											type={'button'}
											className={'pill-dark small'}
											disabled={moving}
											onClick={() => nextHandler(order, next.status)}
										>
											{t(next.label)}
										</button>
									)
								}
							/>
						);
					})}
					{orders.length < total && (
						<button type={'button'} className={'pill-line'} onClick={() => setLimit(limit + PAGE)}>
							{t('Show more')}
						</button>
					)}
				</div>
			) : (
				<NoData text={side === 'buyer' ? 'No orders yet' : 'No orders to fulfil'} />
			)}
		</Stack>
	);
};

export default OrderList;
