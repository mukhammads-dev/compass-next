import Link from 'next/link';
import moment from 'moment';
import { Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { BoardArticle } from '../../../types/board-article/board-article';
import { BoardArticleCategory, BoardArticleStatus } from '../../../enums/board-article.enum';

interface ArticleListProps {
	articles: BoardArticle[];
	deleteArticleHandler: (id: string) => void;
	removeArticleHandler: (id: string) => void;
}

const ArticleList = ({ articles, deleteArticleHandler, removeArticleHandler }: ArticleListProps) => {
	return (
		<Table size={'small'} className={'admin-table'}>
			<TableHead>
				<TableRow>
					<TableCell>Title</TableCell>
					<TableCell>Board</TableCell>
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
					<TableRow key={article._id} hover>
						<TableCell>
							<Link
								href={{
									pathname:
										article.articleCategory === BoardArticleCategory.ROOM_TOUR ? '/room-tour/detail' : '/community/detail',
									query: { id: article._id },
								}}
							>
								{article.articleTitle}
							</Link>
						</TableCell>
						<TableCell>{article.articleCategory}</TableCell>
						<TableCell>{article.memberData?.memberNick}</TableCell>
						<TableCell align={'right'}>{article.taggedProducts?.length ?? 0}</TableCell>
						<TableCell align={'right'}>{article.articleLikes}</TableCell>
						<TableCell align={'right'}>{article.articleComments}</TableCell>
						<TableCell>{moment(article.createdAt).format('YYYY.MM.DD')}</TableCell>
						<TableCell>{article.articleStatus}</TableCell>
						<TableCell>
							{article.articleStatus === BoardArticleStatus.ACTIVE ? (
								<Button size={'small'} onClick={() => deleteArticleHandler(article._id)}>
									Delete
								</Button>
							) : (
								<Button size={'small'} color={'error'} onClick={() => removeArticleHandler(article._id)}>
									Remove
								</Button>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default ArticleList;
