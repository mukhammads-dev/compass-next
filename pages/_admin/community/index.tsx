import { NextPage } from 'next';
import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import CommunityArticleList from '../../../libs/components/admin/community/CommunityArticleList';
import AdminHeader from '../../../libs/components/admin/common/AdminHeader';
import AdminSegments from '../../../libs/components/admin/common/AdminSegments';
import AdminPager from '../../../libs/components/admin/common/AdminPager';
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
			if (!(await sweetConfirmAlert('Hide this post from the community?'))) return;
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

	const changeSearch = (search: AllBoardArticlesInquiry['search']) =>
		setArticlesInquiry({ ...articlesInquiry, page: 1, search });

	return (
		<Stack id={'admin-community-page'} className={'admin-page'}>
			<AdminHeader title={'Community'} total={total} unit={total === 1 ? 'post' : 'posts'} />

			<div className={'admin-toolbar'}>
				<AdminSegments
					label={'Board'}
					options={Object.values(BoardArticleCategory)}
					value={articlesInquiry.search.articleCategory}
					allLabel={'All boards'}
					onChange={(articleCategory) =>
						changeSearch({ ...articlesInquiry.search, articleCategory: articleCategory as BoardArticleCategory })
					}
				/>
				<AdminSegments
					label={'Status'}
					options={Object.values(BoardArticleStatus)}
					value={articlesInquiry.search.articleStatus}
					onChange={(articleStatus) =>
						changeSearch({ ...articlesInquiry.search, articleStatus: articleStatus as BoardArticleStatus })
					}
				/>
			</div>

			{articles.length ? (
				<CommunityArticleList
					articles={articles}
					deleteArticleHandler={deleteArticleHandler}
					removeArticleHandler={removeArticleHandler}
				/>
			) : (
				<NoData />
			)}

			<AdminPager
				page={articlesInquiry.page}
				limit={articlesInquiry.limit}
				total={total}
				onPage={(page) => setArticlesInquiry({ ...articlesInquiry, page })}
			/>
		</Stack>
	);
};

export default withAdminLayout(AdminCommunity);
