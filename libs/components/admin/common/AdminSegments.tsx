import { adminLabel } from './adminLabels';

interface AdminSegmentsProps {
	/** accessible name of the group, e.g. "Status" */
	label: string;
	options: string[];
	/** undefined means "All" */
	value?: string;
	allLabel?: string;
	onChange: (value: string | undefined) => void;
}

/** One-tap filter: All + every option, the chosen one filled. */
const AdminSegments = ({ label, options, value, allLabel = 'All', onChange }: AdminSegmentsProps) => (
	<div className={'admin-segments'} role={'group'} aria-label={label}>
		{[undefined, ...options].map((option) => (
			<button
				key={option ?? 'all'}
				type={'button'}
				className={option === value ? 'active' : ''}
				aria-pressed={option === value}
				onClick={() => onChange(option)}
			>
				{option ? adminLabel(option) : allLabel}
			</button>
		))}
	</div>
);

export default AdminSegments;
