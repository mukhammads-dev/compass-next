import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { GET_PRODUCTS } from '../../../apollo/user/query';
import { LIKE_TARGET_PRODUCT } from '../../../apollo/user/mutation';
import { Product } from '../../types/product/product';
import { ProductsInquiry } from '../../types/product/product.input';
import { ProductCondition } from '../../enums/product.enum';
import { Direction, Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { T } from '../../types/common';
import ProductCard from '../common/ProductCard';
import { flipLike, settleLike } from '../../like';

interface ProductTab {
	id: string;
	label: string;
	inquiry: ProductsInquiry;
}

const base = { page: 1, limit: 10, direction: Direction.DESC };

/**
 * One section, many shelves: each tab is a different product inquiry, shown as one swipeable row.
 */
const TABS: ProductTab[] = [
	{
		id: 'trending',
		label: 'Trending now',
		inquiry: { ...base, sort: 'productRank', search: {} },
	},
	{
		id: 'new',
		label: 'New arrivals',
		inquiry: { ...base, sort: 'createdAt', search: { conditionList: [ProductCondition.NEW] } },
	},
	{
		id: 'homes',
		label: 'Seen in homes',
		inquiry: { ...base, sort: 'productRoomTours', search: {} },
	},
	{
		id: 'sale',
		label: 'On sale',
		inquiry: { ...base, sort: 'productRank', search: { onSale: true } },
	},
];

const ProductTabs = () => {
	const { t } = useTranslation('common');
	const [active, setActive] = useState<ProductTab>(TABS[0]);
	const [products, setProducts] = useState<Product[]>([]);
	const railRef = useRef<HTMLDivElement>(null);

	/** APOLLO REQUESTS **/
	const [likeTargetProduct] = useMutation(LIKE_TARGET_PRODUCT);

	const { loading } = useQuery(GET_PRODUCTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: active.inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => setProducts(data?.getProducts?.list ?? []),
	});

	/** HANDLERS **/
	const likeProductHandler = async (user: T, id: string) => {
		if (!id) return;
		if (!user._id) return sweetMixinErrorAlert(Message.NOT_AUTHENTICATED);
		const before = products;
		setProducts((list) => list.map((item) => (item._id === id ? flipLike(item, 'productLikes') : item)));
		try {
			const { data } = await likeTargetProduct({ variables: { input: id } });
			const reply = data?.likeTargetProduct;
			setProducts((list) => list.map((item) => (item._id === id ? settleLike(item, 'productLikes', reply) : item)));
		} catch (err: any) {
			setProducts(before);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const scrollRail = (direction: 1 | -1) => {
		const rail = railRef.current;
		if (!rail) return;
		rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' });
	};

	const changeTab = (tab: ProductTab) => {
		setActive(tab);
		railRef.current?.scrollTo({ left: 0 });
	};

	const seeAllHref = {
		pathname: '/product',
		query: { input: JSON.stringify({ ...active.inquiry, page: 1, limit: 12 }) },
	};

	return (
		<Stack className={'home-section product-tabs'}>
			<Stack className={'container'}>
				<Stack className={'section-head'}>
					<h2>{t('Shop Compass')}</h2>
					<Link href={seeAllHref}>
						{t('See all')} <ArrowForwardIcon fontSize={'inherit'} />
					</Link>
				</Stack>

				<div className={'tab-bar'}>
					<div className={'tab-row'} role={'tablist'}>
						{TABS.map((tab) => (
							<button
								key={tab.id}
								role={'tab'}
								aria-selected={tab.id === active.id}
								className={tab.id === active.id ? 'active' : ''}
								onClick={() => changeTab(tab)}
							>
								{t(tab.label)}
							</button>
						))}
					</div>
					<div className={'rail-arrows'}>
						<button onClick={() => scrollRail(-1)} aria-label={t('Previous') as string}>
							<ChevronLeftIcon />
						</button>
						<button onClick={() => scrollRail(1)} aria-label={t('Next') as string}>
							<ChevronRightIcon />
						</button>
					</div>
				</div>

				{products.length === 0 && !loading ? (
					<div className={'tab-empty'}>{t('Nothing here yet — check back soon.')}</div>
				) : (
					<div ref={railRef} className={`product-rail ${loading ? 'is-loading' : ''}`} role={'tabpanel'}>
						{products.map((product: Product) => (
							<ProductCard key={product._id} product={product} likeProductHandler={likeProductHandler} />
						))}
					</div>
				)}
			</Stack>
		</Stack>
	);
};

export default ProductTabs;
