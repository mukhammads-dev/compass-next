import { useRouter } from 'next/router';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, MenuItem, Select, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { productRooms, productStyles } from '../../config';
import { cleanObject, enumLabel } from '../../utils';
import { ProductsInquiry } from '../../types/product/product.input';
import { ProductRoom, ProductStyle } from '../../enums/product.enum';
import { Direction } from '../../enums/common.enum';

/** Width presets for "fits my space" (cm). */
const WIDTHS = [60, 90, 120, 160, 200, 240];

/** Search panel over the hero gallery: room + style + "fits my space" → /product?input=... */
const HeaderFilter = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [room, setRoom] = useState<ProductRoom | ''>('');
	const [style, setStyle] = useState<ProductStyle | ''>('');
	const [maxWidth, setMaxWidth] = useState<number | ''>('');

	/** HANDLERS **/
	const searchHandler = async () => {
		const input: ProductsInquiry = {
			page: 1,
			limit: 12,
			sort: 'productRank',
			direction: Direction.DESC,
			search: cleanObject({
				roomList: room ? [room] : undefined,
				styleList: style ? [style] : undefined,
				sizeFit: maxWidth ? { maxWidth } : undefined,
			}),
		};
		await router.push({ pathname: '/product', query: { input: JSON.stringify(input) } });
	};

	return (
		<Stack className={'header-filter'}>
			<Stack className={'filter-box'}>
				<span>{t('Room')}</span>
				<Select
					variant={'standard'}
					disableUnderline
					displayEmpty
					value={room}
					onChange={(e) => setRoom(e.target.value as ProductRoom | '')}
				>
					<MenuItem value={''}>{t('Any room')}</MenuItem>
					{productRooms.map((item) => (
						<MenuItem key={item} value={item}>
							{t(enumLabel(item))}
						</MenuItem>
					))}
				</Select>
			</Stack>
			<Stack className={'filter-box'}>
				<span>{t('Style')}</span>
				<Select
					variant={'standard'}
					disableUnderline
					displayEmpty
					value={style}
					onChange={(e) => setStyle(e.target.value as ProductStyle | '')}
				>
					<MenuItem value={''}>{t('Any style')}</MenuItem>
					{productStyles.map((item) => (
						<MenuItem key={item} value={item}>
							{t(enumLabel(item))}
						</MenuItem>
					))}
				</Select>
			</Stack>
			<Stack className={'filter-box'}>
				<span>{t('Fits my space')}</span>
				<Select
					variant={'standard'}
					disableUnderline
					displayEmpty
					value={maxWidth}
					onChange={(e) => setMaxWidth(e.target.value as number | '')}
				>
					<MenuItem value={''}>{t('Any width')}</MenuItem>
					{WIDTHS.map((width) => (
						<MenuItem key={width} value={width}>
							{t('Up to')} {width} cm
						</MenuItem>
					))}
				</Select>
			</Stack>
			<Button variant={'contained'} size={'large'} startIcon={<SearchIcon />} onClick={searchHandler}>
				{t('Search')}
			</Button>
		</Stack>
	);
};

export default HeaderFilter;
