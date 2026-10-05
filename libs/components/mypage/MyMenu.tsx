import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Stack } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { isAgent } from '../../auth';
import { DEFAULT_AVATAR, imageUrl } from '../../config';

export type MyCategory =
	| 'myProfile'
	| 'myListings'
	| 'addProduct'
	| 'myArticles'
	| 'writeArticle'
	| 'myRooms'
	| 'myFavorites'
	| 'recentlyVisited'
	| 'followers'
	| 'followings'
	| 'notifications';

interface MyMenuProps {
	category: MyCategory;
}

const MyMenu = ({ category }: MyMenuProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const agent = isAgent(user);

	const groups: { title: string; items: { id: MyCategory; label: string }[] }[] = [
		{
			title: agent ? 'My store' : 'Selling',
			items: [
				{ id: 'myListings', label: agent ? 'My products' : 'My used listings' },
				{ id: 'addProduct', label: agent ? 'Add product' : 'Sell an item' },
			],
		},
		{
			title: 'Community',
			items: [
				{ id: 'myArticles', label: 'My posts' },
				{ id: 'writeArticle', label: 'Write' },
			],
		},
		{
			title: 'Shopping',
			items: [
				{ id: 'myRooms', label: 'My rooms' },
				{ id: 'myFavorites', label: 'Favorites' },
				{ id: 'recentlyVisited', label: 'Recently viewed' },
			],
		},
		{
			title: 'Account',
			items: [
				{ id: 'myProfile', label: 'Profile' },
				{ id: 'notifications', label: 'Notifications' },
				{ id: 'followers', label: 'Followers' },
				{ id: 'followings', label: 'Following' },
			],
		},
	];

	return (
		<Stack className={'my-menu'}>
			<Link href={{ pathname: '/member', query: { memberId: user._id } }} className={'my-card'}>
				<Avatar src={imageUrl(user.memberImage, DEFAULT_AVATAR)} sx={{ width: 56, height: 56 }} />
				<Stack>
					<strong>{user.memberNick}</strong>
					<span>{agent ? t('Store') : t('Member')}</span>
				</Stack>
			</Link>
			{groups.map((group) => (
				<Stack key={group.title} className={'menu-group'}>
					<span className={'group-title'}>{t(group.title)}</span>
					{group.items.map((item) => (
						<Link
							key={item.id}
							href={{ pathname: '/mypage', query: { category: item.id } }}
							className={category === item.id ? 'active' : ''}
						>
							{t(item.label)}
						</Link>
					))}
				</Stack>
			))}
		</Stack>
	);
};

export default MyMenu;
