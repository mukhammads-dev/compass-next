import Link from 'next/link';
import moment from 'moment';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { BoardArticle } from '../../../types/board-article/board-article';
import { BoardArticleCategory, BoardArticleStatus } from '../../../enums/board-article.enum';
import { adminLabel, statusTone } from '../common/adminLabels';

interface CommunityArticleListProps {
	articles: BoardArticle[];
	deleteArticleHandler: (id: string) => void;
	removeArticleHandler: (id: string) => void;
}

const CommunityArticleList = ({ articles, deleteArticleHandler, removeArticleHandler }: CommunityArticleListProps) => {
	return (
		<Table className={'admin-table'}>
			<TableHead>
				<TableRow>
					<TableCell>Post</TableCell>
					<TableCell>Author</TableCell>
					<TableCell align={'right'}>Pins</TableCell>
					<TableCell align={'right'}>Likes</TableCell>
					<TableCell align={'right'}>Comments</TableCell>
					<TableCell>Posted</TableCell>
					<TableCell>Status</TableCell>
					<TableCell />
				</TableRow>
			</TableHead>
			<TableBody>
				{articles.map((article) => (
					<TableRow key={article._id}>
						<TableCell>
							<Link
								href={{
									pathname:
										article.articleCategory === BoardArticleCategory.ROOM_TOUR
											? '/room-tour/detail'
											: '/community/detail',
									query: { id: article._id },
								}}
								className={'cell-main'}
							>
								<span>
									<strong>{article.articleTitle}</strong>
									<small>{adminLabel(article.articleCategory)}</small>
								</span>
							</Link>
						</TableCell>
						<TableCell>{article.memberData?.memberNick}</TableCell>
						<TableCell align={'right'}>{article.taggedProducts?.length ?? 0}</TableCell>
						<TableCell align={'right'}>{article.articleLikes}</TableCell>
						<TableCell align={'right'}>{article.articleComments}</TableCell>
						<TableCell className={'cell-muted'}>{moment(article.createdAt).format('YYYY.MM.DD')}</TableCell>
						<TableCell>
							<span className={'status-value'}>
								<i className={`dot ${statusTone(article.articleStatus)}`} />
								{adminLabel(article.articleStatus)}
							</span>
						</TableCell>
						<TableCell align={'right'}>
							{article.articleStatus === BoardArticleStatus.ACTIVE ? (
								<button type={'button'} className={'row-action'} onClick={() => deleteArticleHandler(article._id)}>
									Delete
								</button>
							) : (
								<button
									type={'button'}
									className={'row-action danger'}
									onClick={() => removeArticleHandler(article._id)}
								>
									Remove for good
								</button>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default CommunityArticleList;
