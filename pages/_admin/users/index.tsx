import { NextPage } from 'next';
import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import MemberList from '../../../libs/components/admin/users/MemberList';
import AdminHeader from '../../../libs/components/admin/common/AdminHeader';
import AdminSegments from '../../../libs/components/admin/common/AdminSegments';
import AdminSearch from '../../../libs/components/admin/common/AdminSearch';
import AdminPager from '../../../libs/components/admin/common/AdminPager';
import { adminLabel } from '../../../libs/components/admin/common/adminLabels';
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
				if (!(await sweetConfirmAlert(`Mark this member as ${adminLabel(input.memberStatus).toLowerCase()}?`))) return;
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
			<AdminHeader title={'Members'} total={total} unit={total === 1 ? 'member' : 'members'} />

			<div className={'admin-toolbar'}>
				<AdminSegments
					label={'Status'}
					options={Object.values(MemberStatus)}
					value={membersInquiry.search.memberStatus}
					onChange={(memberStatus) =>
						changeSearch({ ...membersInquiry.search, memberStatus: memberStatus as MemberStatus })
					}
				/>
				<AdminSegments
					label={'Type'}
					options={Object.values(MemberType)}
					value={membersInquiry.search.memberType}
					allLabel={'Any type'}
					onChange={(memberType) => changeSearch({ ...membersInquiry.search, memberType: memberType as MemberType })}
				/>
				<AdminSearch
					placeholder={'Search by nickname'}
					onSearch={(text) => changeSearch({ ...membersInquiry.search, text })}
				/>
			</div>

			{members.length ? <MemberList members={members} updateMemberHandler={updateMemberHandler} /> : <NoData />}

			<AdminPager
				page={membersInquiry.page}
				limit={membersInquiry.limit}
				total={total}
				onPage={(page) => setMembersInquiry({ ...membersInquiry, page })}
			/>
		</Stack>
	);
};

export default withAdminLayout(AdminUsers);
