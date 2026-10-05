import { NextPage } from 'next';
import { ChangeEvent, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack, Tab, TablePagination, Tabs, TextField } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import MemberList from '../../../libs/components/admin/users/MemberList';
import NoData from '../../../libs/components/common/NoData';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Member } from '../../../libs/types/member/member';
import { MembersInquiry } from '../../../libs/types/member/member.input';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const initialInquiry: MembersInquiry = { page: 1, limit: 20, sort: 'createdAt', direction: Direction.DESC, search: {} };

const AdminUsers: NextPage = () => {
	const [membersInquiry, setMembersInquiry] = useState<MembersInquiry>(initialInquiry);
	const [members, setMembers] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [text, setText] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);

	const { refetch: getAllMembersRefetch } = useQuery(GET_ALL_MEMBERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: membersInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMembers(data?.getAllMembersByAdmin?.list ?? []);
			setTotal(data?.getAllMembersByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const changeSearch = (search: MembersInquiry['search']) => setMembersInquiry({ ...membersInquiry, page: 1, search });

	const updateMemberHandler = async (input: { _id: string; memberType?: MemberType; memberStatus?: MemberStatus }) => {
		try {
			if (input.memberStatus && input.memberStatus !== MemberStatus.ACTIVE) {
				if (!(await sweetConfirmAlert(`Change status to ${input.memberStatus}?`))) return;
			}
			await updateMemberByAdmin({ variables: { input } });
			const { data } = await getAllMembersRefetch({ input: membersInquiry });
			setMembers(data?.getAllMembersByAdmin?.list ?? []);
			await sweetTopSmallSuccessAlert('Updated', 800);
		} catch (err: any) {
			console.log('ERROR, updateMemberHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack id={'admin-users-page'} className={'admin-page'}>
			<Stack className={'admin-toolbar'}>
				<Tabs
					value={membersInquiry.search.memberStatus ?? 'ALL'}
					onChange={(_, value: string) =>
						changeSearch({ ...membersInquiry.search, memberStatus: value === 'ALL' ? undefined : (value as MemberStatus) })
					}
				>
					<Tab value={'ALL'} label={'All'} />
					{Object.values(MemberStatus).map((status) => (
						<Tab key={status} value={status} label={status} />
					))}
				</Tabs>
				<Stack className={'toolbar-right'}>
					<Tabs
						value={membersInquiry.search.memberType ?? 'ALL'}
						onChange={(_, value: string) =>
							changeSearch({ ...membersInquiry.search, memberType: value === 'ALL' ? undefined : (value as MemberType) })
						}
					>
						<Tab value={'ALL'} label={'Any type'} />
						{Object.values(MemberType).map((type) => (
							<Tab key={type} value={type} label={type} />
						))}
					</Tabs>
					<TextField
						size={'small'}
						placeholder={'Search nick'}
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && changeSearch({ ...membersInquiry.search, text: text.trim() || undefined })}
					/>
				</Stack>
			</Stack>

			{members.length ? <MemberList members={members} updateMemberHandler={updateMemberHandler} /> : <NoData />}

			<TablePagination
				component={'div'}
				count={total}
				page={membersInquiry.page - 1}
				rowsPerPage={membersInquiry.limit}
				rowsPerPageOptions={[10, 20, 50]}
				onPageChange={(_, page: number) => setMembersInquiry({ ...membersInquiry, page: page + 1 })}
				onRowsPerPageChange={(e: ChangeEvent<HTMLInputElement>) =>
					setMembersInquiry({ ...membersInquiry, page: 1, limit: parseInt(e.target.value, 10) })
				}
			/>
		</Stack>
	);
};

export default withAdminLayout(AdminUsers);
