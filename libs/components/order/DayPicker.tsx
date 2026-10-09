import { useRouter } from 'next/router';

interface DayPickerProps {
	label: string;
	days: Date[];
	value: string | null;
	onChange: (iso: string) => void;
}

const LOCALES: Record<string, string> = { en: 'en-US', ko: 'ko-KR', uz: 'uz-UZ' };

/** A row of day chips (weekday over date). The chosen day is passed back as the ISO string of that day. */
const DayPicker = ({ label, days, value, onChange }: DayPickerProps) => {
	const { locale = 'en' } = useRouter();
	const lang = LOCALES[locale] ?? 'en-US';
	const weekday = new Intl.DateTimeFormat(lang, { timeZone: 'Asia/Seoul', weekday: 'short' });
	const date = new Intl.DateTimeFormat(lang, { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric' });

	return (
		<div className={'day-picker'} role={'radiogroup'} aria-label={label}>
			{days.map((day) => {
				const iso = day.toISOString();
				return (
					<button
						key={iso}
						type={'button'}
						role={'radio'}
						aria-checked={value === iso}
						className={value === iso ? 'active' : ''}
						onClick={() => onChange(iso)}
					>
						<small>{weekday.format(day)}</small>
						<strong>{date.format(day)}</strong>
					</button>
				);
			})}
		</div>
	);
};

export default DayPicker;
