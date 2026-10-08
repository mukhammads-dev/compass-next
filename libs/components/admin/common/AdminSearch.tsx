import { FormEvent, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

interface AdminSearchProps {
	placeholder: string;
	onSearch: (text: string | undefined) => void;
}

/** Searches on Enter; the clear button resets the list. */
const AdminSearch = ({ placeholder, onSearch }: AdminSearchProps) => {
	const [text, setText] = useState<string>('');

	const submitHandler = (e: FormEvent) => {
		e.preventDefault();
		onSearch(text.trim() || undefined);
	};

	return (
		<form className={'admin-search'} onSubmit={submitHandler} role={'search'}>
			<SearchRoundedIcon />
			<input
				value={text}
				placeholder={placeholder}
				aria-label={placeholder}
				onChange={(e) => setText(e.target.value)}
			/>
			{text && (
				<button
					type={'button'}
					aria-label={'Clear search'}
					onClick={() => {
						setText('');
						onSearch(undefined);
					}}
				>
					<CloseRoundedIcon />
				</button>
			)}
		</form>
	);
};

export default AdminSearch;
