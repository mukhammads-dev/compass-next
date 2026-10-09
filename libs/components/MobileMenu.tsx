import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Drawer } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { userVar } from '../../apollo/store';
import { isAdmin, logOut } from '../auth';
import { DEFAULT_AVATAR, imageUrl } from '../config';
import { MemberType } from '../enums/member.enum';
import Logo from './common/Logo';
import { LANGUAGES, NAV_LINKS } from './navigation';

interface MobileMenuProps {
	open: boolean;
	onClose: () => void;
}

/**
 * Phone menu: a sheet from the right with search, the main sections, the account and the language.
 * Everything the desktop header shows across one wide row lives here on a phone.
 */
const MobileMenu = ({ open, onClose }: MobileMenuProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [searchText, setSearchText] = useState<string>('');

	/** LIFECYCLES **/
	useEffect(() => {
		router.events.on('routeChangeStart', onClose);
		return () => router.events.off('routeChangeStart', onClose);
	}, [router.events, onClose]);

	/** HANDLERS **/
	const searchHandler = async (e: FormEvent) => {
		e.preventDefault();
		const text = searchText.trim();
		const input = { page: 1, limit: 12, sort: 'createdAt', direction: 'DESC', search: text ? { text } : {} };
		await router.push({ pathname: '/product', query: { input: JSON.stringify(input) } });
	};

	const languageHandler = async (locale: string) => {
		await router.push({ pathname: router.pathname, query: router.query }, router.asPath, { locale });
	};

	const logoutHandler = async () => {
		onClose();
		await logOut();
		await router.push('/');
	};

	return (
		<Drawer
			anchor={'right'}
			open={open}
			onClose={onClose}
			className={'m-menu'}
			PaperProps={{ className: 'm-menu-paper' }}
		>
			<div className={'m-menu-head'}>
				<Logo />
				<button type={'button'} className={'m-menu-close'} onClick={onClose} aria-label={t('Close') as string}>
					<CloseRoundedIcon />
				</button>
			</div>

			{user._id ? (
				<Link href={'/mypage'} className={'m-menu-me'}>
					<Avatar src={imageUrl(user.memberImage, DEFAULT_AVATAR)} alt={user.memberNick} />
					<span>
						<strong>{user.memberNick}</strong>
						<small>{t('My Page')}</small>
					</span>
					<ChevronRightRoundedIcon />
				</Link>
			) : (
				<div className={'m-menu-guest'}>
					<strong>{t('Welcome to Compass')}</strong>
					<p>{t('Log in to save pieces, keep a cart and follow your orders.')}</p>
					<Link href={'/account/join'} className={'btn-dark'}>
						{t('Login')}
					</Link>
				</div>
			)}

			<form className={'m-menu-search'} onSubmit={searchHandler}>
				<SearchIcon />
				<input
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					placeholder={t('Search sofas, lamps, rugs...') as string}
					enterKeyHint={'search'}
				/>
			</form>

			<nav className={'m-menu-links'}>
				{NAV_LINKS.map((link) => (
					<Link key={link.href} href={link.href} className={router.pathname.startsWith(link.href) ? 'active' : ''}>
						{t(link.label)}
						<ChevronRightRoundedIcon />
					</Link>
				))}
			</nav>

			<nav className={'m-menu-small'}>
				{user._id && <Link href={{ pathname: '/mypage', query: { category: 'myOrders' } }}>{t('My orders')}</Link>}
				{user._id && <Link href={{ pathname: '/mypage', query: { category: 'myFavorites' } }}>{t('Favorites')}</Link>}
				{user.memberType === MemberType.AGENT && (
					<Link href={{ pathname: '/mypage', query: { category: 'storeOrders' } }}>{t('Orders to fulfil')}</Link>
				)}
				<Link href={{ pathname: '/cs', query: { tab: 'NOTICE' } }}>{t('Notices')}</Link>
				<Link href={{ pathname: '/cs', query: { tab: 'FAQ' } }}>{t('FAQ')}</Link>
				{isAdmin(user) && <Link href={'/_admin/users'}>{t('Admin')}</Link>}
			</nav>

			<div className={'m-menu-foot'}>
				<div className={'m-menu-langs'} role={'group'} aria-label={t('Language') as string}>
					{LANGUAGES.map((lang) => (
						<button
							key={lang.locale}
							type={'button'}
							className={router.locale === lang.locale ? 'active' : ''}
							aria-pressed={router.locale === lang.locale}
							onClick={() => languageHandler(lang.locale)}
						>
							{lang.label}
						</button>
					))}
				</div>
				{user._id && (
					<button type={'button'} className={'m-menu-logout'} onClick={logoutHandler}>
						{t('Logout')}
					</button>
				)}
			</div>
		</Drawer>
	);
};

export default MobileMenu;
