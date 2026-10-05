import Link from 'next/link';
import { useState } from 'react';
import moment from 'moment';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { GET_NOTICES } from '../../../apollo/user/query';
import { Notice, NoticesInquiry } from '../../types/notice/notice';
import { NoticeCategory } from '../../enums/notice.enum';
import { Direction } from '../../enums/common.enum';
import { T } from '../../types/common';

const initialInput: NoticesInquiry = {
	page: 1,
	limit: 2,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: { noticeCategory: NoticeCategory.EVENT },
};

/** Active events written by ADMIN in the CS panel (hidden when there are none). */
const EventsBanner = () => {
	const { t } = useTranslation('common');
	const [events, setEvents] = useState<Notice[]>([]);

	/** APOLLO REQUESTS **/
	useQuery(GET_NOTICES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		onCompleted: (data: T) => setEvents(data?.getNotices?.list ?? []),
	});

	if (!events.length) return null;

	return (
		<Stack className={'home-section'}>
			<Stack className={'container'}>
				<Stack className={'section-head'}>
					<h2>{t('Events')}</h2>
					<Link href={{ pathname: '/cs', query: { tab: NoticeCategory.EVENT } }}>
						{t('See all')} <ArrowForwardIcon fontSize={'inherit'} />
					</Link>
				</Stack>
				<Stack className={`grid ${events.length > 1 ? 'grid-2' : ''} events`}>
					{events.map((event, index) => (
						<Link
							key={event._id}
							href={{ pathname: '/cs', query: { tab: NoticeCategory.EVENT } }}
							className={`event-card ${index % 2 ? 'oak' : 'ink'}`}
						>
							<span className={'event-chip'}>{t('Event')}</span>
							<strong>{event.noticeTitle}</strong>
							<p>{event.noticeContent}</p>
							{event.eventStartAt && (
								<small>
									{moment(event.eventStartAt).format('YYYY.MM.DD')}
									{event.eventEndAt ? ` – ${moment(event.eventEndAt).format('YYYY.MM.DD')}` : ''}
								</small>
							)}
						</Link>
					))}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default EventsBanner;
