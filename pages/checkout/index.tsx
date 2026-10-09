import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, CircularProgress, Stack } from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import DayPicker from '../../libs/components/order/DayPicker';
import PaymentForm, { isPaymentReady } from '../../libs/components/order/PaymentForm';
import { userVar } from '../../apollo/store';
import { GET_CHECKOUT_QUOTE, GET_MY_ORDERS } from '../../apollo/user/query';
import { CREATE_ORDERS } from '../../apollo/user/mutation';
import { CheckoutQuote, Order, PaymentInput } from '../../libs/types/order/order';
import { PaymentMethod } from '../../libs/enums/order.enum';
import { getJwtToken, updateUserInfo } from '../../libs/auth';
import { DEFAULT_AVATAR, DEFAULT_PRODUCT_IMAGE, STAIRS_FEE_PER_FLOOR, imageUrl } from '../../libs/config';
import { formatPrice } from '../../libs/utils';
import { daysBetween } from '../../libs/order';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

interface ShippingForm {
	recipient: string;
	phone: string;
	address: string;
	addressDetail: string;
	postalCode: string;
	floor: number;
	elevator: boolean;
}

const EMPTY_SHIPPING: ShippingForm = {
	recipient: '',
	phone: '',
	address: '',
	addressDetail: '',
	postalCode: '',
	floor: 1,
	elevator: true,
};

const PHONE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

/**
 * Checkout for NEW furniture. Prices come from the API (getCheckoutQuote), which is the same code that
 * charges the order, so what the buyer sees is what they pay. One block per store: each store delivers
 * on its own day.
 */
