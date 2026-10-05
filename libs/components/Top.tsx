import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, MouseEvent, useEffect, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Button, IconButton, Menu, MenuItem, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { userVar } from '../../apollo/store';
import { isAdmin, logOut } from '../auth';
import { DEFAULT_AVATAR, imageUrl } from '../config';
import Logo from './common/Logo';

const NAV_LINKS = [
	{ href: '/room-tour', label: 'Room Tours' },
	{ href: '/product', label: 'Shop' },
	{ href: '/store', label: 'Stores' },
	{ href: '/community', label: 'Community' },
];

const LANGUAGES = [
	{ locale: 'en', code: 'EN', label: 'English' },
	{ locale: 'ko', code: 'KO', label: '한국어' },
	{ locale: 'uz', code: 'UZ', label: "O'zbek" },
];

const Top = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [searchText, setSearchText] = useState<string>('');
	const [scrolled, setScrolled] = useState<boolean>(false);
	const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
	const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
	const currentLang = LANGUAGES.find((lang) => lang.locale === router.locale) ?? LANGUAGES[0];

	/** LIFECYCLES **/
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	/** HANDLERS **/
	const searchHandler = async (e: FormEvent) => {
		e.preventDefault();
		const text = searchText.trim();
		const input = { page: 1, limit: 12, sort: 'createdAt', direction: 'DESC', search: text ? { text } : {} };
		await router.push({ pathname: '/product', query: { input: JSON.stringify(input) } });
	};

	const changeLanguageHandler = async (locale: string) => {
		setLangAnchor(null);
		await router.push({ pathname: router.pathname, query: router.query }, router.asPath, { locale });
	};

	const userMenuHandler = async (path: string) => {
		setUserAnchor(null);
		await router.push(path);
	};

	const logoutHandler = async () => {
		setUserAnchor(null);
		await logOut();
		await router.push('/');
	};

	return (
		<Stack className={`navbar ${scrolled ? 'scrolled' : ''}`}>
			<Stack className={'container'}>
				<Logo />

				<nav className={'nav-links'}>
					{NAV_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={router.pathname.startsWith(link.href) ? 'active' : ''}
						>
							{t(link.label)}
						</Link>
					))}
				</nav>

				<form className={'search-box'} onSubmit={searchHandler}>
					<SearchIcon fontSize={'small'} />
					<input
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						placeholder={t('Search sofas, lamps, rugs...') as string}
					/>
				</form>

				<Stack className={'actions'}>
					<button
						className={'lang-btn'}
						aria-label={'language'}
						onClick={(e: MouseEvent<HTMLElement>) => setLangAnchor(e.currentTarget)}
					>
						{currentLang.code}
						<KeyboardArrowDownIcon fontSize={'inherit'} />
					</button>
					<Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={() => setLangAnchor(null)}>
						{LANGUAGES.map((lang) => (
							<MenuItem
								key={lang.locale}
								selected={router.locale === lang.locale}
								onClick={() => changeLanguageHandler(lang.locale)}
							>
								{lang.label}
							</MenuItem>
						))}
					</Menu>

					{user._id ? (
						<>
							<IconButton
								aria-label={'favorites'}
								onClick={() => router.push({ pathname: '/mypage', query: { category: 'myFavorites' } })}
							>
								<FavoriteBorderIcon fontSize={'small'} />
							</IconButton>
							<IconButton
								aria-label={'notifications'}
								onClick={() => router.push({ pathname: '/mypage', query: { category: 'notifications' } })}
							>
								<NotificationsNoneIcon fontSize={'small'} />
							</IconButton>
							<IconButton
								className={'avatar-btn'}
								onClick={(e: MouseEvent<HTMLElement>) => setUserAnchor(e.currentTarget)}
							>
								<Avatar src={imageUrl(user.memberImage, DEFAULT_AVATAR)} alt={user.memberNick} />
							</IconButton>
							<Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>
								<MenuItem disabled className={'menu-nick'}>
									@{user.memberNick}
								</MenuItem>
								<MenuItem onClick={() => userMenuHandler('/mypage')}>{t('My Page')}</MenuItem>
								{isAdmin(user) && <MenuItem onClick={() => userMenuHandler('/_admin/users')}>{t('Admin')}</MenuItem>}
								<MenuItem onClick={logoutHandler}>{t('Logout')}</MenuItem>
							</Menu>
						</>
					) : (
						<Button variant={'contained'} onClick={() => router.push('/account/join')}>
							{t('Login')}
						</Button>
					)}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Top;
