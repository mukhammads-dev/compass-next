import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, MouseEvent, useEffect, useState } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Badge, IconButton, Menu, MenuItem, Stack } from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import { userVar } from '../../apollo/store';
import { GET_MY_CART } from '../../apollo/user/query';
import { isAdmin, logOut } from '../auth';
import { DEFAULT_AVATAR, imageUrl } from '../config';
import Logo from './common/Logo';

const NAV_LINKS = [
	{ href: '/room-tour', label: 'Room Tours' },
	{ href: '/product', label: 'Shop' },
	{ href: '/store', label: 'Stores' },
	{ href: '/community', label: 'Community' },
];

/** Each language is labelled in its own language, so people find theirs even on a page they cannot read. */
const LANGUAGES = [
	{ locale: 'en', code: 'EN', label: 'English', flag: '/img/flag/en.svg' },
	{ locale: 'ko', code: 'KO', label: '한국어', flag: '/img/flag/ko.svg' },
	{ locale: 'uz', code: 'UZ', label: "O'zbekcha", flag: '/img/flag/uz.svg' },
];

const Top = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	/** the cart badge; mutations that change the cart refetch this query by name ("GetMyCart") */
	const { data: cartData } = useQuery(GET_MY_CART, { skip: !user._id, fetchPolicy: 'cache-and-network' });
	const cartCount: number = user._id ? (cartData?.getMyCart?.length ?? 0) : 0;
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
						<Link key={link.href} href={link.href} className={router.pathname.startsWith(link.href) ? 'active' : ''}>
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
						className={`lang-btn ${langAnchor ? 'open' : ''}`}
						aria-label={`${t('Language')}: ${currentLang.label}`}
						aria-haspopup={'menu'}
						aria-expanded={Boolean(langAnchor)}
						onClick={(e: MouseEvent<HTMLElement>) => setLangAnchor(e.currentTarget)}
					>
						<img src={currentLang.flag} alt={''} className={'flag'} />
						<ArrowDropDownRoundedIcon className={'caret'} />
					</button>
					<Menu
						anchorEl={langAnchor}
						open={Boolean(langAnchor)}
						onClose={() => setLangAnchor(null)}
						anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
						transformOrigin={{ vertical: 'top', horizontal: 'right' }}
						slotProps={{ paper: { className: 'lang-menu' } }}
					>
						{LANGUAGES.map((lang) => {
							const active = router.locale === lang.locale;
							return (
								<MenuItem key={lang.locale} selected={active} onClick={() => changeLanguageHandler(lang.locale)}>
									<img src={lang.flag} alt={''} className={'flag'} />
									<span className={'label'}>{lang.label}</span>
									<span className={'code'}>{active ? <CheckRoundedIcon fontSize={'small'} /> : lang.code}</span>
								</MenuItem>
							);
						})}
					</Menu>

					{user._id ? (
						<>
							<IconButton
								aria-label={'favorites'}
								onClick={() => router.push({ pathname: '/mypage', query: { category: 'myFavorites' } })}
							>
								<FavoriteBorderIcon fontSize={'small'} />
							</IconButton>
							<IconButton aria-label={t('Cart') as string} onClick={() => router.push('/cart')}>
								<Badge badgeContent={cartCount} className={'cart-badge'} max={99}>
									<ShoppingBagOutlinedIcon fontSize={'small'} />
								</Badge>
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
						<Link href={'/account/join'} className={'login-link'}>
							<LoginRoundedIcon />
							<span>{t('Login')}</span>
						</Link>
					)}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Top;
