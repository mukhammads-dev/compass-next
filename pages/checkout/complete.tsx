import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CircularProgress, Stack } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import OrderCard from '../../libs/components/order/OrderCard';
import { GET_CHECKOUT_ORDERS, GET_ORDER } from '../../apollo/user/query';
import { Order } from '../../libs/types/order/order';
import { OrderType } from '../../libs/enums/order.enum';
import { formatPrice } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** After paying: what was ordered, from whom, and what happens next. */
const Complete: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const checkoutId = router.query.checkout as string | undefined;
	const orderId = router.query.order as string | undefined;

	const byCheckout = useQuery(GET_CHECKOUT_ORDERS, {
		skip: !checkoutId,
		variables: { checkoutId },
		fetchPolicy: 'network-only',
	});
	const byOrder = useQuery(GET_ORDER, { skip: !orderId, variables: { orderId }, fetchPolicy: 'network-only' });
	const orders: Order[] = checkoutId
		? (byCheckout.data?.getCheckoutOrders ?? [])
		: byOrder.data?.getOrder
			? [byOrder.data.getOrder]
			: [];

	if (!orders.length) {
		return (
			<Stack className={'loading-box'}>
				<CircularProgress />
			</Stack>
		);
	}

	const meetup = orders[0].orderType === OrderType.MEETUP;
	const total = orders.reduce((sum, order) => sum + order.orderTotal, 0);

	return (
		<Stack id={'complete-page'} className={'commerce-page'}>
			<Stack className={'container narrow'}>
				<div className={'complete-head'}>
					<span className={'complete-mark'}>
						<CheckRoundedIcon />
					</span>
					<h1>{meetup ? t('Reserved. It is yours.') : t('Thank you, your order is in.')}</h1>
					<p>
						{meetup
							? t('We are holding {{total}} until you pick it up. The seller has been told.', {
									total: formatPrice(total),
								})
							: orders.length > 1
								? t('You paid {{total}}. {{count}} stores will each deliver on the day you chose.', {
										total: formatPrice(total),
										count: orders.length,
									})
								: t('You paid {{total}}. The store will deliver on the day you chose.', { total: formatPrice(total) })}
					</p>
				</div>

				<div className={'order-list'}>
					{orders.map((order) => (
						<OrderCard key={order._id} order={order} side={'buyer'} />
					))}
				</div>

				<div className={'complete-actions'}>
					<Link href={{ pathname: '/mypage', query: { category: 'myOrders' } }} className={'pill-dark'}>
						{t('See my orders')}
					</Link>
					<Link href={'/product'} className={'pill-line'}>
						{t('Keep shopping')}
					</Link>
				</div>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Complete);
