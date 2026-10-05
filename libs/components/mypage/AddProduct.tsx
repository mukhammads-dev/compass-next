import { useRouter } from 'next/router';
import { ChangeEvent, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Button, Checkbox, FormControlLabel, IconButton, MenuItem, Stack, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { userVar } from '../../../apollo/store';
import { GET_PRODUCT } from '../../../apollo/user/query';
import { CREATE_PRODUCT, UPDATE_PRODUCT } from '../../../apollo/user/mutation';
import { ProductInput } from '../../types/product/product.input';
import { ProductUpdate } from '../../types/product/product.update';
import {
	ProductCondition,
	ProductLocation,
	ProductMaterial,
	ProductRoom,
	ProductStyle,
	ProductType,
} from '../../enums/product.enum';
import { Message } from '../../enums/common.enum';
import { isAgent } from '../../auth';
import { uploadImages } from '../../upload';
import {
	DEFAULT_PRODUCT_IMAGE,
	MAX_PRODUCT_IMAGES,
	imageUrl,
	productLocations,
	productMaterials,
	productRooms,
	productStyles,
	productTypes,
	validImageTypes,
} from '../../config';
import { enumLabel } from '../../utils';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { T } from '../../types/common';

type NumberKey =
	'productPrice' | 'productSalePrice' | 'productWidth' | 'productDepth' | 'productHeight' | 'productDeliveryFee';

/** Won fields get thousand separators while they are not focused; cm fields stay bare. */
const MONEY_KEYS: NumberKey[] = ['productPrice', 'productSalePrice', 'productDeliveryFee'];

const EMPTY_NUMBER_TEXT: Record<NumberKey, string> = {
	productPrice: '',
	productSalePrice: '',
	productWidth: '',
	productDepth: '',
	productHeight: '',
	productDeliveryFee: '',
};

const groupDigits = (digits: string) => (digits ? Number(digits).toLocaleString('en-US') : '');

const toNumberText = (value?: number | null) =>
	value === undefined || value === null || value === 0 ? '' : String(value);

const emptyProduct = (condition: ProductCondition): ProductInput => ({
	productType: ProductType.FURNITURE,
	productRoom: ProductRoom.LIVING,
	productStyle: ProductStyle.MODERN,
	productMaterial: ProductMaterial.WOOD,
	productCondition: condition,
	productLocation: ProductLocation.SEOUL,
	productAddress: '',
	productTitle: '',
	productPrice: 0,
	productSalePrice: undefined,
	productWidth: 0,
	productDepth: 0,
	productHeight: 0,
	productColor: '',
	productDeliveryFee: 0,
	productAssembly: false,
	productImages: [],
	productDesc: '',
});

/** Create or edit (?productId=). A USER can only sell USED items; the backend enforces it too. */
const AddProduct = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const agent = isAgent(user);
	const productId = (router.query.productId as string) ?? '';
	const [insertData, setInsertData] = useState<ProductInput>(
		emptyProduct(agent ? ProductCondition.NEW : ProductCondition.USED),
	);
	/** Number inputs keep their own text so the box can be empty while you type.
	 *  Storing only the parsed number turned '' back into 0 on every keystroke. */
	const [numberText, setNumberText] = useState<Record<NumberKey, string>>(EMPTY_NUMBER_TEXT);
	const [focusedNumber, setFocusedNumber] = useState<NumberKey | null>(null);
	const [uploading, setUploading] = useState<boolean>(false);

	/** APOLLO REQUESTS **/
	const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT);
	const [updateProduct, { loading: updating }] = useMutation<unknown, { input: ProductUpdate }>(UPDATE_PRODUCT);

	useQuery(GET_PRODUCT, {
		fetchPolicy: 'network-only',
		variables: { input: productId },
		skip: !productId,
		onCompleted: (data: T) => {
			const product = data?.getProduct;
			if (!product || product.memberId !== user._id) return;
			const next = emptyProduct(product.productCondition);
			(Object.keys(next) as (keyof ProductInput)[]).forEach((key) => {
				if (product[key] !== undefined && product[key] !== null) (next as T)[key] = product[key];
			});
			setInsertData(next);
			setNumberText({
				productPrice: toNumberText(next.productPrice),
				productSalePrice: toNumberText(next.productSalePrice),
				productWidth: toNumberText(next.productWidth),
				productDepth: toNumberText(next.productDepth),
				productHeight: toNumberText(next.productHeight),
				productDeliveryFee: toNumberText(next.productDeliveryFee),
			});
		},
	});

	/** HANDLERS **/
	const setField = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
		setInsertData((prev) => ({ ...prev, [key]: value }));

	/** Digits only, no leading zeros, and an empty box is allowed to stay empty. */
	const setNumber = (key: NumberKey, raw: string) => {
		const digits = raw
			.replace(/[^\d]/g, '')
			.replace(/^0+(?=\d)/, '')
			.slice(0, MONEY_KEYS.includes(key) ? 12 : 4);
		setNumberText((prev) => ({ ...prev, [key]: digits }));
		setField(key, digits === '' ? (key === 'productSalePrice' ? undefined : 0) : Number(digits));
	};

	const uploadImagesHandler = async (e: ChangeEvent<HTMLInputElement>) => {
		try {
			const files = Array.from(e.target.files ?? []);
			if (!files.length) return;
			const room = MAX_PRODUCT_IMAGES - insertData.productImages.length;
			if (room <= 0) throw new Error(`${t('Maximum images')}: ${MAX_PRODUCT_IMAGES}`);
			setUploading(true);
			const paths = await uploadImages(files.slice(0, room), 'product');
			setField('productImages', [...insertData.productImages, ...paths]);
		} catch (err: any) {
			console.log('ERROR, uploadImagesHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	const removeImageHandler = (index: number) =>
		setField(
			'productImages',
			insertData.productImages.filter((_, i) => i !== index),
		);

	const validate = (): boolean => {
		const d = insertData;
		return Boolean(
			d.productTitle.trim() &&
			d.productAddress.trim() &&
			d.productColor.trim() &&
			d.productPrice > 0 &&
			d.productWidth > 0 &&
			d.productDepth > 0 &&
			d.productHeight > 0 &&
			d.productImages.length > 0,
		);
	};

	const saveProductHandler = async () => {
		try {
			if (!validate()) throw new Error(Message.INSERT_ALL_INPUTS);
			const input: ProductInput = {
				...insertData,
				productCondition: agent ? insertData.productCondition : ProductCondition.USED,
				productSalePrice: insertData.productSalePrice || undefined,
			};
			let savedId = productId;
			if (productId) {
				await updateProduct({ variables: { input: { ...input, _id: productId } } });
			} else {
				const result = await createProduct({ variables: { input } });
				savedId = result?.data?.createProduct?._id;
			}
			await sweetMixinSuccessAlert(t(productId ? 'Product updated' : 'Product listed') as string);
			await router.push({ pathname: '/product/detail', query: { id: savedId } });
		} catch (err: any) {
			console.log('ERROR, saveProductHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const select = (key: keyof ProductInput, label: string, options: string[], disabled = false) => (
		<TextField
			select
			label={t(label)}
			value={insertData[key] as string}
			onChange={(e) => setField(key, e.target.value as never)}
			disabled={disabled}
			fullWidth
		>
			{options.map((option) => (
				<MenuItem key={option} value={option}>
					{t(enumLabel(option))}
				</MenuItem>
			))}
		</TextField>
	);

	const number = (key: NumberKey, label: string) => {
		const digits = numberText[key];
		const money = MONEY_KEYS.includes(key);
		return (
			<TextField
				/* text, not number: no spinner arrows, no scroll-wheel edits, and it can be cleared */
				label={t(label)}
				value={money && focusedNumber !== key ? groupDigits(digits) : digits}
				onChange={(e) => setNumber(key, e.target.value)}
				onFocus={() => setFocusedNumber(key)}
				onBlur={() => setFocusedNumber(null)}
				fullWidth
				inputProps={{ inputMode: 'numeric', autoComplete: 'off' }}
			/>
		);
	};

	return (
		<Stack className={'my-section'}>
			<h2>{productId ? t('Edit product') : agent ? t('Add product') : t('Sell an item')}</h2>
			{!agent && <p className={'muted'}>{t('Members can sell used items only. Buyers nearby will see it.')}</p>}

			<Stack className={'product-form'}>
				<Stack className={'form-block'}>
					<strong>{t('Photos')}</strong>
					<Stack className={'image-list'}>
						{insertData.productImages.map((image, index) => (
							<div key={image} className={'image-item'}>
								<img src={imageUrl(image, DEFAULT_PRODUCT_IMAGE)} alt={''} />
								{index === 0 && <span className={'cover'}>{t('Cover')}</span>}
								<IconButton size={'small'} onClick={() => removeImageHandler(index)}>
									<CloseIcon fontSize={'inherit'} />
								</IconButton>
							</div>
						))}
						{insertData.productImages.length < MAX_PRODUCT_IMAGES && (
							<Button component={'label'} className={'image-add'} disabled={uploading}>
								<AddPhotoAlternateOutlinedIcon />
								<span>{uploading ? t('Uploading...') : t('Add photos')}</span>
								<input hidden multiple type={'file'} accept={validImageTypes} onChange={uploadImagesHandler} />
							</Button>
						)}
					</Stack>
				</Stack>

				<Stack className={'form-block'}>
					<TextField
						label={t('Title')}
						value={insertData.productTitle}
						onChange={(e) => setField('productTitle', e.target.value)}
						fullWidth
						inputProps={{ maxLength: 100 }}
					/>
					<Stack className={'form-grid'}>
						{select('productType', 'Category', productTypes)}
						{select('productRoom', 'Room', productRooms)}
						{select('productStyle', 'Style', productStyles)}
						{select('productMaterial', 'Material', productMaterials)}
						{select('productCondition', 'Condition', [ProductCondition.NEW, ProductCondition.USED], !agent)}
						<TextField
							label={t('Color')}
							value={insertData.productColor}
							onChange={(e) => setField('productColor', e.target.value)}
							fullWidth
						/>
					</Stack>
				</Stack>

				<Stack className={'form-block'}>
					<strong>{t('Size (cm)')}</strong>
					<Stack className={'form-grid three'}>
						{number('productWidth', 'Width')}
						{number('productDepth', 'Depth')}
						{number('productHeight', 'Height')}
					</Stack>
				</Stack>

				<Stack className={'form-block'}>
					<strong>{t('Price and delivery')}</strong>
					<Stack className={'form-grid three'}>
						{number('productPrice', 'Price (₩)')}
						{number('productSalePrice', 'Sale price (₩)')}
						{number('productDeliveryFee', 'Delivery fee (₩)')}
					</Stack>
					<FormControlLabel
						control={
							<Checkbox
								checked={Boolean(insertData.productAssembly)}
								onChange={(e) => setField('productAssembly', e.target.checked)}
							/>
						}
						label={t('Assembly required')}
					/>
				</Stack>

				<Stack className={'form-block'}>
					<strong>{t('Location')}</strong>
					<Stack className={'form-grid'}>
						{select('productLocation', 'City', productLocations)}
						<TextField
							label={t('Address / area')}
							value={insertData.productAddress}
							onChange={(e) => setField('productAddress', e.target.value)}
							fullWidth
						/>
					</Stack>
				</Stack>

				<TextField
					label={t('Description')}
					value={insertData.productDesc ?? ''}
					onChange={(e) => setField('productDesc', e.target.value)}
					multiline
					minRows={4}
					fullWidth
				/>

				<Stack className={'form-actions'}>
					<Button variant={'outlined'} onClick={() => router.back()}>
						{t('Cancel')}
					</Button>
					<Button variant={'contained'} onClick={saveProductHandler} disabled={creating || updating || uploading}>
						{productId ? t('Save changes') : t('List product')}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default AddProduct;
