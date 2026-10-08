import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Product } from '../../types/product/product';
import { ProductCondition } from '../../enums/product.enum';
import { DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../config';
import { enumLabel, formatPrice } from '../../utils';
import { LensPick, pickLabel } from './LensStage';

interface LensResultsProps {
	picks: LensPick[];
	selectedId: string | null;
	scanning: boolean;
	error: string;
	onSelect: (id: string) => void;
	onRetry: () => void;
}

const MatchRow = ({ product }: { product: Product }) => {
	const { t } = useTranslation('common');
	const onSale = Boolean(product.productSalePrice && product.productSalePrice < product.productPrice);
	return (
		<li>
			<Link href={{ pathname: '/product/detail', query: { id: product._id } }} className={'match-row'}>
				<img
					src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)}
					alt={product.productTitle}
					loading={'lazy'}
				/>
				<span className={'match-info'}>
					<strong>{product.productTitle}</strong>
					<small>
						{product.productWidth} × {product.productDepth} × {product.productHeight} cm
					</small>
					<small>{product.memberData?.memberNick}</small>
				</span>
				<span className={'match-price'}>
					{formatPrice(onSale ? product.productSalePrice : product.productPrice)}
					{onSale && <s>{formatPrice(product.productPrice)}</s>}
					{product.productCondition === ProductCondition.USED && <em>{t('Used')}</em>}
				</span>
			</Link>
		</li>
	);
};

/** Right-hand panel: every find as a chip, and the closest products for the selected one. */
const LensResults = ({ picks, selectedId, scanning, error, onSelect, onRetry }: LensResultsProps) => {
	const { t } = useTranslation('common');
	const selected = picks.find((pick) => pick.id === selectedId);

	if (error) {
		return (
			<aside className={'lens-panel'}>
				<p className={'lens-message'}>{t(error)}</p>
				<button type={'button'} className={'btn-line'} onClick={onRetry}>
					{t('Choose another photo')}
				</button>
			</aside>
		);
	}

	if (scanning) {
		return (
			<aside className={'lens-panel'} aria-busy>
				<p className={'lens-message'}>{t('Finding furniture in your photo…')}</p>
				<ul className={'match-list is-skeleton'} aria-hidden>
					{[0, 1, 2].map((key) => (
						<li key={key} />
					))}
				</ul>
			</aside>
		);
	}

	const shopHref = selected?.productType && {
		pathname: '/product',
		query: {
			input: JSON.stringify({ page: 1, limit: 12, sort: 'productRank', search: { typeList: [selected.productType] } }),
		},
	};

	return (
		<aside className={'lens-panel'}>
			{picks.length > 0 && (
				<div className={'lens-chips'}>
					{picks.map((pick) => (
						<button
							key={pick.id}
							type={'button'}
							className={pick.id === selectedId ? 'active' : ''}
							onClick={() => onSelect(pick.id)}
							aria-pressed={pick.id === selectedId}
						>
							{pickLabel(pick, t)}
						</button>
					))}
				</div>
			)}

			{!selected && (
				<p className={'lens-message'}>{t('No furniture found in this photo. Tap the piece you want to shop.')}</p>
			)}

			{selected && (
				<>
					<header className={'panel-head'}>
						<h2>{pickLabel(selected, t)}</h2>
						{!selected.loading && (
							<span>
								{selected.products.length} {t(selected.products.length === 1 ? 'match' : 'matches')}
							</span>
						)}
					</header>

					{selected.loading && (
						<ul className={'match-list is-skeleton'} aria-hidden>
							{[0, 1, 2].map((key) => (
								<li key={key} />
							))}
						</ul>
					)}

					{!selected.loading && selected.products.length > 0 && (
						<ul className={'match-list'}>
							{selected.products.map((product) => (
								<MatchRow key={product._id} product={product} />
							))}
						</ul>
					)}

					{!selected.loading && !selected.products.length && (
						<p className={'lens-message'}>{t('Nothing like this on Compass yet. Tap another spot on the photo.')}</p>
					)}

					{shopHref && !selected.loading && (
						<Link href={shopHref} className={'panel-more'}>
							{t('Shop all {{type}}', { type: t(enumLabel(selected.productType)).toLowerCase() })}
						</Link>
					)}
				</>
			)}
		</aside>
	);
};

export default LensResults;
