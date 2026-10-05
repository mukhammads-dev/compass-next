import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { Direction } from '../../enums/common.enum';

export interface CommentInput {
	commentGroup: CommentGroup;
	commentContent: string;
	commentRefId: string;
}

export interface CommentsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { commentRefId: string };
}

export interface CommentUpdate {
	_id: string;
	commentStatus?: CommentStatus;
	commentContent?: string;
}
