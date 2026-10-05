import Link from 'next/link';
import moment from 'moment';
import { Avatar, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Member } from '../../../types/member/member';
import { MemberStatus, MemberType } from '../../../enums/member.enum';
import { DEFAULT_AVATAR, imageUrl } from '../../../config';

interface MemberListProps {
	members: Member[];
	updateMemberHandler: (input: { _id: string; memberType?: MemberType; memberStatus?: MemberStatus }) => void;
}

const MemberList = ({ members, updateMemberHandler }: MemberListProps) => {
	return (
		<Table size={'small'} className={'admin-table'}>
			<TableHead>
				<TableRow>
					<TableCell>Member</TableCell>
					<TableCell>Phone</TableCell>
					<TableCell align={'right'}>Products</TableCell>
					<TableCell align={'right'}>Posts</TableCell>
					<TableCell align={'right'}>Points</TableCell>
					<TableCell>Joined</TableCell>
					<TableCell>Type</TableCell>
					<TableCell>Status</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{members.map((member) => (
					<TableRow key={member._id} hover>
						<TableCell>
							<Link href={{ pathname: '/member', query: { memberId: member._id } }} className={'cell-member'}>
								<Avatar src={imageUrl(member.memberImage, DEFAULT_AVATAR)} sx={{ width: 28, height: 28 }} />
								{member.memberNick}
							</Link>
						</TableCell>
						<TableCell>{member.memberPhone}</TableCell>
						<TableCell align={'right'}>{member.memberProducts}</TableCell>
						<TableCell align={'right'}>{member.memberArticles}</TableCell>
						<TableCell align={'right'}>{member.memberPoints}</TableCell>
						<TableCell>{moment(member.createdAt).format('YYYY.MM.DD')}</TableCell>
						<TableCell>
							<Select
								size={'small'}
								value={member.memberType}
								onChange={(e) => updateMemberHandler({ _id: member._id, memberType: e.target.value as MemberType })}
							>
								{Object.values(MemberType).map((type) => (
									<MenuItem key={type} value={type}>
										{type}
									</MenuItem>
								))}
							</Select>
						</TableCell>
						<TableCell>
							<Select
								size={'small'}
								value={member.memberStatus}
								onChange={(e) =>
									updateMemberHandler({ _id: member._id, memberStatus: e.target.value as MemberStatus })
								}
							>
								{Object.values(MemberStatus).map((status) => (
									<MenuItem key={status} value={status}>
										{status}
									</MenuItem>
								))}
							</Select>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default MemberList;
