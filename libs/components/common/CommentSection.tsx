import { ChangeEvent, useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Button, Pagination, Stack, TextField } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { GET_COMMENTS } from '../../../apollo/user/query';
import { CREATE_COMMENT, UPDATE_COMMENT } from '../../../apollo/user/mutation';
import { Comment } from '../../types/comment/comment';
import { CommentsInquiry } from '../../types/comment/comment.input';
import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { Direction, Message } from '../../enums/common.enum';
import { COMMENTS_PAGE_LIMIT, DEFAULT_AVATAR, imageUrl } from '../../config';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { T } from '../../types/common';

interface CommentSectionProps {
	commentGroup: CommentGroup;
	commentRefId: string;
	/** called after a comment is added or removed, so the parent can refresh its counter */
	onChange?: () => void;
}

/** Smart section: owns its query and mutations. Used on product, room tour and article pages. */
const CommentSection = (props: CommentSectionProps) => {
	const { commentGroup, commentRefId, onChange } = props;
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>({
		page: 1,
		limit: COMMENTS_PAGE_LIMIT,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { commentRefId },
	});
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [content, setContent] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [createComment] = useMutation(CREATE_COMMENT);
	const [updateComment] = useMutation(UPDATE_COMMENT);

	const { refetch: getCommentsRefetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: commentInquiry },
		skip: !commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setComments(data?.getComments?.list ?? []);
			setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const refresh = async (page: number = commentInquiry.page) => {
		const next = { ...commentInquiry, page };
		setCommentInquiry(next);
		const { data } = await getCommentsRefetch({ input: next });
		setComments(data?.getComments?.list ?? []);
		setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
	};

	const createCommentHandler = async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			if (!content.trim()) return;
			await createComment({ variables: { input: { commentGroup, commentRefId, commentContent: content.trim() } } });
			setContent('');
			await refresh(1);
			onChange?.();
			await sweetTopSmallSuccessAlert(t('Comment added') as string, 800);
		} catch (err: any) {
			console.log('ERROR, createCommentHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const removeCommentHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert(t('Delete this comment?') as string))) return;
			await updateComment({ variables: { input: { _id: id, commentStatus: CommentStatus.DELETE } } });
			await refresh();
			onChange?.();
		} catch (err: any) {
			console.log('ERROR, removeCommentHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack className={'comment-section'}>
			<h3>
				{t('Comments')} <span>{commentTotal}</span>
			</h3>

			<Stack className={'comment-form'}>
				<TextField
					multiline
					minRows={2}
					fullWidth
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder={(user._id ? t('Write a comment') : t('Login to write a comment')) as string}
					disabled={!user._id}
					inputProps={{ maxLength: 500 }}
				/>
				<Button variant={'contained'} onClick={createCommentHandler} disabled={!user._id || !content.trim()}>
					{t('Post')}
				</Button>
			</Stack>

			<Stack className={'comment-list'}>
				{comments.map((comment: Comment) => (
					<Stack key={comment._id} className={'comment-item'}>
						<Avatar src={imageUrl(comment.memberData?.memberImage, DEFAULT_AVATAR)} sx={{ width: 36, height: 36 }} />
						<Stack className={'comment-body'}>
							<Stack className={'comment-head'}>
								<strong>{comment.memberData?.memberNick}</strong>
								<span>{moment(comment.createdAt).fromNow()}</span>
								{comment.memberId === user._id && (
									<button className={'text-btn'} onClick={() => removeCommentHandler(comment._id)}>
										{t('Delete')}
									</button>
								)}
							</Stack>
							<p>{comment.commentContent}</p>
						</Stack>
					</Stack>
				))}
			</Stack>

			{commentTotal > commentInquiry.limit && (
				<Pagination
					page={commentInquiry.page}
					count={Math.ceil(commentTotal / commentInquiry.limit)}
					onChange={(_: ChangeEvent<unknown>, value: number) => refresh(value)}
					shape={'rounded'}
					color={'primary'}
				/>
			)}
		</Stack>
	);
};

export default CommentSection;
