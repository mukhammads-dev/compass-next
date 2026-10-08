import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

interface AdminPagerProps {
	page: number;
	limit: number;
	total: number;
	onPage: (page: number) => void;
}

/** "21–40 of 54" with previous / next. Hidden when everything fits on one page. */
const AdminPager = ({ page, limit, total, onPage }: AdminPagerProps) => {
	const pages = Math.max(1, Math.ceil(total / limit));
	if (pages <= 1) return null;
	const from = (page - 1) * limit + 1;
	const to = Math.min(page * limit, total);

	return (
		<nav className={'admin-pager'} aria-label={'Pages'}>
			<span>
				{from}–{to} of {total.toLocaleString()}
			</span>
			<button type={'button'} aria-label={'Previous page'} disabled={page <= 1} onClick={() => onPage(page - 1)}>
				<ChevronLeftRoundedIcon />
			</button>
			<button type={'button'} aria-label={'Next page'} disabled={page >= pages} onClick={() => onPage(page + 1)}>
				<ChevronRightRoundedIcon />
			</button>
		</nav>
	);
};

export default AdminPager;
