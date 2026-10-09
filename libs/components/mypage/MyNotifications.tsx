import { useRouter } from 'next/router';
import { ChangeEvent, useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Button, Pagination, Stack, Tab, Tabs } from '@mui/material';
import { GET_NOTIFICATIONS } from '../../../apollo/user/query';
import { READ_ALL_NOTIFICATIONS, READ_NOTIFICATION } from '../../../apollo/user/mutation';
import { Notification, NotificationsInquiry } from '../../types/notification/notification';
import { NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { DEFAULT_AVATAR, imageUrl } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import NoData from '../common/NoData';
import { T } from '../../types/common';

const TYPE_LABEL: Record<NotificationType, string> = {
	[NotificationType.LIKE]: 'liked',
	[NotificationType.COMMENT]: 'commented',
	[NotificationType.FOLLOW]: 'followed you',
	[NotificationType.TAG]: 'tagged your product',
	[NotificationType.ORDER]: 'order update',
};

const MyNotifications = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [notificationInquiry, setNotificationInquiry] = useState<NotificationsInquiry>({
		page: 1,
		limit: 10,
		search: { notificationStatus: NotificationStatus.WAIT },
	});
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [readNotification] = useMutation(READ_NOTIFICATION);
	const [readAllNotifications] = useMutation(READ_ALL_NOTIFICATIONS);

	const { refetch: getNotificationsRefetch } = useQuery(GET_NOTIFICATIONS, {
		fetchPolicy: 'network-only',
		variables: { input: notificationInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setNotifications(data?.getNotifications?.list ?? []);
			setTotal(data?.getNotifications?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const reload = async () => {
		const { data } = await getNotificationsRefetch({ input: notificationInquiry });
		setNotifications(data?.getNotifications?.list ?? []);
		setTotal(data?.getNotifications?.metaCounter?.[0]?.total ?? 0);
	};

	const openNotificationHandler = async (notification: Notification) => {
		try {
			if (notification.notificationStatus === NotificationStatus.WAIT) {
				await readNotification({ variables: { input: notification._id } });
			}
			if (notification.orderId) {
				await router.push({ pathname: '/order', query: { id: notification.orderId } });
			} else if (notification.productId) {
				await router.push({ pathname: '/product/detail', query: { id: notification.productId } });
			} else if (notification.articleId) {
				await router.push({ pathname: '/community/detail', query: { id: notification.articleId } });
			} else {
				await router.push({ pathname: '/member', query: { memberId: notification.authorId } });
			}
		} catch (err: any) {
			console.log('ERROR, openNotificationHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const readAllHandler = async () => {
		try {
			await readAllNotifications();
			await reload();
		} catch (err: any) {
			console.log('ERROR, readAllHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack className={'my-section'}>
			<Stack className={'section-title'}>
				<h2>{t('Notifications')}</h2>
				<Button variant={'outlined'} size={'small'} onClick={readAllHandler}>
					{t('Mark all as read')}
				</Button>
			</Stack>

			<Tabs
				value={notificationInquiry.search.notificationStatus ?? 'ALL'}
				onChange={(_, value: string) =>
					setNotificationInquiry({
						...notificationInquiry,
						page: 1,
						search: value === 'ALL' ? {} : { notificationStatus: value as NotificationStatus },
					})
				}
			>
				<Tab value={NotificationStatus.WAIT} label={t('Unread')} />
				<Tab value={'ALL'} label={t('All')} />
			</Tabs>

			{notifications.length === 0 ? (
				<NoData text={'No notifications'} />
			) : (
				<Stack className={'notification-list'}>
					{notifications.map((notification) => (
						<button
							key={notification._id}
							className={`notification-row ${notification.notificationStatus === NotificationStatus.WAIT ? 'unread' : ''}`}
							onClick={() => openNotificationHandler(notification)}
						>
							<Avatar src={imageUrl(notification.authorData?.memberImage, DEFAULT_AVATAR)} />
							<span className={'text'}>
								<strong>{notification.authorData?.memberNick}</strong> {t(TYPE_LABEL[notification.notificationType])}
								{notification.notificationDesc && <em>{notification.notificationDesc}</em>}
							</span>
							<span className={'muted'}>{moment(notification.createdAt).fromNow()}</span>
						</button>
					))}
				</Stack>
			)}

			{total > notificationInquiry.limit && (
				<Pagination
					page={notificationInquiry.page}
					count={Math.ceil(total / notificationInquiry.limit)}
					onChange={(_: ChangeEvent<unknown>, value: number) =>
						setNotificationInquiry({ ...notificationInquiry, page: value })
					}
					shape={'rounded'}
					color={'primary'}
				/>
			)}
		</Stack>
	);
};

export default MyNotifications;
