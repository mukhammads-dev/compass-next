import { useEffect, useState } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Button, MenuItem, Select, Stack, TextField } from '@mui/material';
import StraightenIcon from '@mui/icons-material/Straighten';
import { userVar } from '../../../apollo/store';
import { GET_MY_ROOMS } from '../../../apollo/user/query';
import { PISearch, ProductsInquiry, SizeFit } from '../../types/product/product.input';
import { MyRoom } from '../../types/my-room/my-room';
import {
	productConditions,
	productLocations,
	productMaterials,
	productRooms,
	productStyles,
	productTypes,
} from '../../config';
import { cleanObject, enumLabel } from '../../utils';
import { T } from '../../types/common';

interface FilterProps {
	searchFilter: ProductsInquiry;
	onChange: (next: ProductsInquiry) => void;
}

type ListKey = 'typeList' | 'roomList' | 'styleList' | 'materialList' | 'conditionList' | 'locationList';

const GROUPS: { key: ListKey; title: string; options: string[] }[] = [
	{ key: 'conditionList', title: 'Condition', options: productConditions },
	{ key: 'typeList', title: 'Category', options: productTypes },
	{ key: 'roomList', title: 'Room', options: productRooms },
	{ key: 'styleList', title: 'Style', options: productStyles },
	{ key: 'materialList', title: 'Material', options: productMaterials },
	{ key: 'locationList', title: 'Location', options: productLocations },
];

const toNumber = (value: string): number | undefined => {
	const parsed = parseInt(value, 10);
	return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
};

