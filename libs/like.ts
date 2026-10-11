import { MeLiked } from './types/common';

type LikeKey = 'productLikes' | 'articleLikes' | 'memberLikes';
type Likeable = { _id: string; meLiked?: MeLiked[] } & Partial<Record<LikeKey, number>>;

export const isLiked = (item?: Likeable | null): boolean => Boolean(item?.meLiked?.[0]?.myFavorite);

/**
 * The heart turns at once; the server reply then settles the real count.
 * No list refetch, no popup: a like should feel instant.
 */
export const flipLike = <T extends Likeable>(item: T, key: LikeKey): T => {
	const liked = isLiked(item);
	return {
		...item,
		[key]: Math.max(0, (item[key] ?? 0) + (liked ? -1 : 1)),
		meLiked: liked ? [] : [{ myFavorite: true } as MeLiked],
	};
};

/** Puts the server's answer (count + liked state) onto the item. */
export const settleLike = <T extends Likeable>(item: T, key: LikeKey, reply?: Likeable | null): T =>
	reply ? { ...item, [key]: reply[key] ?? item[key], meLiked: reply.meLiked ?? item.meLiked } : item;
