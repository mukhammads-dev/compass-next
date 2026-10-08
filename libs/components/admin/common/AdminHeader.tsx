import { ReactNode } from 'react';

interface AdminHeaderProps {
	title: string;
	total?: number;
	/** e.g. "members", shown after the total */
	unit?: string;
	action?: ReactNode;
}

/** Page title with its total, and the page's main action on the right. */
const AdminHeader = ({ title, total, unit, action }: AdminHeaderProps) => (
	<header className={'admin-header'}>
		<div>
			<h1>{title}</h1>
			{total !== undefined && (
				<span>
					{total.toLocaleString()} {unit}
				</span>
			)}
		</div>
		{action}
	</header>
);

export default AdminHeader;
