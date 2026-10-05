/** Dynamic object shape. Use only for truly dynamic values (GraphQL data, errors). */
export interface T {
	[key: string]: any;
}

export interface TotalCounter {
	total: number;
}

export interface MeLiked {
	memberId: string;
	likeRefId: string;
	myFavorite: boolean;
}

export interface MeFollowed {
	followingId: string;
	followerId: string;
	myFollowing: boolean;
}

export interface Range {
	start: number;
	end: number;
}
