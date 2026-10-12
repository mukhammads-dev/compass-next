import { useRouter } from 'next/router';
import { ChangeEvent, useState } from 'react';
import { useLazyQuery, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Button, IconButton, MenuItem, Stack, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { userVar } from '../../../apollo/store';
import { GET_BOARD_ARTICLE, GET_PRODUCTS } from '../../../apollo/user/query';
import { CREATE_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { BoardArticleInput, TaggedProductInput } from '../../types/board-article/board-article.input';
import { BoardArticleUpdate } from '../../types/board-article/board-article.update';
import { Product } from '../../types/product/product';
import { BoardArticleCategory, HomeType, TagSource } from '../../enums/board-article.enum';
import { ProductStyle } from '../../enums/product.enum';
import { Direction, Message } from '../../enums/common.enum';
import { uploadImage, uploadImages } from '../../upload';
import {
	DEFAULT_PRODUCT_IMAGE,
	DEFAULT_ROOM_IMAGE,
	MAX_ROOM_TOUR_IMAGES,
	MAX_ROOM_TOUR_TAGS,
	homeTypes,
	imageUrl,
	productStyles,
	validImageTypes,
} from '../../config';
import { enumLabel, formatPrice } from '../../utils';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import TaggedImage from '../room-tour/TaggedImage';
import { T } from '../../types/common';

const CATEGORIES = [
	BoardArticleCategory.ROOM_TOUR,
	BoardArticleCategory.QNA,
	BoardArticleCategory.TIPS,
	BoardArticleCategory.FREE,
];

interface PendingPin {
	imageIndex: number;
	x: number;
	y: number;
}

const emptyArticle = (category: BoardArticleCategory): BoardArticleInput => ({
	articleCategory: category,
	articleTitle: '',
	articleContent: '',
	articleImage: undefined,
	roomImages: [],
	homeType: undefined,
	homeSize: undefined,
	homeStyle: undefined,
	taggedProducts: [],
});

/**
 * Write or edit (?articleId=) a post. For a Room Tour the writer uploads room photos,
 * taps the photo where a product is, and picks that product → a pin (x / y in percent).
 */
const WriteArticle = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const articleId = (router.query.articleId as string) ?? '';
	const initialCategory = CATEGORIES.includes(router.query.articleCategory as BoardArticleCategory)
		? (router.query.articleCategory as BoardArticleCategory)
		: BoardArticleCategory.ROOM_TOUR;
	const [insertData, setInsertData] = useState<BoardArticleInput>(emptyArticle(initialCategory));
	const [taggedProductsData, setTaggedProductsData] = useState<Product[]>([]);
	const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
	const [productText, setProductText] = useState<string>('');
	const [uploading, setUploading] = useState<boolean>(false);
	const isRoomTour = insertData.articleCategory === BoardArticleCategory.ROOM_TOUR;
	const roomImages = insertData.roomImages ?? [];
	const tags = insertData.taggedProducts ?? [];

	/** APOLLO REQUESTS **/
	const [createBoardArticle, { loading: creating }] = useMutation(CREATE_BOARD_ARTICLE);
	const [updateBoardArticle, { loading: updating }] = useMutation<unknown, { input: BoardArticleUpdate }>(UPDATE_BOARD_ARTICLE);
	const [searchProducts, { data: productSearchData }] = useLazyQuery(GET_PRODUCTS, { fetchPolicy: 'network-only' });

	useQuery(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: { input: articleId },
		skip: !articleId,
		onCompleted: (data: T) => {
			const article = data?.getBoardArticle;
			if (!article || article.memberId !== user._id) return;
			setInsertData({
				articleCategory: article.articleCategory,
				articleTitle: article.articleTitle,
				articleContent: article.articleContent,
				articleImage: article.articleImage ?? undefined,
				roomImages: article.roomImages ?? [],
				homeType: article.homeType ?? undefined,
				homeSize: article.homeSize ?? undefined,
				homeStyle: article.homeStyle ?? undefined,
				taggedProducts: (article.taggedProducts ?? []).map((tag: T) => ({
					productId: tag.productId,
					imageIndex: tag.imageIndex,
					x: tag.x,
					y: tag.y,
					source: tag.source,
				})),
			});
			setTaggedProductsData(article.taggedProductsData ?? []);
		},
	});

	/** HANDLERS **/
	const setField = <K extends keyof BoardArticleInput>(key: K, value: BoardArticleInput[K]) =>
		setInsertData((prev) => ({ ...prev, [key]: value }));

	const uploadRoomImagesHandler = async (e: ChangeEvent<HTMLInputElement>) => {
		try {
			const files = Array.from(e.target.files ?? []);
			if (!files.length) return;
			const room = MAX_ROOM_TOUR_IMAGES - roomImages.length;
			if (room <= 0) throw new Error(`${t('Maximum images')}: ${MAX_ROOM_TOUR_IMAGES}`);
			setUploading(true);
			const paths = await uploadImages(files.slice(0, room), 'community');
			setField('roomImages', [...roomImages, ...paths]);
		} catch (err: any) {
			console.log('ERROR, uploadRoomImagesHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	const uploadArticleImageHandler = async (e: ChangeEvent<HTMLInputElement>) => {
		try {
			const file = e.target.files?.[0];
			if (!file) return;
			setUploading(true);
			setField('articleImage', await uploadImage(file, 'community'));
		} catch (err: any) {
			console.log('ERROR, uploadArticleImageHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	/** Removing a photo also drops its pins and shifts the pins of later photos. */
	const removeRoomImageHandler = (index: number) => {
		setInsertData((prev) => ({
			...prev,
			roomImages: (prev.roomImages ?? []).filter((_, i) => i !== index),
			taggedProducts: (prev.taggedProducts ?? [])
				.filter((tag) => tag.imageIndex !== index)
				.map((tag) => (tag.imageIndex > index ? { ...tag, imageIndex: tag.imageIndex - 1 } : tag)),
		}));
		setPendingPin(null);
	};

	const pickPositionHandler = (imageIndex: number, x: number, y: number) => {
		if (tags.length >= MAX_ROOM_TOUR_TAGS) {
			sweetMixinErrorAlert(`${t('Maximum pins')}: ${MAX_ROOM_TOUR_TAGS}`).then();
			return;
		}
		setPendingPin({ imageIndex, x, y });
	};

	const searchProductsHandler = async () => {
		await searchProducts({
			variables: {
				input: {
					page: 1,
					limit: 8,
					sort: 'productRank',
					direction: Direction.DESC,
					search: productText.trim() ? { text: productText.trim() } : {},
				},
			},
		});
	};

	const addTagHandler = (product: Product) => {
		if (!pendingPin) return;
		const tag: TaggedProductInput = { productId: product._id, ...pendingPin, source: TagSource.MANUAL };
		setField('taggedProducts', [...tags, tag]);
		if (!taggedProductsData.some((item) => item._id === product._id)) {
			setTaggedProductsData([...taggedProductsData, product]);
		}
		setPendingPin(null);
	};

	const removeTagHandler = (tagIndex: number) =>
		setField(
			'taggedProducts',
			tags.filter((_, i) => i !== tagIndex),
		);

	const saveArticleHandler = async () => {
		try {
			if (!insertData.articleTitle.trim() || !insertData.articleContent.trim()) throw new Error(Message.INSERT_ALL_INPUTS);
			if (isRoomTour && roomImages.length === 0) throw new Error(t('Add at least one room photo') as string);

			const base = {
				articleTitle: insertData.articleTitle.trim(),
				articleContent: insertData.articleContent.trim(),
				articleImage: insertData.articleImage,
				...(isRoomTour && {
					roomImages,
					homeType: insertData.homeType,
					homeSize: insertData.homeSize,
					homeStyle: insertData.homeStyle,
					taggedProducts: tags,
				}),
			};

			let savedId = articleId;
			if (articleId) {
				await updateBoardArticle({ variables: { input: { _id: articleId, ...base } } });
			} else {
				const result = await createBoardArticle({
					variables: { input: { articleCategory: insertData.articleCategory, ...base } },
				});
				savedId = result?.data?.createBoardArticle?._id;
			}

			await sweetMixinSuccessAlert(
				t(isRoomTour && !articleId ? 'Room Tour published! You earned points.' : 'Saved') as string,
			);
			await router.push({ pathname: isRoomTour ? '/room-tour/detail' : '/community/detail', query: { id: savedId } });
		} catch (err: any) {
			console.log('ERROR, saveArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const searchResults: Product[] = productSearchData?.getProducts?.list ?? [];

	return (
		<Stack className={'my-section'}>
			<h2>{articleId ? t('Edit post') : isRoomTour ? t('Share my room') : t('Write a post')}</h2>

			<Stack className={'article-form'}>
				<TextField
					select
					label={t('Board')}
					value={insertData.articleCategory}
					onChange={(e) => setField('articleCategory', e.target.value as BoardArticleCategory)}
					disabled={Boolean(articleId)}
				>
					{CATEGORIES.map((category) => (
						<MenuItem key={category} value={category}>
							{t(enumLabel(category))}
						</MenuItem>
					))}
				</TextField>

				<TextField
					label={t('Title')}
					value={insertData.articleTitle}
					onChange={(e) => setField('articleTitle', e.target.value)}
					inputProps={{ maxLength: 100 }}
					fullWidth
				/>

				{isRoomTour ? (
					<>
						<Stack className={'form-grid three'}>
							<TextField
								select
								label={t('Home type')}
								value={insertData.homeType ?? ''}
								onChange={(e) => setField('homeType', (e.target.value || undefined) as HomeType | undefined)}
							>
								<MenuItem value={''}>—</MenuItem>
								{homeTypes.map((type) => (
									<MenuItem key={type} value={type}>
										{t(enumLabel(type))}
									</MenuItem>
								))}
							</TextField>
							<TextField
								type={'number'}
								label={t('Size (㎡)')}
								value={insertData.homeSize ?? ''}
								onChange={(e) => setField('homeSize', e.target.value ? Math.max(0, Number(e.target.value)) : undefined)}
							/>
							<TextField
								select
								label={t('Style')}
								value={insertData.homeStyle ?? ''}
								onChange={(e) => setField('homeStyle', (e.target.value || undefined) as ProductStyle | undefined)}
							>
								<MenuItem value={''}>—</MenuItem>
								{productStyles.map((style) => (
									<MenuItem key={style} value={style}>
										{t(enumLabel(style))}
									</MenuItem>
								))}
							</TextField>
						</Stack>

						<Stack className={'form-block'}>
							<strong>
								{t('Room photos')} ({roomImages.length}/{MAX_ROOM_TOUR_IMAGES})
							</strong>
							<Stack className={'image-list'}>
								{roomImages.map((image, index) => (
									<div key={image} className={'image-item'}>
										<img src={imageUrl(image, DEFAULT_ROOM_IMAGE)} alt={''} />
										<IconButton size={'small'} onClick={() => removeRoomImageHandler(index)}>
											<CloseIcon fontSize={'inherit'} />
										</IconButton>
									</div>
								))}
								{roomImages.length < MAX_ROOM_TOUR_IMAGES && (
									<Button component={'label'} className={'image-add'} disabled={uploading}>
										<AddPhotoAlternateOutlinedIcon />
										<span>{uploading ? t('Uploading...') : t('Add photos')}</span>
										<input hidden multiple type={'file'} accept={validImageTypes} onChange={uploadRoomImagesHandler} />
									</Button>
								)}
							</Stack>
						</Stack>

						{roomImages.length > 0 && (
							<Stack className={'form-block tag-editor'}>
								<strong>
									{t('Tag products')} ({tags.length}/{MAX_ROOM_TOUR_TAGS})
								</strong>
								<TaggedImage
									images={roomImages}
									tags={tags.map((tag) => ({ ...tag, source: tag.source ?? TagSource.MANUAL }))}
									products={taggedProductsData}
									onPickPosition={pickPositionHandler}
									onRemoveTag={removeTagHandler}
								/>

								{pendingPin && (
									<Stack className={'product-picker'}>
										<Stack className={'picker-head'}>
											<strong>{t('Which product is here?')}</strong>
											<IconButton size={'small'} onClick={() => setPendingPin(null)}>
												<CloseIcon fontSize={'small'} />
											</IconButton>
										</Stack>
										<Stack className={'picker-search'}>
											<TextField
												size={'small'}
												fullWidth
												autoFocus
												value={productText}
												placeholder={t('Search products') as string}
												onChange={(e) => setProductText(e.target.value)}
												onKeyDown={(e) => e.key === 'Enter' && searchProductsHandler()}
											/>
											<Button variant={'outlined'} onClick={searchProductsHandler}>
												{t('Search')}
											</Button>
										</Stack>
										<Stack className={'picker-results'}>
											{searchResults.map((product) => (
												<button key={product._id} onClick={() => addTagHandler(product)}>
													<img src={imageUrl(product.productImages?.[0], DEFAULT_PRODUCT_IMAGE)} alt={''} />
													<span>
														<strong>{product.productTitle}</strong>
														<em>{formatPrice(product.productSalePrice ?? product.productPrice)}</em>
													</span>
												</button>
											))}
										</Stack>
									</Stack>
								)}
							</Stack>
						)}
					</>
				) : (
					<Stack className={'form-block'}>
						<strong>{t('Image (optional)')}</strong>
						<Stack className={'image-list'}>
							{insertData.articleImage && (
								<div className={'image-item'}>
									<img src={imageUrl(insertData.articleImage, DEFAULT_ROOM_IMAGE)} alt={''} />
									<IconButton size={'small'} onClick={() => setField('articleImage', undefined)}>
										<CloseIcon fontSize={'inherit'} />
									</IconButton>
								</div>
							)}
							{!insertData.articleImage && (
								<Button component={'label'} className={'image-add'} disabled={uploading}>
									<AddPhotoAlternateOutlinedIcon />
									<span>{uploading ? t('Uploading...') : t('Add photo')}</span>
									<input hidden type={'file'} accept={validImageTypes} onChange={uploadArticleImageHandler} />
								</Button>
							)}
						</Stack>
					</Stack>
				)}

				<TextField
					label={isRoomTour ? t('Tell the story of your room') : t('Content')}
					value={insertData.articleContent}
					onChange={(e) => setField('articleContent', e.target.value)}
					multiline
					minRows={6}
					fullWidth
				/>

				<Stack className={'form-actions'}>
					<Button variant={'outlined'} onClick={() => router.back()}>
						{t('Cancel')}
					</Button>
					<Button variant={'contained'} onClick={saveArticleHandler} disabled={creating || updating || uploading}>
						{articleId ? t('Save changes') : t('Publish')}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default WriteArticle;
