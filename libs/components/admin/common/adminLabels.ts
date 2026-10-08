import { enumLabel } from '../../../utils';

/** Words an admin reads in lists: "Blocked" rather than BLOCK. */
const LABELS: Record<string, string> = {
	BLOCK: 'Blocked',
	DELETE: 'Deleted',
	HOLD: 'On hold',
	QNA: 'Q&A',
	FAQ: 'FAQ',
};

export const adminLabel = (value: string | undefined): string => (value ? (LABELS[value] ?? enumLabel(value)) : '');

/** Colour of the dot next to a status: fine / needs attention / gone. */
export const statusTone = (value: string): 'ok' | 'warn' | 'bad' | 'muted' => {
	if (value === 'ACTIVE') return 'ok';
	if (value === 'BLOCK' || value === 'HOLD') return 'warn';
	if (value === 'DELETE') return 'bad';
	return 'muted';
};
