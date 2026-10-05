import Link from 'next/link';
import { ChangeEvent, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Button, Pagination, Stack } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { GET_MEMBER_FOLLOWERS, GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { FollowInquiry } from '../../types/follow/follow';
import { Member } from '../../types/member/member';
import { MeFollowed, T } from '../../types/common';
import { Direction } from '../../enums/common.enum';
import { DEFAULT_AVATAR, imageUrl } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import NoData from '../common/NoData';

interface MemberFollowsProps {
	mode: 'followers' | 'followings';
	memberId: string;
}

interface FollowRow {
	_id: string;
	member?: Member;
	meFollowed?: MeFollowed[];
}

/** Followers or followings of a member, with follow-back buttons. */
const MemberFollows = ({ mode, memberId }: MemberFollowsProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const isFollowers = mode === 'followers';
	const [followInquiry, setFollowInquiry] = useState<FollowInquiry>({
		page: 1,
		limit: 10,
		direction: Direction.DESC,
		search: isFollowers ? { followingId: memberId } : { followerId: memberId },
	});
	const [rows, setRows] = useState<FollowRow[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);

	const readRows = (data: T) => {
		const result = isFollowers ? data?.getMemberFollowers : data?.getMemberFollowings;
		setRows(
			(result?.list ?? []).map((item: T) => ({
				_id: item._id,
				member: isFollowers ? item.followerData : item.followingData,
				meFollowed: item.meFollowed,
			})),
		);
		setTotal(result?.metaCounter?.[0]?.total ?? 0);
	};

	const { refetch: getFollowsRefetch } = useQuery(isFollowers ? GET_MEMBER_FOLLOWERS : GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'network-only',
		variables: { input: followInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: readRows,
	});

	/** HANDLERS **/
	const followHandler = async (targetId: string, following: boolean) => {
		try {
			if (following) await unsubscribe({ variables: { input: targetId } });
			else await subscribe({ variables: { input: targetId } });
			const { data } = await getFollowsRefetch({ input: followInquiry });
			readRows(data);
		} catch (err: any) {
			console.log('ERROR, followHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack className={'my-section'}>
			<h2>{isFollowers ? t('Followers') : t('Following')}</h2>
			{rows.length === 0 ? (
				<NoData text={isFollowers ? 'No followers yet' : 'You are not following anyone yet'} />
			) : (
				<Stack className={'follow-list'}>
					{rows.map((row) => {
						const following = Boolean(row.meFollowed?.[0]?.myFollowing);
						return (
							<Stack key={row._id} className={'follow-row'}>
								<Link href={{ pathname: '/member', query: { memberId: row.member?._id } }}>
									<Avatar src={imageUrl(row.member?.memberImage, DEFAULT_AVATAR)} />
									<Stack>
										<strong>{row.member?.memberNick}</strong>
										<span className={'muted'}>
											{row.member?.memberFollowers ?? 0} {t('Followers')}
										</span>
									</Stack>
								</Link>
								{row.member && row.member._id !== user._id && (
									<Button
										size={'small'}
										variant={following ? 'outlined' : 'contained'}
										onClick={() => followHandler(row.member!._id, following)}
									>
										{following ? t('Following') : t('Follow')}
									</Button>
								)}
							</Stack>
						);
					})}
				</Stack>
			)}
			{total > followInquiry.limit && (
				<Pagination
					page={followInquiry.page}
					count={Math.ceil(total / followInquiry.limit)}
					onChange={(_: ChangeEvent<unknown>, value: number) => setFollowInquiry({ ...followInquiry, page: value })}
					shape={'rounded'}
					color={'primary'}
				/>
			)}
		</Stack>
	);
};

export default MemberFollows;
