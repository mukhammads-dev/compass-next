import { Direction } from '../../enums/common.enum';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';
import { TotalCounter } from '../common';

export interface Notice {
	_id: string;
	noticeCategory: NoticeCategory;
	noticeStatus: NoticeStatus;
	noticeTitle: string;
	noticeContent: string;
	eventStartAt?: Date;
	eventEndAt?: Date;
	memberId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Notices {
	list: Notice[];
	metaCounter: TotalCounter[];
}

export interface NoticeInput {
	noticeCategory: NoticeCategory;
	noticeStatus?: NoticeStatus;
	noticeTitle: string;
	noticeContent: string;
	eventStartAt?: Date;
	eventEndAt?: Date;
}

export interface NoticesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { noticeCategory?: NoticeCategory; text?: string };
}

export interface NoticeUpdate extends Partial<NoticeInput> {
	_id: string;
}

export interface AllNoticesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { noticeCategory?: NoticeCategory; noticeStatus?: NoticeStatus };
}
