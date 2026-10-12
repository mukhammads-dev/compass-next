import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Badge } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined';
import CenterFocusWeakRoundedIcon from '@mui/icons-material/CenterFocusWeakRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { userVar } from '../../apollo/store';

/** Pages where the tab bar would cover the page's own bottom action (pay, place order). */
const HIDDEN_ON = ['/checkout', '/checkout/reserve', '/account/join', '/lens'];

/**
 * Phone only: the five things people do most, one thumb away.
 * The photo search sits in the middle because it is what makes Compass different.
 */
const MobileTabBar = ({ cartCount }: { cartCount: number }) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const path = router.pathname;

	if (HIDDEN_ON.includes(path)) return null;

	const tabs = [
		{ href: '/', label: 'Home', icon: <HomeOutlinedIcon />, active: path === '/' },
		{ href: '/product', label: 'Shop', icon: <ChairOutlinedIcon />, active: path.startsWith('/product') },
		{ href: '/lens', label: 'AI search', icon: <CenterFocusWeakRoundedIcon />, active: path === '/lens', lens: true },
		{
			href: user._id ? '/cart' : '/account/join',
			label: 'Cart',
			icon: (
				<Badge badgeContent={cartCount} className={'cart-badge'} max={99}>
					<ShoppingBagOutlinedIcon />
				</Badge>
			),
			active: path === '/cart',
			hasItems: cartCount > 0,
		},
		{
			href: user._id ? '/mypage' : '/account/join',
			label: user._id ? 'Me' : 'Login',
			icon: <PersonOutlineRoundedIcon />,
			active: path.startsWith('/mypage'),
		},
	];

	return (
		<nav className={'m-tabbar'} aria-label={t('Main') as string}>
			{tabs.map((tab) => (
				<Link
					key={tab.label}
					href={tab.href}
					className={`${tab.active ? 'active' : ''} ${tab.lens ? 'lens' : ''} ${'hasItems' in tab && tab.hasItems ? 'has-items' : ''}`}
					aria-current={tab.active ? 'page' : undefined}
				>
					<span className={'icon'}>{tab.icon}</span>
					<span className={'label'}>{t(tab.label)}</span>
				</Link>
			))}
		</nav>
	);
};

export default MobileTabBar;
