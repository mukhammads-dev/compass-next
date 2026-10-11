import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CircularProgress, Stack } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import OrderStatusPill from '../../libs/components/order/OrderStatusPill';
import { userVar } from '../../apollo/store';
import { GET_ORDER } from '../../apollo/user/query';
import { CANCEL_ORDER, COMPLETE_ORDER, UPDATE_ORDER_BY_SELLER } from '../../apollo/user/mutation';
import { Order } from '../../libs/types/order/order';
import { OrderActor, OrderStatus, OrderType, PaymentMethod } from '../../libs/enums/order.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { getJwtToken, updateUserInfo } from '../../libs/auth';
import { DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../libs/config';
import { formatPrice } from '../../libs/utils';
import {
	canBuyerComplete,
	canCancelAs,
	formatDateTime,
	formatDay,
	orderSteps,
	sellerNextStep,
	statusLabel,
} from '../../libs/order';
import { sweetConfirmAlert, sweetMixinErrorAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
	[PaymentMethod.CARD]: 'Card',
	[PaymentMethod.KAKAO_PAY]: 'Kakao Pay',
	[PaymentMethod.BANK_TRANSFER]: 'Bank transfer',
};

/** One order, seen by its buyer, its seller or an admin. Each sees only the actions that are theirs. */
const OrderDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { locale } = router;
	const user = useReactiveVar(userVar);
	const orderId = (router.query.id as string) ?? '';
	const [note, setNote] = useState<string>('');
	const [cancelOpen, setCancelOpen] = useState<boolean>(false);
	const [reason, setReason] = useState<string>('');
	const [busy, setBusy] = useState<boolean>(false);

	const { data, loading, error } = useQuery(GET_ORDER, {
		skip: !orderId || !user._id,
		variables: { orderId },
		fetchPolicy: 'network-only',
	});
	const order: Order | undefined = data?.getOrder;
	const refetch = { refetchQueries: ['GetOrder'], awaitRefetchQueries: true };
	const [updateOrderBySeller] = useMutation(UPDATE_ORDER_BY_SELLER, refetch);
	const [cancelOrder] = useMutation(CANCEL_ORDER, refetch);
	const [completeOrder] = useMutation(COMPLETE_ORDER, refetch);

	useEffect(() => {
		if (router.isReady && !updateUserInfo(getJwtToken())) {
			router.replace({ pathname: '/account/join', query: { back: router.asPath } }).then();
		}
	}, [router]);

	if (error) {
		return (
			<Stack className={'commerce-page'}>
				<Stack className={'container narrow'}>
					<div className={'commerce-empty'}>
						<strong>{t('Order not found')}</strong>
					</div>
				</Stack>
			</Stack>
		);
	}

	if (loading || !order) {
		return (
			<Stack className={'loading-box'}>
				<CircularProgress />
			</Stack>
		);
	}

	const actor =
		order.buyerId === user._id
			? OrderActor.BUYER
			: order.sellerId === user._id
				? OrderActor.SELLER
				: user.memberType === MemberType.ADMIN
					? OrderActor.ADMIN
					: null;
	const meetup = order.orderType === OrderType.MEETUP;
	const next = actor === OrderActor.SELLER ? sellerNextStep(order) : null;
	const steps = orderSteps(order.orderType);
	const reached = new Set(order.history.map((event) => event.status));
	const eventOf = (status: OrderStatus) => order.history.find((event) => event.status === status);

	/** HANDLERS **/
	const run = async (task: () => Promise<unknown>, done: string) => {
		try {
			setBusy(true);
			await task();
		} catch (err: any) {
			console.log('ERROR, order action:', err.message);
			sweetMixinErrorAlert(t(err.message)).then();
		} finally {
			setBusy(false);
		}
	};

	const nextHandler = () =>
		next &&
		run(async () => {
			await updateOrderBySeller({
				variables: { input: { orderId: order._id, orderStatus: next.status, sellerNote: note.trim() || undefined } },
			});
			setNote('');
		}, 'Updated');

	const cancelHandler = () =>
		run(async () => {
			await cancelOrder({ variables: { input: { orderId: order._id, reason: reason.trim() } } });
			setCancelOpen(false);
		}, 'Order canceled, payment refunded');

	const completeHandler = async () => {
		const question = meetup
			? 'Did you pick it up and is it as described? The seller will be paid.'
			: 'Confirm that everything arrived?';
		if (!(await sweetConfirmAlert(t(question) as string))) return;
		await run(() => completeOrder({ variables: { orderId: order._id } }), 'Thank you!');
	};

	return (
		<Stack id={'order-page'} className={'commerce-page'}>
			<Stack className={'container narrow'}>
				<Link
					href={{ pathname: '/mypage', query: { category: actor === OrderActor.SELLER ? 'storeOrders' : 'myOrders' } }}
					className={'back-link'}
				>
					← {actor === OrderActor.SELLER ? t('Orders to fulfil') : t('My orders')}
				</Link>

				<header className={'order-head'}>
					<div>
						<h1>{order.orderNo}</h1>
						<span>{formatDateTime(order.createdAt, locale)}</span>
					</div>
					<OrderStatusPill order={order} />
				</header>

				{/* progress line, or the cancellation instead of it */}
				{order.orderStatus === OrderStatus.CANCELED ? (
					<div className={'order-canceled'}>
						<strong>{t('Canceled')}</strong>
						<span>
							{order.cancelReason} · {t('Refunded {{amount}}', { amount: formatPrice(order.payment.amount) })}
						</span>
					</div>
				) : (
					<ol className={'order-steps'}>
						{steps.map((status) => {
							const event = eventOf(status);
							return (
								<li key={status} className={reached.has(status) ? 'done' : ''}>
									<i>{reached.has(status) && <CheckRoundedIcon />}</i>
									<strong>{t(statusLabel({ orderType: order.orderType, orderStatus: status }))}</strong>
									{event && <small>{formatDateTime(event.at, locale)}</small>}
								</li>
							);
						})}
					</ol>
				)}

				{order.sellerNote && (
					<p className={'seller-note'}>
						<strong>{order.sellerNick}:</strong> {order.sellerNote}
					</p>
				)}

				{/* what this person can do now */}
				{actor && order.orderStatus !== OrderStatus.CANCELED && (
					<div className={'order-actions'}>
						{next && (
							<div className={'next-step'}>
								<input
									placeholder={t('Message to the buyer, e.g. "Truck arrives between 10 and 12" (optional)') as string}
									maxLength={200}
									value={note}
									onChange={(e) => setNote(e.target.value)}
								/>
								<button type={'button'} className={'pill-dark'} disabled={busy} onClick={nextHandler}>
									{t(next.label)}
								</button>
							</div>
						)}
						{actor === OrderActor.SELLER && meetup && order.orderStatus === OrderStatus.PAID && (
							<p className={'hint'}>
								{t('Hand the piece over on the pick-up day. You are paid as soon as the buyer confirms.')}
							</p>
						)}
						{actor === OrderActor.BUYER && canBuyerComplete(order) && (
							<button type={'button'} className={'pill-dark'} disabled={busy} onClick={completeHandler}>
								{meetup ? t('I picked it up') : t('Everything arrived')}
							</button>
						)}
						{canCancelAs(order, actor) && !cancelOpen && (
							<button
								type={'button'}
								className={'pill-line danger'}
								disabled={busy}
								onClick={() => setCancelOpen(true)}
							>
								{t('Cancel order')}
							</button>
						)}
						{cancelOpen && (
							<div className={'cancel-box'}>
								<input
									autoFocus
									placeholder={t('Why are you canceling?') as string}
									maxLength={200}
									value={reason}
									onChange={(e) => setReason(e.target.value)}
								/>
								<button type={'button'} className={'pill-line'} onClick={() => setCancelOpen(false)}>
									{t('Keep the order')}
								</button>
								<button
									type={'button'}
									className={'pill-dark danger'}
									disabled={busy || reason.trim().length < 2}
									onClick={cancelHandler}
								>
									{t('Cancel and refund')}
								</button>
							</div>
						)}
					</div>
				)}

				<section className={'order-section'}>
					<h2>{meetup ? t('Reserved piece') : t('Items')}</h2>
					{order.items.map((item) => (
						<div key={item.productId} className={'order-item'}>
							<Link href={{ pathname: '/product/detail', query: { id: item.productId } }}>
								<img src={imageUrl(item.productImage, DEFAULT_PRODUCT_IMAGE)} alt={''} />
							</Link>
							<div>
								<strong>{item.productTitle}</strong>
								<small>
									W {item.productWidth} × D {item.productDepth} × H {item.productHeight} cm
								</small>
								<small>
									{formatPrice(item.unitPrice)} × {item.quantity}
									{item.assembly && ` · ${t('Assembly')} ${formatPrice(item.assemblyFee)}`}
								</small>
							</div>
							<strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
						</div>
					))}
				</section>

				<div className={'order-grid'}>
					<section className={'order-section'}>
						<h2>{meetup ? t('Pick-up') : t('Delivery')}</h2>
						{meetup && order.meetup ? (
							<dl>
								<dt>{t('Day')}</dt>
								<dd>{formatDay(order.meetup.meetupDate, locale)}</dd>
								<dt>{t('Where')}</dt>
								<dd>{order.meetup.meetupPlace}</dd>
								<dt>{actor === OrderActor.BUYER ? t('Seller') : t('Buyer')}</dt>
								<dd>{actor === OrderActor.BUYER ? order.sellerNick : order.buyerNick}</dd>
								{order.meetup.note && (
									<>
										<dt>{t('Message')}</dt>
										<dd>{order.meetup.note}</dd>
									</>
								)}
							</dl>
						) : (
							order.delivery && (
								<dl>
									<dt>{t('Day')}</dt>
									<dd>{formatDay(order.delivery.preferredDate, locale)}</dd>
									<dt>{t('Store')}</dt>
									<dd>{order.sellerNick}</dd>
									<dt>{t('Recipient')}</dt>
									<dd>
										{order.delivery.recipient} · {order.delivery.phone}
									</dd>
									<dt>{t('Address')}</dt>
									<dd>
										{order.delivery.address} {order.delivery.addressDetail} ({order.delivery.postalCode})
									</dd>
									<dt>{t('Building')}</dt>
									<dd>
										{t('Floor {{floor}}', { floor: order.delivery.floor })} ·{' '}
										{order.delivery.elevator ? t('There is a lift') : t('Stairs only')}
									</dd>
									{order.delivery.memo && (
										<>
											<dt>{t('Note')}</dt>
											<dd>{order.delivery.memo}</dd>
										</>
									)}
								</dl>
							)
						)}
					</section>

					<section className={'order-section'}>
						<h2>{t('Payment')}</h2>
						<dl>
							<dt>{t('Items')}</dt>
							<dd>{formatPrice(order.itemsTotal)}</dd>
							{!meetup && (
								<>
									<dt>{t('Delivery')}</dt>
									<dd>{order.deliveryFee ? formatPrice(order.deliveryFee) : t('Free')}</dd>
								</>
							)}
							{order.assemblyTotal > 0 && (
								<>
									<dt>{t('Assembly')}</dt>
									<dd>{formatPrice(order.assemblyTotal)}</dd>
								</>
							)}
							{order.stairsFee > 0 && (
								<>
									<dt>{t('Stairs')}</dt>
									<dd>{formatPrice(order.stairsFee)}</dd>
								</>
							)}
							<dt className={'total'}>{t('Total')}</dt>
							<dd className={'total'}>{formatPrice(order.orderTotal)}</dd>
							<dt>{t('Paid with')}</dt>
							<dd>
								{t(PAYMENT_LABELS[order.payment.method])}
								{order.payment.cardLast4 && ` ${order.payment.cardBrand} •••• ${order.payment.cardLast4}`}
							</dd>
							{meetup && order.orderStatus === OrderStatus.PAID && (
								<>
									<dt>{t('Status')}</dt>
									<dd>{t('Held by Compass until pick-up')}</dd>
								</>
							)}
						</dl>
					</section>
				</div>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(OrderDetail);
