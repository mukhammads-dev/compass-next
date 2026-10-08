import { MenuItem, Select } from '@mui/material';
import { adminLabel, statusTone } from './adminLabels';

interface StatusSelectProps<V extends string> {
	value: V;
	options: V[];
	onChange: (value: V) => void;
	disabled?: boolean;
	/** status values get a coloured dot; plain values (member type) do not */
	dot?: boolean;
	label: string;
}

/** Inline editor for a row's status or type, styled as a quiet pill. */
const StatusSelect = <V extends string>({
	value,
	options,
	onChange,
	disabled,
	dot = true,
	label,
}: StatusSelectProps<V>) => {
	const render = (option: string) => (
		<span className={'status-value'}>
			{dot && <i className={`dot ${statusTone(option)}`} />}
			{adminLabel(option)}
		</span>
	);

	return (
		<Select
			variant={'standard'}
			disableUnderline
			className={'status-select'}
			value={value}
			disabled={disabled}
			inputProps={{ 'aria-label': label }}
			renderValue={(selected) => render(selected)}
			onChange={(e) => e.target.value !== value && onChange(e.target.value as V)}
			MenuProps={{ classes: { paper: 'status-menu' } }}
		>
			{options.map((option) => (
				<MenuItem key={option} value={option}>
					{render(option)}
				</MenuItem>
			))}
		</Select>
	);
};

export default StatusSelect;
