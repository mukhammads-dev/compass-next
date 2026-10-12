import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, IconButton, Menu, MenuItem, Stack } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
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
import MobileMenu from './MobileMenu';
import MobileTabBar from './MobileTabBar';
import { LANGUAGES, NAV_LINKS } from './navigation';

const Top = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	/** the cart badge; mutations that change the cart refetch this query by name ("GetMyCart") */
	const { data: cartData } = useQuery(GET_MY_CART, { skip: !user._id, fetchPolicy: 'cache-and-network' });
	const cartCount: number = user._id ? (cartData?.getMyCart?.length ?? 0) : 0;
	/* the bag lights up while it holds something, and gives a little bump each time a piece goes in */
	const [cartBump, setCartBump] = useState<boolean>(false);
	const lastCount = useRef<number>(cartCount);
	useEffect(() => {
		if (cartCount > lastCount.current) {
			setCartBump(true);
			const timer = window.setTimeout(() => setCartBump(false), 700);
			lastCount.current = cartCount;
			return () => window.clearTimeout(timer);
		}
		lastCount.current = cartCount;
	}, [cartCount]);
	const [searchText, setSearchText] = useState<string>('');
	const [scrolled, setScrolled] = useState<boolean>(false);
	const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
	const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
	const [menuOpen, setMenuOpen] = useState<boolean>(false);
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
		<>
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
									<FavoriteBorderIcon />
								</IconButton>
								<button
									type={'button'}
									className={`cart-lamp ${cartCount > 0 ? 'lit' : ''} ${cartBump ? 'bump' : ''}`}
									aria-label={`${t('Cart')}${cartCount ? ` (${cartCount})` : ''}`}
									onClick={() => router.push('/cart')}
								>
									<ShoppingBagOutlinedIcon />
									{cartCount > 0 && <span className={'cart-count'}>{cartCount > 99 ? '99+' : cartCount}</span>}
								</button>
								<IconButton
									aria-label={'notifications'}
									onClick={() => router.push({ pathname: '/mypage', query: { category: 'notifications' } })}
								>
									<NotificationsNoneIcon />
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

						{user._id && (
							<IconButton
								className={'m-only'}
								aria-label={'notifications'}
								onClick={() => router.push({ pathname: '/mypage', query: { category: 'notifications' } })}
							>
								<NotificationsNoneIcon />
							</IconButton>
						)}
						<IconButton
							className={'m-only menu-btn'}
							aria-label={t('Menu') as string}
							aria-expanded={menuOpen}
							onClick={() => setMenuOpen(true)}
						>
							<MenuRoundedIcon />
						</IconButton>
					</Stack>
				</Stack>
			</Stack>
			<MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
			<MobileTabBar cartCount={cartCount} />
		</>
	);
};

export default Top;
