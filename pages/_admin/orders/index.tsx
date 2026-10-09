import { NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import moment from 'moment';
import { useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminHeader from '../../../libs/components/admin/common/AdminHeader';
import AdminSegments from '../../../libs/components/admin/common/AdminSegments';
import AdminSearch from '../../../libs/components/admin/common/AdminSearch';
import AdminPager from '../../../libs/components/admin/common/AdminPager';
import NoData from '../../../libs/components/common/NoData';
import { GET_ALL_ORDERS_BY_ADMIN } from '../../../apollo/admin/query';
import { Order, OrdersInquiry } from '../../../libs/types/order/order';
import { OrderStatus, OrderType } from '../../../libs/enums/order.enum';
import { DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../../libs/config';
import { formatPrice } from '../../../libs/utils';
import { itemsSummary, statusLabel, statusTone } from '../../../libs/order';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const TONE_TO_DOT: Record<ReturnType<typeof statusTone>, string> = {
	ok: 'ok',
	progress: 'warn',
	done: 'muted',
	bad: 'bad',
};

/** Every order on Compass. Opening one shows the same page buyers and stores see, with the admin's cancel. */
const AdminOrders: NextPage = () => {
	const [inquiry, setInquiry] = useState<OrdersInquiry>({ page: 1, limit: 20, search: {} });
	const { data } = useQuery(GET_ALL_ORDERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
	});
	const orders: Order[] = data?.getAllOrdersByAdmin?.list ?? [];
	const total: number = data?.getAllOrdersByAdmin?.metaCounter?.[0]?.total ?? 0;
	const changeSearch = (search: OrdersInquiry['search']) => setInquiry({ ...inquiry, page: 1, search });

	return (
		<Stack id={'admin-orders-page'} className={'admin-page'}>
			<AdminHeader title={'Orders'} total={total} unit={total === 1 ? 'order' : 'orders'} />

			<div className={'admin-toolbar'}>
				<AdminSegments
					label={'Status'}
					options={Object.values(OrderStatus)}
					value={inquiry.search.orderStatus}
					onChange={(orderStatus) => changeSearch({ ...inquiry.search, orderStatus: orderStatus as OrderStatus })}
				/>
				<AdminSegments
					label={'Type'}
					options={Object.values(OrderType)}
					value={inquiry.search.orderType}
					allLabel={'Any type'}
					onChange={(orderType) => changeSearch({ ...inquiry.search, orderType: orderType as OrderType })}
				/>
				<AdminSearch
					placeholder={'Order no., product or buyer'}
					onSearch={(text) => changeSearch({ ...inquiry.search, text })}
				/>
			</div>

			{orders.length ? (
				<Table className={'admin-table'}>
					<TableHead>
						<TableRow>
							<TableCell>Order</TableCell>
							<TableCell>Buyer</TableCell>
							<TableCell>Seller</TableCell>
							<TableCell align={'right'}>Total</TableCell>
							<TableCell>Placed</TableCell>
							<TableCell>Status</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{orders.map((order) => (
							<TableRow key={order._id}>
								<TableCell>
									<Link href={{ pathname: '/order', query: { id: order._id } }} className={'cell-main'}>
										<img src={imageUrl(order.items[0]?.productImage, DEFAULT_PRODUCT_IMAGE)} alt={''} />
										<span>
											<strong>{itemsSummary(order, (count) => `and ${count} more`)}</strong>
											<small>
												{order.orderNo} · {order.orderType === OrderType.MEETUP ? 'Pick-up' : 'Delivery'}
											</small>
										</span>
									</Link>
								</TableCell>
								<TableCell>{order.buyerNick}</TableCell>
								<TableCell>{order.sellerNick}</TableCell>
								<TableCell align={'right'} className={'cell-strong'}>
									{formatPrice(order.orderTotal)}
								</TableCell>
								<TableCell className={'cell-muted'}>{moment(order.createdAt).format('YYYY.MM.DD HH:mm')}</TableCell>
								<TableCell>
									<span className={'status-value'}>
										<i className={`dot ${TONE_TO_DOT[statusTone(order.orderStatus)]}`} />
										{statusLabel(order)}
									</span>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<NoData />
			)}

			<AdminPager
				page={inquiry.page}
				limit={inquiry.limit}
				total={total}
				onPage={(page) => setInquiry({ ...inquiry, page })}
			/>
		</Stack>
	);
};

export default withAdminLayout(AdminOrders);
