import { NextPage } from 'next';
import { ChangeEvent, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { MenuItem, Select, Stack, Tab, TablePagination, Tabs } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import ArticleList from '../../../libs/components/admin/community/ArticleList';
import NoData from '../../../libs/components/common/NoData';
import { GET_ALL_BOARD_ARTICLES_BY_ADMIN } from '../../../apollo/admin/query';
import { REMOVE_BOARD_ARTICLE_BY_ADMIN, UPDATE_BOARD_ARTICLE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { BoardArticle } from '../../../libs/types/board-article/board-article';
import { AllBoardArticlesInquiry } from '../../../libs/types/board-article/board-article.input';
import { BoardArticleCategory, BoardArticleStatus } from '../../../libs/enums/board-article.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const initialInquiry: AllBoardArticlesInquiry = {
	page: 1,
	limit: 20,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: {},
};

const AdminCommunity: NextPage = () => {
	const [articlesInquiry, setArticlesInquiry] = useState<AllBoardArticlesInquiry>(initialInquiry);
	const [articles, setArticles] = useState<BoardArticle[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [updateBoardArticleByAdmin] = useMutation(UPDATE_BOARD_ARTICLE_BY_ADMIN);
	const [removeBoardArticleByAdmin] = useMutation(REMOVE_BOARD_ARTICLE_BY_ADMIN);

	const { refetch: getAllArticlesRefetch } = useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: articlesInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setArticles(data?.getAllBoardArticlesByAdmin?.list ?? []);
			setTotal(data?.getAllBoardArticlesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const reload = async () => {
		const { data } = await getAllArticlesRefetch({ input: articlesInquiry });
		setArticles(data?.getAllBoardArticlesByAdmin?.list ?? []);
		setTotal(data?.getAllBoardArticlesByAdmin?.metaCounter?.[0]?.total ?? 0);
	};

	const deleteArticleHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert('Soft-delete this post?'))) return;
			await updateBoardArticleByAdmin({ variables: { input: { _id: id, articleStatus: BoardArticleStatus.DELETE } } });
			await reload();
			await sweetTopSmallSuccessAlert('Deleted', 800);
		} catch (err: any) {
			console.log('ERROR, deleteArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const removeArticleHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert('Permanently remove this post? This cannot be undone.'))) return;
			await removeBoardArticleByAdmin({ variables: { input: id } });
			await reload();
		} catch (err: any) {
			console.log('ERROR, removeArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack id={'admin-community-page'} className={'admin-page'}>
			<Stack className={'admin-toolbar'}>
				<Tabs
					value={articlesInquiry.search.articleStatus ?? 'ALL'}
					onChange={(_, value: string) =>
						setArticlesInquiry({
							...articlesInquiry,
							page: 1,
							search: {
								...articlesInquiry.search,
								articleStatus: value === 'ALL' ? undefined : (value as BoardArticleStatus),
							},
						})
					}
				>
					<Tab value={'ALL'} label={'All'} />
					{Object.values(BoardArticleStatus).map((status) => (
						<Tab key={status} value={status} label={status} />
					))}
				</Tabs>
				<Select
					size={'small'}
					value={articlesInquiry.search.articleCategory ?? 'ALL'}
					onChange={(e) =>
						setArticlesInquiry({
							...articlesInquiry,
							page: 1,
							search: {
								...articlesInquiry.search,
								articleCategory: e.target.value === 'ALL' ? undefined : (e.target.value as BoardArticleCategory),
							},
						})
					}
				>
					<MenuItem value={'ALL'}>All boards</MenuItem>
					{Object.values(BoardArticleCategory).map((category) => (
						<MenuItem key={category} value={category}>
							{category}
						</MenuItem>
					))}
				</Select>
			</Stack>

			{articles.length ? (
				<ArticleList
					articles={articles}
					deleteArticleHandler={deleteArticleHandler}
					removeArticleHandler={removeArticleHandler}
				/>
			) : (
				<NoData />
			)}

			<TablePagination
				component={'div'}
				count={total}
				page={articlesInquiry.page - 1}
				rowsPerPage={articlesInquiry.limit}
				rowsPerPageOptions={[10, 20, 50]}
				onPageChange={(_, page: number) => setArticlesInquiry({ ...articlesInquiry, page: page + 1 })}
				onRowsPerPageChange={(e: ChangeEvent<HTMLInputElement>) =>
					setArticlesInquiry({ ...articlesInquiry, page: 1, limit: parseInt(e.target.value, 10) })
				}
			/>
		</Stack>
	);
};

export default withAdminLayout(AdminCommunity);
