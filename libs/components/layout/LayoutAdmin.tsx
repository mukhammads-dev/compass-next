import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { Avatar, Button, CircularProgress, Stack } from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import { userVar } from '../../../apollo/store';
import { getJwtToken, isAdmin, logOut, updateUserInfo } from '../../auth';
import { DEFAULT_AVATAR, imageUrl } from '../../config';
import Logo from '../common/Logo';

const ADMIN_MENU = [
	{ href: '/_admin/users', label: 'Members', icon: <PeopleOutlineIcon fontSize={'small'} /> },
	{ href: '/_admin/products', label: 'Products', icon: <Inventory2OutlinedIcon fontSize={'small'} /> },
	{ href: '/_admin/community', label: 'Community', icon: <ForumOutlinedIcon fontSize={'small'} /> },
	{ href: '/_admin/cs', label: 'Notices', icon: <CampaignOutlinedIcon fontSize={'small'} /> },
];

/**
 * Admin pages: side menu + app bar. Only ADMIN may see it.
 * This is a UX guard; the real protection is @Roles(ADMIN) on the backend.
 */
const withAdminLayout = (Component: any) => {
	const LayoutAdmin = (props: any) => {
		const router = useRouter();
		const user = useReactiveVar(userVar);
		const [checking, setChecking] = useState<boolean>(true);

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
				<Stack className={'admin-loading'}>
					<CircularProgress />
				</Stack>
			);
		}

		return (
			<>
				<Head>
					<title>Compass Admin</title>
				</Head>
				<Stack id={'admin-wrap'}>
					<aside className={'admin-menu'}>
						<Logo light />
						<span className={'admin-badge'}>ADMIN</span>
						<nav>
							{ADMIN_MENU.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={router.pathname.startsWith(item.href) ? 'active' : ''}
								>
									{item.icon}
									{item.label}
								</Link>
							))}
						</nav>
					</aside>

					<Stack className={'admin-body'}>
						<Stack className={'admin-appbar'}>
							<strong>{ADMIN_MENU.find((item) => router.pathname.startsWith(item.href))?.label ?? 'Admin'}</strong>
							<Stack className={'admin-user'}>
								<Avatar src={imageUrl(user.memberImage, DEFAULT_AVATAR)} sx={{ width: 32, height: 32 }} />
								<span>{user.memberNick}</span>
								<Button size={'small'} variant={'outlined'} onClick={logoutHandler}>
									Logout
								</Button>
							</Stack>
						</Stack>
						<Stack className={'admin-content'}>
							<Component {...props} />
						</Stack>
					</Stack>
				</Stack>
			</>
		);
	};
	return LayoutAdmin;
};

export default withAdminLayout;
