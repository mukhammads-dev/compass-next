import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

interface NoDataProps {
	text?: string;
}

const NoData = ({ text = 'Nothing here yet' }: NoDataProps) => {
	const { t } = useTranslation('common');
	return (
		<Stack className={'no-data'}>
			<SearchOffIcon />
			<p>{t(text)}</p>
		</Stack>
	);
};

export default NoData;
