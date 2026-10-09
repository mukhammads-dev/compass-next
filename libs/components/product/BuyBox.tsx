import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { CircularProgress } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import { userVar } from '../../../apollo/store';
import { ADD_TO_CART } from '../../../apollo/user/mutation';
import { Product } from '../../types/product/product';
import { ProductCondition, ProductStatus } from '../../enums/product.enum';
import { MemberType } from '../../enums/member.enum';
import { ASSEMBLY_FEE, MAX_ITEM_QUANTITY } from '../../config';
import { formatPrice } from '../../utils';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface BuyBoxProps {
	product: Product;
}

/**
 * How a piece is bought depends on what it is:
 * NEW from a store → cart and delivery on a chosen day; USED from a neighbour → reserve, pay safely, pick up.
 */
const BuyBox = ({ product }: BuyBoxProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [quantity, setQuantity] = useState<number>(1);
	const [assembly, setAssembly] = useState<boolean>(false);
	const [busy, setBusy] = useState<'cart' | 'buy' | null>(null);

	const [addToCart] = useMutation(ADD_TO_CART, { refetchQueries: ['GetMyCart'] });

	const seller = product.memberData;
	const sellerName = seller?.memberNick ?? '';
	const isUsed = product.productCondition === ProductCondition.USED;
	const maxQuantity = Math.max(1, Math.min(product.productStock ?? 1, MAX_ITEM_QUANTITY));

	const loginFirst = (): boolean => {
		if (user._id) return false;
		router.push({ pathname: '/account/join', query: { back: router.asPath } }).then();
		return true;
	};

	/** HANDLERS **/
	const addHandler = async (then: 'stay' | 'checkout') => {
		if (loginFirst()) return;
		try {
			setBusy(then === 'stay' ? 'cart' : 'buy');
			await addToCart({ variables: { input: { productId: product._id, quantity, assembly } } });
			if (then === 'checkout') {
				await router.push({ pathname: '/checkout', query: { items: product._id } });
			} else {
				await sweetTopSmallSuccessAlert(t('Added to your cart'), 900);
			}
		} catch (err: any) {
			console.log('ERROR, addHandler:', err.message);
			sweetMixinErrorAlert(t(err.message)).then();
		} finally {
			setBusy(null);
		}
	};

	if (product.productStatus === ProductStatus.RESERVED) {
		return (
			<div className={'buy-box closed'}>
				<strong>{t('Reserved')}</strong>
				<p>{t('Someone has paid for this piece and is picking it up.')}</p>
			</div>
		);
	}

	if (product.productStatus !== ProductStatus.ACTIVE) {
		return (
			<div className={'buy-box closed'}>
				<strong>{t('Sold out')}</strong>
				<p>{t('This piece has found a new home.')}</p>
			</div>
		);
	}

	if (isUsed) {
		return (
			<div className={'buy-box'}>
				<Link
					href={{ pathname: '/checkout/reserve', query: { id: product._id } }}
					className={'buy-primary'}
					onClick={(e) => {
						if (loginFirst()) e.preventDefault();
					}}
				>
					{t('Reserve and pay safely')}
				</Link>
				<p className={'buy-note'}>
					<HandshakeOutlinedIcon />
					<span>
						{t(
							'Compass holds your payment until you pick it up from {{seller}}. Not as described? Cancel and get it back.',
							{
								seller: sellerName,
							},
						)}
					</span>
				</p>
			</div>
		);
	}

	return (
		<div className={'buy-box'}>
			<div className={'buy-stock'}>
				{product.productStock <= 3 ? (
					<strong className={'low'}>{t('Only {{count}} left', { count: product.productStock })}</strong>
				) : (
					<strong>{t('In stock')}</strong>
				)}
			</div>

			{product.productAssembly && (
				<label className={'buy-option'}>
					<input type={'checkbox'} checked={assembly} onChange={(e) => setAssembly(e.target.checked)} />
					<span className={'box'} aria-hidden />
					<span>
						{t('Assembly by an installer')} <em>+{formatPrice(ASSEMBLY_FEE)}</em>
					</span>
				</label>
			)}

			<div className={'buy-row'}>
				<div className={'qty'} role={'group'} aria-label={t('Quantity') as string}>
					<button
						type={'button'}
						aria-label={t('Fewer') as string}
						disabled={quantity <= 1}
						onClick={() => setQuantity(quantity - 1)}
					>
						<RemoveRoundedIcon />
					</button>
					<span aria-live={'polite'}>{quantity}</span>
					<button
						type={'button'}
						aria-label={t('More') as string}
						disabled={quantity >= maxQuantity}
						onClick={() => setQuantity(quantity + 1)}
					>
						<AddRoundedIcon />
					</button>
				</div>
				<button type={'button'} className={'buy-secondary'} disabled={Boolean(busy)} onClick={() => addHandler('stay')}>
					{busy === 'cart' ? <CircularProgress size={18} color={'inherit'} /> : t('Add to cart')}
				</button>
				<button
					type={'button'}
					className={'buy-primary'}
					disabled={Boolean(busy)}
					onClick={() => addHandler('checkout')}
				>
					{busy === 'buy' ? <CircularProgress size={18} color={'inherit'} /> : t('Buy now')}
				</button>
			</div>

			<p className={'buy-note'}>
				<LocalShippingOutlinedIcon />
				<span>
					{seller?.memberType === MemberType.AGENT
						? t('{{store}} delivers it on the day you choose, Monday to Saturday.', { store: sellerName })
						: t('Delivered on the day you choose, Monday to Saturday.')}
				</span>
			</p>
		</div>
	);
};

export default BuyBox;
