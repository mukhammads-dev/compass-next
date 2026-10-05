import { MemberStatus, MemberType } from '../../enums/member.enum';

export interface MemberUpdate {
	memberNick?: string;
	memberPassword?: string;
	memberPhone?: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
}

export interface MemberUpdateByAdmin {
	_id: string;
	memberType?: MemberType;
	memberStatus?: MemberStatus;
	memberNick?: string;
	memberPhone?: string;
	memberImage?: string;
	memberDesc?: string;
}
