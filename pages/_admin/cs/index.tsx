import { NextPage } from 'next';
import { ChangeEvent, useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
	Button,
	Stack,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TablePagination,
	TableRow,
	Tabs,
} from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import NoticeForm from '../../../libs/components/admin/cs/NoticeForm';
import NoData from '../../../libs/components/common/NoData';
import { GET_ALL_NOTICES_BY_ADMIN } from '../../../apollo/admin/query';
import { CREATE_NOTICE, REMOVE_NOTICE, UPDATE_NOTICE } from '../../../apollo/admin/mutation';
import { AllNoticesInquiry, Notice, NoticeInput } from '../../../libs/types/notice/notice';
import { NoticeCategory, NoticeStatus } from '../../../libs/enums/notice.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const initialInquiry: AllNoticesInquiry = { page: 1, limit: 20, sort: 'createdAt', direction: Direction.DESC, search: {} };

const AdminCs: NextPage = () => {
	const [noticesInquiry, setNoticesInquiry] = useState<AllNoticesInquiry>(initialInquiry);
	const [notices, setNotices] = useState<Notice[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [editing, setEditing] = useState<Notice | null>(null);
	const [formOpen, setFormOpen] = useState<boolean>(false);

	/** APOLLO REQUESTS **/
	const [createNotice] = useMutation(CREATE_NOTICE);
	const [updateNotice] = useMutation(UPDATE_NOTICE);
	const [removeNotice] = useMutation(REMOVE_NOTICE);

	const { refetch: getAllNoticesRefetch } = useQuery(GET_ALL_NOTICES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: noticesInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setNotices(data?.getAllNoticesByAdmin?.list ?? []);
			setTotal(data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const reload = async () => {
		const { data } = await getAllNoticesRefetch({ input: noticesInquiry });
		setNotices(data?.getAllNoticesByAdmin?.list ?? []);
		setTotal(data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
	};

	const openFormHandler = (notice: Notice | null) => {
		setEditing(notice);
		setFormOpen(true);
	};

	const saveNoticeHandler = async (input: NoticeInput) => {
		try {
			if (editing) await updateNotice({ variables: { input: { ...input, _id: editing._id } } });
			else await createNotice({ variables: { input } });
			setFormOpen(false);
			setEditing(null);
			await reload();
			await sweetTopSmallSuccessAlert('Saved', 800);
		} catch (err: any) {
			console.log('ERROR, saveNoticeHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const deleteNoticeHandler = async (notice: Notice) => {
		try {
			if (notice.noticeStatus !== NoticeStatus.DELETE) {
				if (!(await sweetConfirmAlert('Move this notice to DELETE?'))) return;
				await updateNotice({ variables: { input: { _id: notice._id, noticeStatus: NoticeStatus.DELETE } } });
			} else {
				if (!(await sweetConfirmAlert('Permanently remove this notice?'))) return;
				await removeNotice({ variables: { input: notice._id } });
			}
			await reload();
		} catch (err: any) {
			console.log('ERROR, deleteNoticeHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack id={'admin-cs-page'} className={'admin-page'}>
			<Stack className={'admin-toolbar'}>
				<Tabs
					value={noticesInquiry.search.noticeCategory ?? 'ALL'}
					onChange={(_, value: string) =>
						setNoticesInquiry({
							...noticesInquiry,
							page: 1,
							search: { ...noticesInquiry.search, noticeCategory: value === 'ALL' ? undefined : (value as NoticeCategory) },
						})
					}
				>
					<Tab value={'ALL'} label={'All'} />
					{Object.values(NoticeCategory).map((category) => (
						<Tab key={category} value={category} label={category} />
					))}
				</Tabs>
				<Button variant={'contained'} onClick={() => openFormHandler(null)}>
					New notice
				</Button>
			</Stack>

			{formOpen && (
				<NoticeForm
					key={editing?._id ?? 'new'}
					notice={editing}
					onSubmit={saveNoticeHandler}
					onCancel={() => setFormOpen(false)}
				/>
			)}

			{notices.length ? (
				<Table size={'small'} className={'admin-table'}>
					<TableHead>
						<TableRow>
							<TableCell>Title</TableCell>
							<TableCell>Category</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Created</TableCell>
							<TableCell />
						</TableRow>
					</TableHead>
					<TableBody>
						{notices.map((notice) => (
							<TableRow key={notice._id} hover>
								<TableCell>{notice.noticeTitle}</TableCell>
								<TableCell>{notice.noticeCategory}</TableCell>
								<TableCell>{notice.noticeStatus}</TableCell>
								<TableCell>{moment(notice.createdAt).format('YYYY.MM.DD')}</TableCell>
								<TableCell align={'right'}>
									<Button size={'small'} onClick={() => openFormHandler(notice)}>
										Edit
									</Button>
									<Button size={'small'} color={'error'} onClick={() => deleteNoticeHandler(notice)}>
										{notice.noticeStatus === NoticeStatus.DELETE ? 'Remove' : 'Delete'}
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<NoData />
			)}

			<TablePagination
				component={'div'}
				count={total}
				page={noticesInquiry.page - 1}
				rowsPerPage={noticesInquiry.limit}
				rowsPerPageOptions={[10, 20, 50]}
				onPageChange={(_, page: number) => setNoticesInquiry({ ...noticesInquiry, page: page + 1 })}
				onRowsPerPageChange={(e: ChangeEvent<HTMLInputElement>) =>
					setNoticesInquiry({ ...noticesInquiry, page: 1, limit: parseInt(e.target.value, 10) })
				}
			/>
		</Stack>
	);
};

export default withAdminLayout(AdminCs);
