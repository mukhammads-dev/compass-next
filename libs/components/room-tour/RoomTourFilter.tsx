import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Stack, TextField } from '@mui/material';
import { BAISearch, BoardArticlesInquiry } from '../../types/board-article/board-article.input';
import { homeTypes, productStyles } from '../../config';
import { cleanObject, enumLabel } from '../../utils';

interface RoomTourFilterProps {
	searchFilter: BoardArticlesInquiry;
	onChange: (next: BoardArticlesInquiry) => void;
}

/** Home size presets in ㎡ (Korean listings use ㎡ / pyeong). */
const SIZE_RANGES = [
	{ label: '~ 20㎡', start: 0, end: 20 },
	{ label: '20 ~ 40㎡', start: 20, end: 40 },
	{ label: '40 ~ 85㎡', start: 40, end: 85 },
	{ label: '85㎡ ~', start: 85, end: 1000 },
];

const RoomTourFilter = (props: RoomTourFilterProps) => {
	const { searchFilter, onChange } = props;
	const { t } = useTranslation('common');
	const search: BAISearch = searchFilter.search ?? {};
	const [text, setText] = useState<string>(search.text ?? '');

	/** HANDLERS **/
	const applySearch = (next: BAISearch) => onChange({ ...searchFilter, page: 1, search: cleanObject(next) });

	const toggleHandler = (key: 'homeTypeList' | 'styleList', value: string) => {
		const current: string[] = (search[key] as string[] | undefined) ?? [];
		const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
		applySearch({ ...search, [key]: next });
	};

	const sizeHandler = (start: number, end: number) => {
		const active = search.homeSizeRange?.start === start && search.homeSizeRange?.end === end;
		applySearch({ ...search, homeSizeRange: active ? undefined : { start, end } });
	};

	return (
		<Stack className={'room-tour-filter'}>
			<TextField
				size={'small'}
				value={text}
				placeholder={t('Search Room Tours') as string}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={(e) => e.key === 'Enter' && applySearch({ ...search, text: text.trim() || undefined })}
			/>
			<Stack className={'chip-list'}>
				{homeTypes.map((type) => (
					<button
						key={type}
						className={`chip ${search.homeTypeList?.includes(type) ? 'active' : ''}`}
						onClick={() => toggleHandler('homeTypeList', type)}
					>
						{t(enumLabel(type))}
					</button>
				))}
			</Stack>
			<Stack className={'chip-list'}>
				{SIZE_RANGES.map((range) => (
					<button
						key={range.label}
						className={`chip ${
							search.homeSizeRange?.start === range.start && search.homeSizeRange?.end === range.end ? 'active' : ''
						}`}
						onClick={() => sizeHandler(range.start, range.end)}
					>
						{range.label}
					</button>
				))}
			</Stack>
			<Stack className={'chip-list'}>
				{productStyles.map((style) => (
					<button
						key={style}
						className={`chip ${search.styleList?.includes(style) ? 'active' : ''}`}
						onClick={() => toggleHandler('styleList', style)}
					>
						{t(enumLabel(style))}
					</button>
				))}
			</Stack>
		</Stack>
	);
};

export default RoomTourFilter;
