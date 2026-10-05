import { Direction } from '../../enums/common.enum';
import { MeFollowed, MeLiked, TotalCounter } from '../common';
import { Member } from '../member/member';

interface FollowBase {
	_id: string;
	followingId: string;
	followerId: string;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
}

export interface Follower extends FollowBase {
	followerData?: Member;
}

export interface Following extends FollowBase {
	followingData?: Member;
}

export interface Followers {
	list: Follower[];
	metaCounter: TotalCounter[];
}

export interface Followings {
	list: Following[];
	metaCounter: TotalCounter[];
}

export interface FollowInquiry {
	page: number;
	limit: number;
	direction?: Direction;
	search: { followingId?: string; followerId?: string };
}
