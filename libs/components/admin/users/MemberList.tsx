import Link from 'next/link';
import moment from 'moment';
import { Avatar, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Member } from '../../../types/member/member';
import { MemberStatus, MemberType } from '../../../enums/member.enum';
import { DEFAULT_AVATAR, imageUrl } from '../../../config';
import StatusSelect from '../common/StatusSelect';

interface MemberListProps {
	members: Member[];
	updateMemberHandler: (input: { _id: string; memberType?: MemberType; memberStatus?: MemberStatus }) => void;
}

const MemberList = ({ members, updateMemberHandler }: MemberListProps) => {
	return (
		<Table className={'admin-table'}>
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
					<TableRow key={member._id}>
						<TableCell>
							<Link href={{ pathname: '/member', query: { memberId: member._id } }} className={'cell-main'}>
								<Avatar src={imageUrl(member.memberImage, DEFAULT_AVATAR)} alt={''} />
								<span>
									<strong>{member.memberNick}</strong>
									{member.memberFullName && <small>{member.memberFullName}</small>}
								</span>
							</Link>
						</TableCell>
						<TableCell className={'cell-muted'}>{member.memberPhone}</TableCell>
						<TableCell align={'right'}>{member.memberProducts}</TableCell>
						<TableCell align={'right'}>{member.memberArticles}</TableCell>
						<TableCell align={'right'}>{member.memberPoints}</TableCell>
						<TableCell className={'cell-muted'}>{moment(member.createdAt).format('YYYY.MM.DD')}</TableCell>
						<TableCell>
							<StatusSelect
								label={`Type of ${member.memberNick}`}
								value={member.memberType}
								options={Object.values(MemberType)}
								dot={false}
								onChange={(memberType) => updateMemberHandler({ _id: member._id, memberType })}
							/>
						</TableCell>
						<TableCell>
							<StatusSelect
								label={`Status of ${member.memberNick}`}
								value={member.memberStatus}
								options={Object.values(MemberStatus)}
								onChange={(memberStatus) => updateMemberHandler({ _id: member._id, memberStatus })}
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default MemberList;
