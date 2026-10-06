import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import Logo from './common/Logo';
import { MemberType } from '../enums/member.enum';

const Footer = () => {
	const { t } = useTranslation('common');

	return (
		<Stack className={'footer-container'}>
			<Stack className={'container footer-top'}>
				<Stack className={'footer-brand'}>
					<Logo light />
					<p>{t('Shop straight from real homes. Check the fit before you buy.')}</p>
				</Stack>
				<Stack className={'footer-links'}>
					<div>
						<strong>{t('Explore')}</strong>
						<Link href={'/room-tour'}>{t('Room Tours')}</Link>
						<Link href={'/product'}>{t('Shop')}</Link>
						<Link href={'/store'}>{t('Stores')}</Link>
						<Link href={'/community'}>{t('Community')}</Link>
					</div>
					<div>
						<strong>{t('Support')}</strong>
						<Link href={{ pathname: '/cs', query: { tab: 'NOTICE' } }}>{t('Notices')}</Link>
						<Link href={{ pathname: '/cs', query: { tab: 'FAQ' } }}>{t('FAQ')}</Link>
						<Link href={{ pathname: '/cs', query: { tab: 'EVENT' } }}>{t('Events')}</Link>
					</div>
					<div>
						<strong>{t('Sell on Compass')}</strong>
						<Link href={{ pathname: '/account/join', query: { mode: 'signup', type: MemberType.AGENT } }}>
							{t('Open a store')}
						</Link>
						<Link href={{ pathname: '/mypage', query: { category: 'addProduct' } }}>{t('Sell used furniture')}</Link>
					</div>
				</Stack>
			</Stack>
			<Stack className={'container'}>
				<Stack className={'footer-bottom'}>
					<span>
						© {new Date().getFullYear()} Compass. {t('All rights reserved.')}
					</span>
					<span>Seoul · Busan · Online</span>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Footer;