/** Changes only the inquiry; the page refetches when the inquiry changes. */
const Filter = (props: FilterProps) => {
	const { searchFilter, onChange } = props;
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const search: PISearch = searchFilter.search ?? {};
	const [text, setText] = useState<string>(search.text ?? '');
	const [price, setPrice] = useState<{ start: string; end: string }>({
		start: search.pricesRange?.start ? String(search.pricesRange.start) : '',
		end: search.pricesRange?.end ? String(search.pricesRange.end) : '',
	});
	const [size, setSize] = useState<{ maxWidth: string; maxDepth: string; maxHeight: string }>({
		maxWidth: search.sizeFit?.maxWidth ? String(search.sizeFit.maxWidth) : '',
		maxDepth: search.sizeFit?.maxDepth ? String(search.sizeFit.maxDepth) : '',
		maxHeight: search.sizeFit?.maxHeight ? String(search.sizeFit.maxHeight) : '',
	});
	const [myRooms, setMyRooms] = useState<MyRoom[]>([]);

	/** APOLLO REQUESTS **/
	const { data: queryResult } = useQuery(GET_MY_ROOMS, {
		skip: !user._id,
		fetchPolicy: 'cache-and-network',
	});
	/* read the result on every change, cache hits included (onCompleted skips those) */
	useEffect(() => {
		const data: T = queryResult;
		if (!data) return;
		setMyRooms(data?.getMyRooms ?? []);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryResult]);

	/** LIFECYCLES **/
	useEffect(() => {
		setText(search.text ?? '');
	}, [search.text]);

	/** HANDLERS **/
	const applySearch = (nextSearch: PISearch) => {
		onChange({ ...searchFilter, page: 1, search: cleanObject(nextSearch) });
	};

	const toggleOptionHandler = (key: ListKey, value: string) => {
		const current: string[] = (search[key] as string[] | undefined) ?? [];
		const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
		applySearch({ ...search, [key]: next });
	};

	const applyTextHandler = () => applySearch({ ...search, text: text.trim() || undefined });

	const applyPriceHandler = () => {
		const start = toNumber(price.start) ?? 0;
		const end = toNumber(price.end);
		applySearch({ ...search, pricesRange: end ? { start, end } : undefined });
	};

	const applySizeHandler = (next = size) => {
		const sizeFit: SizeFit = cleanObject({
			maxWidth: toNumber(next.maxWidth),
			maxDepth: toNumber(next.maxDepth),
			maxHeight: toNumber(next.maxHeight),
		});
		applySearch({ ...search, sizeFit: Object.keys(sizeFit).length ? sizeFit : undefined });
	};

	const applyMyRoomHandler = (roomId: string) => {
		const room = myRooms.find((item) => item._id === roomId);
		if (!room) return;
		const next = {
			maxWidth: String(room.myRoomWidth),
			maxDepth: String(room.myRoomDepth),
			maxHeight: room.myRoomHeight ? String(room.myRoomHeight) : '',
		};
		setSize(next);
		applySizeHandler(next);
	};

	const resetHandler = () => {
		setText('');
		setPrice({ start: '', end: '' });
		setSize({ maxWidth: '', maxDepth: '', maxHeight: '' });
		onChange({ ...searchFilter, page: 1, search: {} });
	};

	return (
		<Stack className={'filter-config'}>
			<Stack className={'filter-block'}>
				<TextField
					size={'small'}
					fullWidth
					value={text}
					placeholder={t('Search products') as string}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && applyTextHandler()}
					onBlur={applyTextHandler}
				/>
			</Stack>

			<Stack className={'filter-block fit-block'}>
				<strong>
					<StraightenIcon fontSize={'small'} /> {t('Fits my space')}
				</strong>
				<span className={'hint'}>{t('Only show products smaller than (cm)')}</span>
				{myRooms.length > 0 && (
					<Select size={'small'} displayEmpty value={''} onChange={(e) => applyMyRoomHandler(e.target.value as string)}>
						<MenuItem value={''} disabled>
							{t('Use one of my rooms')}
						</MenuItem>
						{myRooms.map((room) => (
							<MenuItem key={room._id} value={room._id}>
								{room.myRoomName} ({room.myRoomWidth}×{room.myRoomDepth})
							</MenuItem>
						))}
					</Select>
				)}
				<Stack className={'size-inputs'}>
					{(['maxWidth', 'maxDepth', 'maxHeight'] as const).map((key) => (
						<TextField
							key={key}
							size={'small'}
							type={'number'}
							label={t(key === 'maxWidth' ? 'Width' : key === 'maxDepth' ? 'Depth' : 'Height')}
							value={size[key]}
							onChange={(e) => setSize({ ...size, [key]: e.target.value })}
							onBlur={() => applySizeHandler()}
						/>
					))}
				</Stack>
			</Stack>

			<Stack className={'filter-block'}>
				<strong>{t('Deals')}</strong>
				<Stack className={'chip-list'}>
					<button
						className={`chip ${search.onSale ? 'active' : ''}`}
						onClick={() => applySearch({ ...search, onSale: search.onSale ? undefined : true })}
					>
						{t('On sale')}
					</button>
				</Stack>
			</Stack>

			{GROUPS.map((group) => (
				<Stack key={group.key} className={'filter-block'}>
					<strong>{t(group.title)}</strong>
					<Stack className={'chip-list'}>
						{group.options.map((option) => {
							const active = ((search[group.key] as string[] | undefined) ?? []).includes(option);
							return (
								<button
									key={option}
									className={`chip ${active ? 'active' : ''}`}
									onClick={() => toggleOptionHandler(group.key, option)}
								>
									{t(enumLabel(option))}
								</button>
							);
						})}
					</Stack>
				</Stack>
			))}

			<Stack className={'filter-block'}>
				<strong>{t('Price')} (₩)</strong>
				<Stack className={'price-inputs'}>
					<TextField
						size={'small'}
						type={'number'}
						placeholder={t('Min') as string}
						value={price.start}
						onChange={(e) => setPrice({ ...price, start: e.target.value })}
						onBlur={applyPriceHandler}
					/>
					<span>~</span>
					<TextField
						size={'small'}
						type={'number'}
						placeholder={t('Max') as string}
						value={price.end}
						onChange={(e) => setPrice({ ...price, end: e.target.value })}
						onBlur={applyPriceHandler}
					/>
				</Stack>
			</Stack>

			<Button variant={'text'} onClick={resetHandler}>
				{t('Reset filters')}
			</Button>
		</Stack>
	);
};

export default Filter;
