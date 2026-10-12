import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChangeEvent, useState, useEffect } from 'react';
import moment from 'moment';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Avatar, Button, CircularProgress, Pagination, Stack, Tab, Tabs } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import NoData from '../../libs/components/common/NoData';
import { userVar } from '../../apollo/store';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Direction } from '../../libs/enums/common.enum';
import { DEFAULT_AVATAR, imageUrl } from '../../libs/config';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** Room Tours have their own page; the community board holds the rest. */
const CATEGORIES = [
	{ value: BoardArticleCategory.QNA, label: 'Q&A' },
	{ value: BoardArticleCategory.TIPS, label: 'Tips' },
	{ value: BoardArticleCategory.FREE, label: 'Free talk' },
];

const PAGE_LIMIT = 10;

const Community: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const category = CATEGORIES.find((item) => item.value === router.query.category)?.value ?? BoardArticleCategory.QNA;
	const page = Math.max(1, parseInt((router.query.page as string) ?? '1', 10) || 1);
	const [articles, setArticles] = useState<BoardArticle[]>([]);
	const [total, setTotal] = useState<number>(0);

	const articleInquiry: BoardArticlesInquiry = {
		page,
		limit: PAGE_LIMIT,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { articleCategory: category },
	};

	/** APOLLO REQUESTS **/
	const { loading, data: queryData } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: articleInquiry },
		skip: !router.isReady,
		notifyOnNetworkStatusChange: true,
	});

	/** cached results show at once on a revisit, fresh ones replace them a moment later */
	useEffect(() => {
		const data: T = queryData;
		if (!data) return;
		setArticles(data?.getBoardArticles?.list ?? []);
		setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
	}, [queryData]);

	/** HANDLERS **/
	const changeCategoryHandler = async (_: unknown, value: BoardArticleCategory) => {
		await router.push({ pathname: '/community', query: { category: value } }, undefined, { scroll: false });
	};

	const paginationHandler = async (_: ChangeEvent<unknown>, value: number) => {
		await router.push({ pathname: '/community', query: { category, page: value } }, undefined, { scroll: false });
	};

	return (
		<Stack id={'community-page'}>
			<Stack className={'container'}>
				<Stack className={'list-toolbar'}>
					<Tabs value={category} onChange={changeCategoryHandler}>
						{CATEGORIES.map((item) => (
							<Tab key={item.value} value={item.value} label={t(item.label)} />
						))}
					</Tabs>
					{user._id && (
						<Link href={{ pathname: '/mypage', query: { category: 'writeArticle', articleCategory: category } }}>
							<Button variant={'contained'} startIcon={<EditOutlinedIcon />}>
								{t('Write')}
							</Button>
						</Link>
					)}
				</Stack>

				{loading && !articles.length ? (
					<Stack className={'loading-box'}>
						<CircularProgress />
					</Stack>
				) : articles.length === 0 ? (
					<NoData text={'No posts yet. Be the first!'} />
				) : (
					<Stack className={'article-list'}>
						{articles.map((article) => (
							<Link
								key={article._id}
								href={{ pathname: '/community/detail', query: { id: article._id } }}
								className={'article-row'}
							>
								<Stack className={'row-main'}>
									<strong>{article.articleTitle}</strong>
									<p>{article.articleContent}</p>
									<Stack className={'row-meta'}>
										<Avatar
											src={imageUrl(article.memberData?.memberImage, DEFAULT_AVATAR)}
											sx={{ width: 20, height: 20 }}
										/>
										<span>{article.memberData?.memberNick}</span>
										<span>·</span>
										<span>{moment(article.createdAt).fromNow()}</span>
										<span className={'counter'}>
											<FavoriteBorderIcon fontSize={'inherit'} /> {article.articleLikes}
										</span>
										<span className={'counter'}>
											<ChatBubbleOutlineIcon fontSize={'inherit'} /> {article.articleComments}
										</span>
									</Stack>
								</Stack>
								{article.articleImage && <img src={imageUrl(article.articleImage, '')} alt={''} />}
							</Link>
						))}
					</Stack>
				)}

				{total > PAGE_LIMIT && (
					<Stack className={'pagination-config'}>
						<Pagination
							page={page}
							count={Math.ceil(total / PAGE_LIMIT)}
							onChange={paginationHandler}
							shape={'rounded'}
							color={'primary'}
						/>
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Community);
