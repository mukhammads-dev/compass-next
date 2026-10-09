import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { Avatar, CircularProgress } from '@mui/material';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { userVar } from '../../../apollo/store';
import { getJwtToken, isAdmin, logOut, updateUserInfo } from '../../auth';
import { DEFAULT_AVATAR, imageUrl } from '../../config';
import Logo from '../common/Logo';

const ADMIN_MENU = [
	{ href: '/_admin/users', label: 'Members', icon: <PeopleOutlineRoundedIcon /> },
	{ href: '/_admin/products', label: 'Products', icon: <Inventory2OutlinedIcon /> },
	{ href: '/_admin/orders', label: 'Orders', icon: <ReceiptLongOutlinedIcon /> },
	{ href: '/_admin/community', label: 'Community', icon: <ForumOutlinedIcon /> },
	{ href: '/_admin/cs', label: 'Notices', icon: <CampaignOutlinedIcon /> },
];

/**
 * Admin pages: a quiet side menu in the store's own colours, the page fills the rest.
 * Only ADMIN may see it. This is a UX guard; the real protection is @Roles(ADMIN) on the backend.
 */
const withAdminLayout = (Component: any) => {
	const LayoutAdmin = (props: any) => {
		const router = useRouter();
		const user = useReactiveVar(userVar);
		const [checking, setChecking] = useState<boolean>(true);
		const section = ADMIN_MENU.find((item) => router.pathname.startsWith(item.href));

		/** LIFECYCLES **/
		useEffect(() => {
			updateUserInfo(getJwtToken());
			setChecking(false);
		}, []);

		useEffect(() => {
			if (!checking && !isAdmin(user)) router.replace('/').then();
		}, [checking, user, router]);

		/** HANDLERS **/
		const logoutHandler = async () => {
			await logOut();
			await router.push('/');
		};

		if (checking || !isAdmin(user)) {
			return (
				<div className={'admin-loading'}>
					<CircularProgress color={'inherit'} />
				</div>
			);
		}

		return (
			<>
				<Head>
					<title>{section ? `${section.label} · Compass Admin` : 'Compass Admin'}</title>
				</Head>
				<div id={'admin-wrap'}>
					<aside className={'admin-menu'}>
						<div className={'admin-brand'}>
							<Logo href={'/_admin/users'} />
							<span>Admin</span>
						</div>

						<nav aria-label={'Admin'}>
							{ADMIN_MENU.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={section?.href === item.href ? 'active' : ''}
									aria-current={section?.href === item.href ? 'page' : undefined}
								>
									{item.icon}
									<span>{item.label}</span>
								</Link>
							))}
						</nav>

						<div className={'admin-foot'}>
							<Link href={'/'} className={'back-link'}>
								<StorefrontOutlinedIcon />
								<span>Back to the store</span>
							</Link>
							<div className={'admin-user'}>
								<Avatar src={imageUrl(user.memberImage, DEFAULT_AVATAR)} alt={user.memberNick} />
								<strong>{user.memberNick}</strong>
								<button type={'button'} onClick={logoutHandler} aria-label={'Log out'} title={'Log out'}>
									<LogoutRoundedIcon />
								</button>
							</div>
						</div>
					</aside>

					<main className={'admin-main'}>
						<Component {...props} />
					</main>
				</div>
			</>
		);
	};
	return LayoutAdmin;
};

export default withAdminLayout;
