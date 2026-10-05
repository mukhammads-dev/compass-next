import { BoardArticleStatus } from '../../enums/board-article.enum';
import { BoardArticleInput } from './board-article.input';

export interface BoardArticleUpdate extends Partial<Omit<BoardArticleInput, 'articleCategory'>> {
	_id: string;
	articleStatus?: BoardArticleStatus;
}
