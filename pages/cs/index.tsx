import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { ChangeEvent, useState, useEffect } from 'react';
import moment from 'moment';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Accordion, AccordionDetails, AccordionSummary, Pagination, Stack, Tab, Tabs } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import NoData from '../../libs/components/common/NoData';
import { GET_NOTICES } from '../../apollo/user/query';
import { Notice, NoticesInquiry } from '../../libs/types/notice/notice';
import { NoticeCategory } from '../../libs/enums/notice.enum';
import { Direction } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const TABS = [
	{ value: NoticeCategory.NOTICE, label: 'Notices' },
	{ value: NoticeCategory.FAQ, label: 'FAQ' },
	{ value: NoticeCategory.EVENT, label: 'Events' },
];

const PAGE_LIMIT = 10;

const CustomerCenter: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const tab = TABS.find((item) => item.value === router.query.tab)?.value ?? NoticeCategory.NOTICE;
	const [page, setPage] = useState<number>(1);
	const [notices, setNotices] = useState<Notice[]>([]);
	const [total, setTotal] = useState<number>(0);

	const noticeInquiry: NoticesInquiry = {
		page,
		limit: PAGE_LIMIT,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { noticeCategory: tab },
	};

	/** APOLLO REQUESTS **/
	const { data: queryResult } = useQuery(GET_NOTICES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: noticeInquiry },
		skip: !router.isReady,
	});
	/* read the result on every change, cache hits included (onCompleted skips those) */
	useEffect(() => {
		const data: T = queryResult;
		if (!data) return;
		setNotices(data?.getNotices?.list ?? []);
		setTotal(data?.getNotices?.metaCounter?.[0]?.total ?? 0);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryResult]);

	/** HANDLERS **/
	const changeTabHandler = async (_: unknown, value: NoticeCategory) => {
		setPage(1);
		await router.push({ pathname: '/cs', query: { tab: value } }, undefined, { scroll: false });
	};

	return (
		<Stack id={'cs-page'}>
			<Stack className={'container narrow'}>
				<Tabs value={tab} onChange={changeTabHandler}>
					{TABS.map((item) => (
						<Tab key={item.value} value={item.value} label={t(item.label)} />
					))}
				</Tabs>

				{notices.length === 0 ? (
					<NoData text={'Nothing here yet'} />
				) : (
					<Stack className={'notice-list'}>
						{notices.map((notice) => (
							<Accordion key={notice._id} disableGutters elevation={0}>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Stack className={'notice-head'}>
										<strong>{notice.noticeTitle}</strong>
										<span className={'muted'}>
											{tab === NoticeCategory.EVENT && notice.eventStartAt
												? `${moment(notice.eventStartAt).format('YYYY.MM.DD')} ~ ${
														notice.eventEndAt ? moment(notice.eventEndAt).format('YYYY.MM.DD') : ''
													}`
												: moment(notice.createdAt).format('YYYY.MM.DD')}
										</span>
									</Stack>
								</AccordionSummary>
								<AccordionDetails>
									<p className={'notice-content'}>{notice.noticeContent}</p>
								</AccordionDetails>
							</Accordion>
						))}
					</Stack>
				)}

				{total > PAGE_LIMIT && (
					<Stack className={'pagination-config'}>
						<Pagination
							page={page}
							count={Math.ceil(total / PAGE_LIMIT)}
							onChange={(_: ChangeEvent<unknown>, value: number) => setPage(value)}
							shape={'rounded'}
							color={'primary'}
						/>
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(CustomerCenter);
