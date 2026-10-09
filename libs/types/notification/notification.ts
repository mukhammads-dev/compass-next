import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { TotalCounter } from '../common';
import { Member } from '../member/member';

export interface Notification {
	_id: string;
	notificationType: NotificationType;
	notificationStatus: NotificationStatus;
	notificationGroup: NotificationGroup;
	notificationTitle: string;
	notificationDesc?: string;
	authorId: string;
	receiverId: string;
	productId?: string;
	articleId?: string;
	orderId?: string;
	createdAt: Date;
	/** from aggregation **/
	authorData?: Member;
}

export interface Notifications {
	list: Notification[];
	metaCounter: TotalCounter[];
}

export interface NotificationsInquiry {
	page: number;
	limit: number;
	search: { notificationStatus?: NotificationStatus };
}
