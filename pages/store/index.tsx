import { NextPage } from 'next';
import { ChangeEvent, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CircularProgress, MenuItem, Pagination, Select, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import StoreCard from '../../libs/components/common/StoreCard';
import NoData from '../../libs/components/common/NoData';
import useInquiry from '../../libs/hooks/useInquiry';
import { GET_AGENTS } from '../../apollo/user/query';
import { Member } from '../../libs/types/member/member';
import { AgentsInquiry } from '../../libs/types/member/member.input';
import { Direction } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** Must stay inside backend availableAgentSorts. */
const SORTS = [
	{ id: 'memberRank', label: 'Top rated' },
	{ id: 'memberLikes', label: 'Most liked' },
	{ id: 'memberViews', label: 'Most visited' },
	{ id: 'createdAt', label: 'Newest' },
];

const initialInput: AgentsInquiry = { page: 1, limit: 12, sort: 'memberRank', direction: Direction.DESC, search: {} };

const StoreList: NextPage = () => {
	const { t } = useTranslation('common');
	const [searchFilter, pushSearchFilter, ready] = useInquiry<AgentsInquiry>(initialInput);
	const [stores, setStores] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [text, setText] = useState<string>('');

	/** APOLLO REQUESTS **/
	const { loading } = useQuery(GET_AGENTS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !ready,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setStores(data?.getAgents?.list ?? []);
			setTotal(data?.getAgents?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const searchHandler = async () => {
		const value = text.trim();
		await pushSearchFilter({ ...searchFilter, page: 1, search: value ? { text: value } : {} });
	};

	const paginationHandler = async (_: ChangeEvent<unknown>, value: number) => {
		await pushSearchFilter({ ...searchFilter, page: value });
	};

	return (
		<Stack id={'store-list-page'}>
			<Stack className={'container'}>
				<div className={'store-toolbar'}>
					<div className={'toolbar-title'}>
						<span className={'eyebrow'}>{t('Stores')}</span>
						<strong>
							{total} {t(total === 1 ? 'store to follow' : 'stores to follow')}
						</strong>
					</div>
					<form
						className={'toolbar-search'}
						onSubmit={(e) => {
							e.preventDefault();
							searchHandler();
						}}
					>
						<SearchIcon />
						<input
							value={text}
							placeholder={t('Search stores by name') as string}
							onChange={(e) => setText(e.target.value)}
						/>
						<button type={'submit'}>{t('Search')}</button>
					</form>
					<div className={'toolbar-sort'}>
						<span>{t('Sort by')}</span>
						<Select
							size={'small'}
							value={searchFilter.sort ?? 'memberRank'}
							onChange={(e) => pushSearchFilter({ ...searchFilter, page: 1, sort: e.target.value as string })}
						>
							{SORTS.map((option) => (
								<MenuItem key={option.id} value={option.id}>
									{t(option.label)}
								</MenuItem>
							))}
						</Select>
					</div>
				</div>

				{loading && !stores.length ? (
					<Stack className={'loading-box'}>
						<CircularProgress />
					</Stack>
				) : stores.length === 0 ? (
					<NoData text={'No stores found'} />
				) : (
					<div className={'grid grid-3 store-grid'}>
						{stores.map((store, index) => (
							<StoreCard
								key={store._id}
								store={store}
								rank={
									searchFilter.sort === 'memberRank' && searchFilter.page === 1 && !searchFilter.search?.text
										? index + 1
										: undefined
								}
							/>
						))}
					</div>
				)}

				{total > searchFilter.limit && (
					<Stack className={'pagination-config'}>
						<Pagination
							page={searchFilter.page}
							count={Math.ceil(total / searchFilter.limit)}
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

export default withLayoutBasic(StoreList);
