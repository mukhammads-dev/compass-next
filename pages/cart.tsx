import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, CircularProgress, Stack } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { userVar } from '../apollo/store';
import { GET_MY_CART } from '../apollo/user/query';
import { REMOVE_CART_ITEM, UPDATE_CART_ITEM } from '../apollo/user/mutation';
import { CartItem } from '../libs/types/cart/cart';
import { getJwtToken, updateUserInfo } from '../libs/auth';
import { ASSEMBLY_FEE, DEFAULT_AVATAR, DEFAULT_PRODUCT_IMAGE, imageUrl } from '../libs/config';
import { formatPrice } from '../libs/utils';
import { sweetMixinErrorAlert } from '../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const unitPrice = (item: CartItem) => {
	const product = item.productData;
	if (!product) return 0;
	return product.productSalePrice && product.productSalePrice < product.productPrice
		? product.productSalePrice
		: product.productPrice;
};

/** Lines grouped by store: every store delivers its own pieces in one truck. */
const groupByStore = (items: CartItem[]) => {
	const groups = new Map<string, CartItem[]>();
	for (const item of items) {
		const key = item.productData?.memberId ?? 'unknown';
		groups.set(key, [...(groups.get(key) ?? []), item]);
	}
	return [...groups.values()];
};

const Cart: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_MY_CART, { fetchPolicy: 'cache-and-network', skip: !user._id });
	const [updateCartItem] = useMutation(UPDATE_CART_ITEM, { refetchQueries: ['GetMyCart'], awaitRefetchQueries: true });
	const [removeCartItem] = useMutation(REMOVE_CART_ITEM, { refetchQueries: ['GetMyCart'], awaitRefetchQueries: true });

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.isReady && !updateUserInfo(getJwtToken())) {
			router.replace({ pathname: '/account/join', query: { back: '/cart' } }).then();
		}
	}, [router]);

	const items: CartItem[] = data?.getMyCart ?? [];
	const ready = items.filter((item) => item.available && item.quantity <= item.maxQuantity);
	const blocked = items.length - ready.length;
	const stores = groupByStore(items);

	const itemsTotal = ready.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);
	const assemblyTotal = ready.reduce((sum, item) => sum + (item.assembly ? ASSEMBLY_FEE * item.quantity : 0), 0);
	const deliveryTotal = groupByStore(ready).reduce(
		(sum, lines) => sum + Math.max(...lines.map((line) => line.productData?.productDeliveryFee ?? 0)),
		0,
	);

	/** HANDLERS **/
	const run = async (task: () => Promise<unknown>) => {
		try {
			await task();
		} catch (err: any) {
			console.log('ERROR, cart:', err.message);
			sweetMixinErrorAlert(t(err.message)).then();
		}
	};
	const setQuantity = (item: CartItem, quantity: number) =>
		run(() => updateCartItem({ variables: { input: { productId: item.productId, quantity } } }));
	const setAssembly = (item: CartItem, assembly: boolean) =>
		run(() => updateCartItem({ variables: { input: { productId: item.productId, assembly } } }));
	const remove = (item: CartItem) => run(() => removeCartItem({ variables: { productId: item.productId } }));

	if (loading && !data) {
		return (
			<Stack className={'loading-box'}>
				<CircularProgress />
			</Stack>
		);
	}

	return (
		<Stack id={'cart-page'} className={'commerce-page'}>
			<Stack className={'container'}>
				<header className={'commerce-head'}>
					<h1>{t('Your cart')}</h1>
					{items.length > 0 && <span>{t('{{count}} pieces', { count: items.length })}</span>}
				</header>

				{!items.length ? (
					<div className={'commerce-empty'}>
						<strong>{t('Your cart is empty')}</strong>
						<p>{t('Find something you love in a real home, then add it here.')}</p>
						<Link href={'/product'} className={'pill-dark'}>
							{t('Browse the shop')}
						</Link>
					</div>
				) : (
					<div className={'commerce-layout'}>
						<div className={'commerce-main'}>
							{stores.map((lines) => {
								const store = lines[0].productData?.memberData;
								const fee = Math.max(...lines.map((line) => line.productData?.productDeliveryFee ?? 0));
								return (
									<section key={lines[0]._id} className={'store-block'}>
										<header>
											<Avatar src={imageUrl(store?.memberImage, DEFAULT_AVATAR)} alt={''} />
											<strong>{store?.memberNick}</strong>
											<span>
												<LocalShippingOutlinedIcon />
												{fee ? t('One delivery, {{fee}}', { fee: formatPrice(fee) }) : t('Free delivery')}
											</span>
										</header>

										{lines.map((item) => {
											const product = item.productData;
											const over = item.available && item.quantity > item.maxQuantity;
											return (
												<div key={item._id} className={`cart-line ${item.available ? '' : 'unavailable'}`}>
													<Link
														href={{ pathname: '/product/detail', query: { id: item.productId } }}
														className={'thumb'}
													>
														<img src={imageUrl(product?.productImages?.[0], DEFAULT_PRODUCT_IMAGE)} alt={''} />
													</Link>
													<div className={'line-info'}>
														<Link href={{ pathname: '/product/detail', query: { id: item.productId } }}>
															<strong>{product?.productTitle ?? t('Removed product')}</strong>
														</Link>
														{product && (
															<small>
																W {product.productWidth} × D {product.productDepth} × H {product.productHeight} cm
															</small>
														)}
														{!item.available && <em className={'warn'}>{t('No longer available')}</em>}
														{over && (
															<em className={'warn'}>{t('Only {{count}} left', { count: item.maxQuantity })}</em>
														)}
														{item.available && product?.productAssembly && (
															<label className={'buy-option small'}>
																<input
																	type={'checkbox'}
																	checked={item.assembly}
																	onChange={(e) => setAssembly(item, e.target.checked)}
																/>
																<span className={'box'} aria-hidden />
																<span>
																	{t('Assembly by an installer')} <em>+{formatPrice(ASSEMBLY_FEE)}</em>
																</span>
															</label>
														)}
													</div>
													{item.available && (
														<div className={'qty small'} role={'group'} aria-label={t('Quantity') as string}>
															<button
																type={'button'}
																aria-label={t('Fewer') as string}
																disabled={item.quantity <= 1}
																onClick={() => setQuantity(item, item.quantity - 1)}
															>
																<RemoveRoundedIcon />
															</button>
															<span>{item.quantity}</span>
															<button
																type={'button'}
																aria-label={t('More') as string}
																disabled={item.quantity >= item.maxQuantity}
																onClick={() => setQuantity(item, item.quantity + 1)}
															>
																<AddRoundedIcon />
															</button>
														</div>
													)}
													<strong className={'line-total'}>{formatPrice(unitPrice(item) * item.quantity)}</strong>
													<button
														type={'button'}
														className={'line-remove'}
														aria-label={t('Remove') as string}
														onClick={() => remove(item)}
													>
														<CloseRoundedIcon />
													</button>
												</div>
											);
										})}
									</section>
								);
							})}
						</div>

						<aside className={'commerce-summary'}>
							<dl>
								<dt>{t('Items')}</dt>
								<dd>{formatPrice(itemsTotal)}</dd>
								<dt>{t('Delivery')}</dt>
								<dd>{deliveryTotal ? formatPrice(deliveryTotal) : t('Free')}</dd>
								{assemblyTotal > 0 && (
									<>
										<dt>{t('Assembly')}</dt>
										<dd>{formatPrice(assemblyTotal)}</dd>
									</>
								)}
							</dl>
							<div className={'summary-total'}>
								<span>{t('Total')}</span>
								<strong>{formatPrice(itemsTotal + deliveryTotal + assemblyTotal)}</strong>
							</div>
							<p className={'summary-note'}>{t('A stairs fee is added at checkout if your building has no lift.')}</p>
							{blocked > 0 && (
								<p className={'summary-warn'}>{t('Remove or fix the pieces marked above to check out.')}</p>
							)}
							<button
								type={'button'}
								className={'pill-dark wide'}
								disabled={!ready.length || blocked > 0}
								onClick={() => router.push('/checkout')}
							>
								{t('Check out')}
							</button>
						</aside>
					</div>
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Cart);
