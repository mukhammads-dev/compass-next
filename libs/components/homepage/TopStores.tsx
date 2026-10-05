import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { GET_AGENTS } from '../../../apollo/user/query';
import { Member } from '../../types/member/member';
import { AgentsInquiry } from '../../types/member/member.input';
import { Direction } from '../../enums/common.enum';
import { T } from '../../types/common';
import StoreCard from '../common/StoreCard';

const initialInput: AgentsInquiry = { page: 1, limit: 4, sort: 'memberRank', direction: Direction.DESC, search: {} };

const TopStores = () => {
	const { t } = useTranslation('common');
	const [stores, setStores] = useState<Member[]>([]);

	/** APOLLO REQUESTS **/
	useQuery(GET_AGENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		onCompleted: (data: T) => setStores(data?.getAgents?.list ?? []),
	});

	if (!stores.length) return null;

	return (
		<Stack className={'home-section'}>
			<Stack className={'container'}>
				<Stack className={'section-head'}>
					<div>
						<h2>{t('Top stores')}</h2>
						<p>{t('Furniture makers and shops you can follow')}</p>
					</div>
					<Link href={'/store'}>{t('See all')} <ArrowForwardIcon fontSize={'inherit'} /></Link>
				</Stack>
				<div className={'grid grid-4 store-grid'}>
					{stores.map((store: Member, index: number) => (
						<StoreCard key={store._id} store={store} rank={index + 1} />
					))}
				</div>
			</Stack>
		</Stack>
	);
};

export default TopStores;
