import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, Button, CircularProgress, Stack } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import FitCheck from '../../libs/components/product/FitCheck';
import ProductCard from '../../libs/components/common/ProductCard';
import RoomTourCard from '../../libs/components/common/RoomTourCard';
import CommentSection from '../../libs/components/common/CommentSection';
import NoData from '../../libs/components/common/NoData';
import { userVar } from '../../apollo/store';
import { GET_PRODUCT, GET_PRODUCT_ROOM_TOURS, GET_SIMILAR_PRODUCTS } from '../../apollo/user/query';
import { LIKE_TARGET_PRODUCT, UPDATE_PRODUCT } from '../../apollo/user/mutation';
import { Product } from '../../libs/types/product/product';
import { ProductUpdate } from '../../libs/types/product/product.update';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Message } from '../../libs/enums/common.enum';
import { ProductCondition, ProductStatus } from '../../libs/enums/product.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { DEFAULT_AVATAR, DEFAULT_PRODUCT_IMAGE, imageUrl } from '../../libs/config';
import { discountPercent, enumLabel, formatPrice } from '../../libs/utils';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const ProductDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const productId = (router.query.id as string) ?? '';
	const [product, setProduct] = useState<Product | null>(null);
	const [activeImage, setActiveImage] = useState<number>(0);
	const [roomTours, setRoomTours] = useState<BoardArticle[]>([]);
	const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetProduct] = useMutation(LIKE_TARGET_PRODUCT);
	const [updateProduct] = useMutation<unknown, { input: ProductUpdate }>(UPDATE_PRODUCT);

	const { loading, refetch: getProductRefetch } = useQuery(GET_PRODUCT, {
		fetchPolicy: 'network-only',
		variables: { input: productId },
		skip: !productId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setProduct(data?.getProduct ?? null);
			setActiveImage(0);
		},
	});

	useQuery(GET_PRODUCT_ROOM_TOURS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { productId, page: 1, limit: 3 } },
		skip: !productId,
		onCompleted: (data: T) => setRoomTours(data?.getProductRoomTours?.list ?? []),
	});

	useQuery(GET_SIMILAR_PRODUCTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: productId },
		skip: !productId,
		onCompleted: (data: T) => setSimilarProducts(data?.getSimilarProducts ?? []),
	});

	/** HANDLERS **/
	const reloadProduct = async () => {
		const { data } = await getProductRefetch({ input: productId });
		setProduct(data?.getProduct ?? null);
	};

	const likeProductHandler = async () => {
		try {
			if (!productId) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetProduct({ variables: { input: productId } });
			await reloadProduct();
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeProductHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const markSoldHandler = async () => {
		try {
			if (!product) return;
			if (!(await sweetConfirmAlert(t('Mark this product as sold?') as string))) return;
			await updateProduct({ variables: { input: { _id: product._id, productStatus: ProductStatus.SOLD } } });
			await reloadProduct();
		} catch (err: any) {
			console.log('ERROR, markSoldHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (loading && !product) {
		return (
			<Stack className={'loading-box full'}>
				<CircularProgress />
			</Stack>
		);
	}

	if (!product) {
		return (
			<Stack id={'product-detail-page'}>
				<Stack className={'container'}>
					<NoData text={'Product not found'} />
				</Stack>
			</Stack>
		);
	}

	const discount = discountPercent(product.productPrice, product.productSalePrice);
	const liked = Boolean(product.meLiked?.[0]?.myFavorite);
	const isOwner = product.memberId === user._id;
	const seller = product.memberData;

	return (
		<Stack id={'product-detail-page'}>
			<Stack className={'container'}>
				<Stack className={'breadcrumbs'}>
					<Link href={'/product'}>{t('Shop')}</Link>
					<span>/</span>
					<span>{t(enumLabel(product.productType))}</span>
				</Stack>

				<Stack className={'detail-top'}>
					<Stack className={'gallery'}>
						<div className={'main-image'}>
							<img
								src={imageUrl(product.productImages?.[activeImage], DEFAULT_PRODUCT_IMAGE)}
								alt={product.productTitle}
							/>
							{product.productStatus === ProductStatus.SOLD && <span className={'badge sold'}>{t('Sold')}</span>}
						</div>
						{product.productImages?.length > 1 && (
							<Stack className={'thumbs'}>
								{product.productImages.map((image, index) => (
									<button
										key={image}
										className={index === activeImage ? 'active' : ''}
										onClick={() => setActiveImage(index)}
									>
										<img src={imageUrl(image, DEFAULT_PRODUCT_IMAGE)} alt={''} />
									</button>
								))}
							</Stack>
						)}
					</Stack>

					<Stack className={'summary'}>
						<Stack className={'chips'}>
							<span className={product.productCondition === ProductCondition.USED ? 'used' : ''}>
								{t(enumLabel(product.productCondition))}
							</span>
							<span>{t(enumLabel(product.productStyle))}</span>
							<span>{t(enumLabel(product.productRoom))}</span>
						</Stack>
						<h1>{product.productTitle}</h1>
						<Stack className={'price'}>
							{discount > 0 && (
								<>
									<span className={'discount'}>{discount}%</span>
									<del>{formatPrice(product.productPrice)}</del>
								</>
							)}
							<strong>{formatPrice(discount > 0 ? product.productSalePrice : product.productPrice)}</strong>
						</Stack>

						<dl className={'spec'}>
							<dt>{t('Size')}</dt>
							<dd>
								W {product.productWidth} × D {product.productDepth} × H {product.productHeight} cm
							</dd>
							<dt>{t('Material')}</dt>
							<dd>{t(enumLabel(product.productMaterial))}</dd>
							<dt>{t('Color')}</dt>
							<dd>{product.productColor}</dd>
							<dt>{t('Delivery')}</dt>
							<dd>{product.productDeliveryFee ? formatPrice(product.productDeliveryFee) : t('Free')}</dd>
							<dt>{t('Assembly')}</dt>
							<dd>{product.productAssembly ? t('Required') : t('Not required')}</dd>
							<dt>{t('Location')}</dt>
							<dd>
								{t(enumLabel(product.productLocation))} · {product.productAddress}
							</dd>
						</dl>

						<FitCheck productId={product._id} />

						<Stack className={'actions'}>
							<Button
								variant={liked ? 'contained' : 'outlined'}
								color={liked ? 'secondary' : 'primary'}
								startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
								onClick={likeProductHandler}
							>
								{product.productLikes}
							</Button>
							{isOwner ? (
								<>
									<Link href={{ pathname: '/mypage', query: { category: 'addProduct', productId: product._id } }}>
										<Button variant={'outlined'}>{t('Edit')}</Button>
									</Link>
									{product.productStatus === ProductStatus.ACTIVE && (
										<Button variant={'contained'} onClick={markSoldHandler}>
											{t('Mark as sold')}
										</Button>
									)}
								</>
							) : (
								<Button variant={'contained'} size={'large'} disabled={product.productStatus !== ProductStatus.ACTIVE}>
									{seller?.memberType === MemberType.AGENT ? t('Contact store') : t('Contact seller')}
								</Button>
							)}
						</Stack>

						{seller && (
							<Link href={{ pathname: '/member', query: { memberId: seller._id } }} className={'seller'}>
								<Avatar src={imageUrl(seller.memberImage, DEFAULT_AVATAR)} />
								<Stack>
									<strong>{seller.memberNick}</strong>
									<span>
										{seller.memberType === MemberType.AGENT ? t('Store') : t('Neighbour seller')} ·{' '}
										{seller.memberFollowers} {t('Followers')}
									</span>
								</Stack>
							</Link>
						)}
					</Stack>
				</Stack>

				{product.productDesc && (
					<Stack className={'detail-section'}>
						<h3>{t('Description')}</h3>
						<p className={'desc'}>{product.productDesc}</p>
					</Stack>
				)}

				<Stack className={'detail-section'}>
					<h3>
						{t('Seen in Room Tours')} <span>{product.productRoomTours}</span>
					</h3>
					{roomTours.length ? (
						<Stack className={'grid grid-3'}>
							{roomTours.map((article) => (
								<RoomTourCard key={article._id} article={article} />
							))}
						</Stack>
					) : (
						<p className={'muted'}>{t('No Room Tour has tagged this product yet.')}</p>
					)}
				</Stack>

				{similarProducts.length > 0 && (
					<Stack className={'detail-section'}>
						<h3>{t('Similar products')}</h3>
						<Stack className={'grid grid-4'}>
							{similarProducts.map((item) => (
								<ProductCard key={item._id} product={item} compact />
							))}
						</Stack>
					</Stack>
				)}

				<CommentSection commentGroup={CommentGroup.PRODUCT} commentRefId={product._id} />
			</Stack>
		</Stack>
	);
};

export default withLayoutFull(ProductDetail);
