import { NextPage } from 'next';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Button, Stack } from '@mui/material';
import withLayoutFull from '../libs/components/layout/LayoutFull';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});

const NotFound: NextPage = () => {
	const { t } = useTranslation('common');
	return (
		<Stack id={'not-found-page'}>
			<strong>404</strong>
			<p>{t('This page moved out.')}</p>
			<Link href={'/'}>
				<Button variant={'contained'}>{t('Back home')}</Button>
			</Link>
		</Stack>
	);
};

export default withLayoutFull(NotFound);
