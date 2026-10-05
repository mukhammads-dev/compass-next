import Link from 'next/link';
import { useState } from 'react';
import { useLazyQuery, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Button, CircularProgress, MenuItem, Select, Stack } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StraightenIcon from '@mui/icons-material/Straighten';
import { userVar } from '../../../apollo/store';
import { CHECK_PRODUCT_FIT, GET_MY_ROOMS } from '../../../apollo/user/query';
import { MyRoom, ProductFit } from '../../types/my-room/my-room';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { T } from '../../types/common';

interface FitCheckProps {
	productId: string;
}

/** "Will it fit?" — compares the product size with one of the member's saved rooms (and its door). */
const FitCheck = ({ productId }: FitCheckProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [myRooms, setMyRooms] = useState<MyRoom[]>([]);
	const [myRoomId, setMyRoomId] = useState<string>('');
	const [fit, setFit] = useState<ProductFit | null>(null);

	/** APOLLO REQUESTS **/
	useQuery(GET_MY_ROOMS, {
		skip: !user._id,
		fetchPolicy: 'cache-and-network',
		onCompleted: (data: T) => {
			const rooms: MyRoom[] = data?.getMyRooms ?? [];
			setMyRooms(rooms);
			if (rooms.length && !myRoomId) setMyRoomId(rooms[0]._id);
		},
	});

	const [checkProductFit, { loading }] = useLazyQuery(CHECK_PRODUCT_FIT, { fetchPolicy: 'network-only' });

	/** HANDLERS **/
	const checkFitHandler = async () => {
		try {
			if (!myRoomId) return;
			const { data, error } = await checkProductFit({ variables: { input: { productId, myRoomId } } });
			if (error) throw error;
			setFit(data?.checkProductFit ?? null);
		} catch (err: any) {
			console.log('ERROR, checkFitHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<Stack className={'fit-check'}>
			<strong>
				<StraightenIcon fontSize={'small'} /> {t('Will it fit?')}
			</strong>

			{!user._id ? (
				<p>
					<Link href={'/account/join'}>{t('Login')}</Link> {t('and save your room size to check the fit.')}
				</p>
			) : myRooms.length === 0 ? (
				<p>
					{t('Save your room size once, then check any product.')}{' '}
					<Link href={{ pathname: '/mypage', query: { category: 'myRooms' } }}>{t('Add my room')}</Link>
				</p>
			) : (
				<>
					<Stack className={'fit-row'}>
						<Select
							size={'small'}
							value={myRoomId}
							onChange={(e) => {
								setMyRoomId(e.target.value as string);
								setFit(null);
							}}
						>
							{myRooms.map((room) => (
								<MenuItem key={room._id} value={room._id}>
									{room.myRoomName} · {room.myRoomWidth}×{room.myRoomDepth}cm
								</MenuItem>
							))}
						</Select>
						<Button variant={'outlined'} onClick={checkFitHandler} disabled={loading}>
							{loading ? <CircularProgress size={18} /> : t('Check')}
						</Button>
					</Stack>

					{fit && (
						<Stack className={`fit-result ${fit.fitsRoom && fit.fitsDoor !== false ? 'ok' : 'warn'}`}>
							<span>
								{fit.fitsRoom ? <CheckCircleOutlineIcon fontSize={'small'} /> : <ErrorOutlineIcon fontSize={'small'} />}
								{fit.fitsRoom ? t('Fits your room') : t('Too big for your room')}
							</span>
							{fit.fitsDoor !== undefined && fit.fitsDoor !== null && (
								<span>
									{fit.fitsDoor ? (
										<CheckCircleOutlineIcon fontSize={'small'} />
									) : (
										<ErrorOutlineIcon fontSize={'small'} />
									)}
									{fit.fitsDoor ? t('Goes through the door') : t('May not pass the door')}
								</span>
							)}
							{fit.warnings.map((warning) => (
								<em key={warning}>{warning}</em>
							))}
						</Stack>
					)}
				</>
			)}
		</Stack>
	);
};

export default FitCheck;
