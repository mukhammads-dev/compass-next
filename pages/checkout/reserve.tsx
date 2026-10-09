import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, CircularProgress, Stack } from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import DayPicker from '../../libs/components/order/DayPicker';
import PaymentForm, { isPaymentReady } from '../../libs/components/order/PaymentForm';
import { userVar } from '../../apollo/store';
import { GET_PRODUCT } from '../../apollo/user/query';
import { RESERVE_PRODUCT } from '../../apollo/user/mutation';
import { Product } from '../../libs/types/product/product';
import { PaymentInput } from '../../libs/types/order/order';
import { PaymentMethod } from '../../libs/enums/order.enum';
import { ProductCondition, ProductStatus } from '../../libs/enums/product.enum';
import { getJwtToken, updateUserInfo } from '../../libs/auth';
import { DEFAULT_AVATAR, DEFAULT_PRODUCT_IMAGE, MEETUP_MAX_DAYS, imageUrl } from '../../libs/config';
import { enumLabel, formatPrice } from '../../libs/utils';
import { daysBetween } from '../../libs/order';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** Noon KST of today + n days, as the API stores days. */
const kstNoonFromToday = (offset: number): Date => {
	const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
	return new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + offset, 3));
};

/**
 * Safe trade for USED furniture: the buyer pays now, Compass holds the money, and the seller is paid
 * when the buyer confirms the pick-up. The piece is reserved so nobody else can buy it meanwhile.
 */
const Reserve: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const productId = (router.query.id as string) ?? '';
	const [day, setDay] = useState<string | null>(null);
	const [note, setNote] = useState<string>('');
	const [payment, setPayment] = useState<PaymentInput>({ method: PaymentMethod.CARD });
	const [placing, setPlacing] = useState<boolean>(false);

	const { data, loading } = useQuery(GET_PRODUCT, {
		fetchPolicy: 'network-only',
		skip: !productId,
		variables: { input: productId },
	});
	const product: Product | undefined = data?.getProduct;
	const [reserveProduct] = useMutation(RESERVE_PRODUCT);

	useEffect(() => {
		if (router.isReady && !updateUserInfo(getJwtToken())) {
			router.replace({ pathname: '/account/join', query: { back: router.asPath } }).then();
		}
	}, [router]);

	const days = useMemo(() => daysBetween(kstNoonFromToday(0), kstNoonFromToday(MEETUP_MAX_DAYS), false), []);

	const reserveHandler = async () => {
		if (!product || !day || !isPaymentReady(payment)) return;
		try {
			setPlacing(true);
			const { data: result } = await reserveProduct({
				variables: { input: { productId: product._id, meetupDate: day, note: note.trim() || undefined, payment } },
			});
			await router.replace({ pathname: '/checkout/complete', query: { order: result.reserveProduct._id } });
		} catch (err: any) {
			console.log('ERROR, reserveHandler:', err.message);
			sweetMixinErrorAlert(t(err.message)).then();
		} finally {
			setPlacing(false);
		}
	};

	if (loading || !product) {
		return (
			<Stack className={'loading-box'}>
				<CircularProgress />
			</Stack>
		);
	}

	const price =
		product.productSalePrice && product.productSalePrice < product.productPrice
			? product.productSalePrice
			: product.productPrice;
	const available =
		product.productStatus === ProductStatus.ACTIVE && product.productCondition === ProductCondition.USED;

	return (
		<Stack id={'reserve-page'} className={'commerce-page'}>
			<Stack className={'container'}>
				<header className={'commerce-head'}>
					<h1>{t('Reserve and pick up')}</h1>
				</header>

				{!available ? (
					<div className={'commerce-empty'}>
						<strong>{t('This piece is no longer available.')}</strong>
						<button type={'button'} className={'pill-dark'} onClick={() => router.push('/product')}>
							{t('Browse the shop')}
						</button>
					</div>
				) : (
					<div className={'commerce-layout'}>
						<div className={'commerce-main'}>
							<section className={'checkout-step'}>
								<div className={'reserve-item'}>
									<img src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)} alt={''} />
									<div>
										<strong>{product.productTitle}</strong>
										<small>
											W {product.productWidth} × D {product.productDepth} × H {product.productHeight} cm
										</small>
										<span className={'seller-line'}>
											<Avatar src={imageUrl(product.memberData?.memberImage, DEFAULT_AVATAR)} alt={''} />
											{product.memberData?.memberNick} · {t(enumLabel(product.productLocation))},{' '}
											{product.productAddress}
										</span>
									</div>
								</div>
								<div className={'safe-trade'}>
									<HandshakeOutlinedIcon />
									<ol>
										<li>{t('You pay now. Compass holds the money, the seller does not get it yet.')}</li>
										<li>{t('Meet the seller and check the piece.')}</li>
										<li>
											{t(
												'Tap "I picked it up" and the seller is paid. Not as described? Cancel and get your money back.',
											)}
										</li>
									</ol>
								</div>
							</section>

							<section className={'checkout-step'}>
								<h2>
									<span>1</span>
									{t('When will you pick it up?')}
								</h2>
								<DayPicker label={t('Pick-up day') as string} days={days} value={day} onChange={setDay} />
								<input
									className={'memo'}
									placeholder={t('Message to the seller, e.g. a time that suits you (optional)') as string}
									maxLength={200}
									value={note}
									onChange={(e) => setNote(e.target.value)}
								/>
							</section>

							<section className={'checkout-step'}>
								<h2>
									<span>2</span>
									{t('Payment')}
								</h2>
								<PaymentForm value={payment} onChange={setPayment} />
							</section>
						</div>

						<aside className={'commerce-summary'}>
							<h2>{t('Order summary')}</h2>
							<dl>
								<dt>{t('Price')}</dt>
								<dd>{formatPrice(price)}</dd>
								<dt>{t('Delivery')}</dt>
								<dd>{t('You pick it up')}</dd>
							</dl>
							<div className={'summary-total'}>
								<span>{t('Total')}</span>
								<strong>{formatPrice(price)}</strong>
							</div>
							<button
								type={'button'}
								className={'pill-dark wide'}
								disabled={!day || !isPaymentReady(payment) || placing}
								onClick={reserveHandler}
							>
								{placing ? (
									<CircularProgress size={20} color={'inherit'} />
								) : (
									<>
										<LockRoundedIcon fontSize={'small'} />
										{t('Pay {{total}} and reserve', { total: formatPrice(price) })}
									</>
								)}
							</button>
							{!day && <p className={'summary-note'}>{t('Choose a pick-up day first.')}</p>}
						</aside>
					</div>
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Reserve);