const Checkout: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const productIds = useMemo(
		() => (typeof router.query.items === 'string' ? router.query.items.split(',').filter(Boolean) : undefined),
		[router.query.items],
	);

	const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);
	const [dates, setDates] = useState<Record<string, string>>({});
	const [memos, setMemos] = useState<Record<string, string>>({});
	const [payment, setPayment] = useState<PaymentInput>({ method: PaymentMethod.CARD });
	const [touched, setTouched] = useState<boolean>(false);
	const [placing, setPlacing] = useState<boolean>(false);
	const [error, setError] = useState<string>('');

	/** APOLLO REQUESTS **/
	const {
		data,
		loading,
		error: quoteError,
	} = useQuery(GET_CHECKOUT_QUOTE, {
		fetchPolicy: 'network-only',
		skip: !user._id || !router.isReady,
		variables: { input: { productIds, floor: shipping.floor || 1, elevator: shipping.elevator } },
	});
	const quote: CheckoutQuote | undefined = data?.getCheckoutQuote;

	// the last delivery address fills the form, so a returning buyer only checks it
	useQuery(GET_MY_ORDERS, {
		fetchPolicy: 'network-only',
		skip: !user._id,
		variables: { input: { page: 1, limit: 5, search: { orderType: 'DELIVERY' } } },
		onCompleted: (result) => {
			const last: Order | undefined = result?.getMyOrders?.list?.find((order: Order) => order.delivery);
			if (last?.delivery) {
				const { recipient, phone, address, addressDetail, postalCode, floor, elevator } = last.delivery;
				setShipping({ recipient, phone, address, addressDetail: addressDetail ?? '', postalCode, floor, elevator });
			} else {
				setShipping((current) => ({ ...current, recipient: current.recipient || user.memberNick }));
			}
		},
	});

	const [createOrders] = useMutation(CREATE_ORDERS, { refetchQueries: ['GetMyCart'] });

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.isReady && !updateUserInfo(getJwtToken())) {
			router.replace({ pathname: '/account/join', query: { back: router.asPath } }).then();
		}
	}, [router]);

	const days = useMemo(() => (quote ? daysBetween(quote.earliestDate, quote.latestDate, true) : []), [quote]);

	/** VALIDATION **/
	const errors = {
		recipient: shipping.recipient.trim().length >= 2 ? '' : t('Enter the name of the person receiving it'),
		phone: PHONE.test(shipping.phone.trim()) ? '' : t('Enter a phone number like 010-1234-5678'),
		address: shipping.address.trim().length >= 5 ? '' : t('Enter the street address'),
		postalCode: /^\d{5}$/.test(shipping.postalCode) ? '' : t('5 digits'),
		floor: shipping.floor >= 1 && shipping.floor <= 80 ? '' : t('1 to 80'),
	};
	const shippingReady = Object.values(errors).every((message) => !message);
	const datesReady = Boolean(quote?.stores.every((store) => dates[store.sellerId]));
	const canPlace = Boolean(quote) && shippingReady && datesReady && isPaymentReady(payment) && !placing;
	const show = (key: keyof typeof errors) => (touched ? errors[key] : '');

	/** HANDLERS **/
	const set = <K extends keyof ShippingForm>(key: K, value: ShippingForm[K]) =>
		setShipping({ ...shipping, [key]: value });

	const placeHandler = async () => {
		setTouched(true);
		setError('');
		if (!canPlace || !quote) return;
		try {
			setPlacing(true);
			const { data: result } = await createOrders({
				variables: {
					input: {
						productIds,
						shipping: { ...shipping, phone: shipping.phone.trim(), addressDetail: shipping.addressDetail || undefined },
						deliveries: quote.stores.map((store) => ({
							sellerId: store.sellerId,
							preferredDate: dates[store.sellerId],
							memo: memos[store.sellerId] || undefined,
						})),
						payment,
					},
				},
			});
			await router.replace({ pathname: '/checkout/complete', query: { checkout: result.createOrders[0].checkoutId } });
		} catch (err: any) {
			console.log('ERROR, placeHandler:', err.message);
			setError(t(err.message) as string);
			sweetMixinErrorAlert(t(err.message)).then();
		} finally {
			setPlacing(false);
		}
	};

	if (quoteError) {
		return (
			<Stack className={'commerce-page'}>
				<Stack className={'container'}>
					<div className={'commerce-empty'}>
						<strong>{t(quoteError.message)}</strong>
						<button type={'button'} className={'pill-dark'} onClick={() => router.push('/cart')}>
							{t('Back to cart')}
						</button>
					</div>
				</Stack>
			</Stack>
		);
	}

	if (!quote) {
		return (
			<Stack className={'loading-box'}>
				<CircularProgress />
			</Stack>
		);
	}

	return (
		<Stack id={'checkout-page'} className={'commerce-page'}>
			<Stack className={'container'}>
				<header className={'commerce-head'}>
					<h1>{t('Checkout')}</h1>
				</header>

				<div className={'commerce-layout'}>
					<div className={'commerce-main'}>
						<section className={'checkout-step'}>
							<h2>
								<span>1</span>
								{t('Where should it go?')}
							</h2>
							<div className={'form-grid'}>
								<Field label={t('Recipient')} error={show('recipient')}>
									<input
										value={shipping.recipient}
										autoComplete={'name'}
										onChange={(e) => set('recipient', e.target.value)}
									/>
								</Field>
								<Field label={t('Phone')} error={show('phone')}>
									<input
										value={shipping.phone}
										inputMode={'tel'}
										autoComplete={'tel'}
										placeholder={'010-1234-5678'}
										onChange={(e) => set('phone', e.target.value)}
									/>
								</Field>
								<Field label={t('Street address')} error={show('address')} wide>
									<input
										value={shipping.address}
										autoComplete={'street-address'}
										onChange={(e) => set('address', e.target.value)}
									/>
								</Field>
								<Field label={t('Apartment, unit (optional)')}>
									<input value={shipping.addressDetail} onChange={(e) => set('addressDetail', e.target.value)} />
								</Field>
								<Field label={t('Postal code')} error={show('postalCode')}>
									<input
										value={shipping.postalCode}
										inputMode={'numeric'}
										autoComplete={'postal-code'}
										maxLength={5}
										onChange={(e) => set('postalCode', e.target.value.replace(/\D/g, ''))}
									/>
								</Field>
							</div>

							{/* furniture needs to get inside: floor and lift decide how it is carried */}
							<div className={'carry-row'}>
								<Field label={t('Floor')} error={show('floor')}>
									<input
										type={'number'}
										min={1}
										max={80}
										value={shipping.floor}
										onChange={(e) => set('floor', Number(e.target.value))}
									/>
								</Field>
								<div className={'toggle-group'} role={'radiogroup'} aria-label={t('Lift') as string}>
									<button
										type={'button'}
										role={'radio'}
										aria-checked={shipping.elevator}
										className={shipping.elevator ? 'active' : ''}
										onClick={() => set('elevator', true)}
									>
										{t('There is a lift')}
									</button>
									<button
										type={'button'}
										role={'radio'}
										aria-checked={!shipping.elevator}
										className={!shipping.elevator ? 'active' : ''}
										onClick={() => set('elevator', false)}
									>
										{t('Stairs only')}
									</button>
								</div>
							</div>
							{!shipping.elevator && (
								<p className={'carry-note'}>
									{quote.stairsTotal
										? t('Carrying up the stairs costs {{fee}} per floor above the 2nd, once per delivery.', {
												fee: formatPrice(STAIRS_FEE_PER_FLOOR),
											})
										: t('Carrying up to the 2nd floor is free.')}
								</p>
							)}
						</section>

						<section className={'checkout-step'}>
							<h2>
								<span>2</span>
								{t('Pick a delivery day')}
							</h2>
							<p className={'step-note'}>{t('Each store brings its pieces on its own day, Monday to Saturday.')}</p>
							{quote.stores.map((store) => (
								<div key={store.sellerId} className={'store-block compact'}>
									<header>
										<Avatar src={imageUrl(store.sellerImage, DEFAULT_AVATAR)} alt={''} />
										<strong>{store.sellerNick}</strong>
										<span>{formatPrice(store.orderTotal)}</span>
									</header>
									<div className={'mini-items'}>
										{store.items.map((item) => (
											<div key={item.productId} className={'mini-item'}>
												<img src={imageUrl(item.productImage, DEFAULT_PRODUCT_IMAGE)} alt={''} />
												<span>
													<strong>{item.productTitle}</strong>
													<small>
														× {item.quantity}
														{item.assembly && ` · ${t('with assembly')}`}
													</small>
												</span>
											</div>
										))}
									</div>
									<DayPicker
										label={t('Delivery day for {{store}}', { store: store.sellerNick }) as string}
										days={days}
										value={dates[store.sellerId] ?? null}
										onChange={(iso) => setDates({ ...dates, [store.sellerId]: iso })}
									/>
									{touched && !dates[store.sellerId] && <em className={'field-error'}>{t('Choose a day')}</em>}
									<input
										className={'memo'}
										placeholder={t('Note for the driver (optional)') as string}
										maxLength={200}
										value={memos[store.sellerId] ?? ''}
										onChange={(e) => setMemos({ ...memos, [store.sellerId]: e.target.value })}
									/>
								</div>
							))}
						</section>

						<section className={'checkout-step'}>
							<h2>
								<span>3</span>
								{t('Payment')}
							</h2>
							<PaymentForm value={payment} onChange={setPayment} />
						</section>
					</div>

					<aside className={'commerce-summary'}>
						<h2>{t('Order summary')}</h2>
						<dl className={loading ? 'is-loading' : ''}>
							<dt>{t('Items')}</dt>
							<dd>{formatPrice(quote.itemsTotal)}</dd>
							<dt>{t('Delivery')}</dt>
							<dd>{quote.deliveryTotal ? formatPrice(quote.deliveryTotal) : t('Free')}</dd>
							{quote.assemblyTotal > 0 && (
								<>
									<dt>{t('Assembly')}</dt>
									<dd>{formatPrice(quote.assemblyTotal)}</dd>
								</>
							)}
							{quote.stairsTotal > 0 && (
								<>
									<dt>{t('Stairs')}</dt>
									<dd>{formatPrice(quote.stairsTotal)}</dd>
								</>
							)}
						</dl>
						<div className={'summary-total'}>
							<span>{t('Total')}</span>
							<strong>{formatPrice(quote.grandTotal)}</strong>
						</div>
						{error && <p className={'summary-warn'}>{error}</p>}
						<button type={'button'} className={'pill-dark wide'} disabled={placing} onClick={placeHandler}>
							{placing ? (
								<CircularProgress size={20} color={'inherit'} />
							) : (
								<>
									<LockRoundedIcon fontSize={'small'} />
									{t('Pay {{total}}', { total: formatPrice(quote.grandTotal) })}
								</>
							)}
						</button>
						{touched && !canPlace && !placing && (
							<p className={'summary-note'}>{t('Fill in the marked fields to place the order.')}</p>
						)}
					</aside>
				</div>
			</Stack>
		</Stack>
	);
};

const Field = ({
	label,
	error,
	wide,
	children,
}: {
	label: string;
	error?: string;
	wide?: boolean;
	children: React.ReactNode;
}) => (
	<label className={`field ${wide ? 'wide' : ''} ${error ? 'has-error' : ''}`}>
		<span>{label}</span>
		{children}
		{error && <em className={'field-error'}>{error}</em>}
	</label>
);

export default withLayoutBasic(Checkout);
