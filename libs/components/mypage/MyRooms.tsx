import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import StraightenIcon from '@mui/icons-material/Straighten';
import { GET_MY_ROOMS } from '../../../apollo/user/query';
import { SAVE_MY_ROOM, UPDATE_MY_ROOM } from '../../../apollo/user/mutation';
import { MyRoom, MyRoomInput } from '../../types/my-room/my-room';
import { MyRoomStatus } from '../../enums/my-room.enum';
import { ProductRoom, ProductStyle } from '../../enums/product.enum';
import { Message } from '../../enums/common.enum';
import { productRooms, productStyles } from '../../config';
import { cleanObject, enumLabel, formatPrice } from '../../utils';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import NoData from '../common/NoData';
import { T } from '../../types/common';

const MAX_MY_ROOMS = 5;

type NumberKey = 'myRoomWidth' | 'myRoomDepth' | 'myRoomHeight' | 'myRoomDoorWidth' | 'myRoomDoorHeight' | 'myRoomBudget';

const emptyRoom: MyRoomInput = {
	myRoomName: '',
	myRoomType: ProductRoom.LIVING,
	myRoomWidth: 0,
	myRoomDepth: 0,
	myRoomHeight: undefined,
	myRoomDoorWidth: undefined,
	myRoomDoorHeight: undefined,
	myRoomStyle: undefined,
	myRoomBudget: undefined,
};

/** Saved room sizes: used by "Fits my space" in the shop filter and "Will it fit?" on product pages. */
const MyRooms = () => {
	const { t } = useTranslation('common');
	const [myRooms, setMyRooms] = useState<MyRoom[]>([]);
	const [roomForm, setRoomForm] = useState<MyRoomInput>(emptyRoom);
	const [editingId, setEditingId] = useState<string>('');
	const [formOpen, setFormOpen] = useState<boolean>(false);

	/** APOLLO REQUESTS **/
	const [saveMyRoom, { loading: saving }] = useMutation(SAVE_MY_ROOM);
	const [updateMyRoom, { loading: updating }] = useMutation(UPDATE_MY_ROOM);

	const { refetch: getMyRoomsRefetch } = useQuery(GET_MY_ROOMS, {
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => setMyRooms(data?.getMyRooms ?? []),
	});

	/** HANDLERS **/
	const reload = async () => {
		const { data } = await getMyRoomsRefetch();
		setMyRooms(data?.getMyRooms ?? []);
	};

	const setNumber = (key: NumberKey, value: string) => {
		const parsed = parseInt(value, 10);
		const next = Number.isNaN(parsed) ? undefined : Math.max(0, parsed);
		setRoomForm({ ...roomForm, [key]: key === 'myRoomWidth' || key === 'myRoomDepth' ? next ?? 0 : next });
	};

	const openFormHandler = (room?: MyRoom) => {
		setEditingId(room?._id ?? '');
		setRoomForm(
			room
				? {
						myRoomName: room.myRoomName,
						myRoomType: room.myRoomType,
						myRoomWidth: room.myRoomWidth,
						myRoomDepth: room.myRoomDepth,
						myRoomHeight: room.myRoomHeight ?? undefined,
						myRoomDoorWidth: room.myRoomDoorWidth ?? undefined,
						myRoomDoorHeight: room.myRoomDoorHeight ?? undefined,
						myRoomStyle: room.myRoomStyle ?? undefined,
						myRoomBudget: room.myRoomBudget ?? undefined,
				  }
				: emptyRoom,
		);
		setFormOpen(true);
	};

	const saveRoomHandler = async () => {
		try {
			if (!roomForm.myRoomName.trim() || roomForm.myRoomWidth <= 0 || roomForm.myRoomDepth <= 0) {
				throw new Error(Message.INSERT_ALL_INPUTS);
			}
			const input = cleanObject({ ...roomForm, myRoomName: roomForm.myRoomName.trim() });
			if (editingId) await updateMyRoom({ variables: { input: { ...input, _id: editingId } } });
			else await saveMyRoom({ variables: { input } });
			setFormOpen(false);
			await reload();
			await sweetTopSmallSuccessAlert(t('Room saved') as string, 800);
		} catch (err: any) {
			console.log('ERROR, saveRoomHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const removeRoomHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert(t('Delete this room?') as string))) return;
			await updateMyRoom({ variables: { input: { _id: id, myRoomStatus: MyRoomStatus.DELETE } } });
			await reload();
		} catch (err: any) {
			console.log('ERROR, removeRoomHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const number = (key: NumberKey, label: string) => (
		<TextField
			type={'number'}
			label={t(label)}
			value={roomForm[key] || ''}
			onChange={(e) => setNumber(key, e.target.value)}
			inputProps={{ min: 0 }}
			fullWidth
		/>
	);

	return (
		<Stack className={'my-section'}>
			<Stack className={'section-title'}>
				<h2>{t('My rooms')}</h2>
				{myRooms.length < MAX_MY_ROOMS && !formOpen && (
					<Button variant={'contained'} onClick={() => openFormHandler()}>
						{t('Add room')}
					</Button>
				)}
			</Stack>
			<p className={'muted'}>
				{t('Save the size of your rooms once. Compass will tell you if a product fits — and if it goes through the door.')}
			</p>

			{formOpen && (
				<Stack className={'room-form'}>
					<Stack className={'form-grid'}>
						<TextField
							label={t('Room name')}
							value={roomForm.myRoomName}
							onChange={(e) => setRoomForm({ ...roomForm, myRoomName: e.target.value })}
							placeholder={t('e.g. My studio living room') as string}
							fullWidth
						/>
						<TextField
							select
							label={t('Room')}
							value={roomForm.myRoomType}
							onChange={(e) => setRoomForm({ ...roomForm, myRoomType: e.target.value as ProductRoom })}
						>
							{productRooms.map((room) => (
								<MenuItem key={room} value={room}>
									{t(enumLabel(room))}
								</MenuItem>
							))}
						</TextField>
					</Stack>
					<strong>{t('Free space (cm)')}</strong>
					<Stack className={'form-grid three'}>
						{number('myRoomWidth', 'Width')}
						{number('myRoomDepth', 'Depth')}
						{number('myRoomHeight', 'Height')}
					</Stack>
					<strong>{t('Door (cm)')}</strong>
					<Stack className={'form-grid'}>
						{number('myRoomDoorWidth', 'Door width')}
						{number('myRoomDoorHeight', 'Door height')}
					</Stack>
					<Stack className={'form-grid'}>
						<TextField
							select
							label={t('Style')}
							value={roomForm.myRoomStyle ?? ''}
							onChange={(e) =>
								setRoomForm({ ...roomForm, myRoomStyle: (e.target.value || undefined) as ProductStyle | undefined })
							}
						>
							<MenuItem value={''}>—</MenuItem>
							{productStyles.map((style) => (
								<MenuItem key={style} value={style}>
									{t(enumLabel(style))}
								</MenuItem>
							))}
						</TextField>
						{number('myRoomBudget', 'Budget (₩)')}
					</Stack>
					<Stack className={'form-actions'}>
						<Button variant={'outlined'} onClick={() => setFormOpen(false)}>
							{t('Cancel')}
						</Button>
						<Button variant={'contained'} onClick={saveRoomHandler} disabled={saving || updating}>
							{t('Save')}
						</Button>
					</Stack>
				</Stack>
			)}

			{myRooms.length === 0 && !formOpen ? (
				<NoData text={'No rooms saved yet'} />
			) : (
				<Stack className={'grid grid-2'}>
					{myRooms.map((room) => (
						<Stack key={room._id} className={'room-card'}>
							<Stack className={'room-head'}>
								<StraightenIcon />
								<Stack>
									<strong>{room.myRoomName}</strong>
									<span>{t(enumLabel(room.myRoomType))}</span>
								</Stack>
							</Stack>
							<dl>
								<dt>{t('Space')}</dt>
								<dd>
									{room.myRoomWidth} × {room.myRoomDepth}
									{room.myRoomHeight ? ` × ${room.myRoomHeight}` : ''} cm
								</dd>
								{room.myRoomDoorWidth ? (
									<>
										<dt>{t('Door')}</dt>
										<dd>
											{room.myRoomDoorWidth} × {room.myRoomDoorHeight ?? 200} cm
										</dd>
									</>
								) : null}
								{room.myRoomBudget ? (
									<>
										<dt>{t('Budget')}</dt>
										<dd>{formatPrice(room.myRoomBudget)}</dd>
									</>
								) : null}
							</dl>
							<Stack className={'room-actions'}>
								<Link
									href={{
										pathname: '/product',
										query: {
											input: JSON.stringify({
												page: 1,
												limit: 12,
												sort: 'createdAt',
												direction: 'DESC',
												search: {
													roomList: [room.myRoomType],
													sizeFit: cleanObject({
														maxWidth: room.myRoomWidth,
														maxDepth: room.myRoomDepth,
														maxHeight: room.myRoomHeight,
													}),
												},
											}),
										},
									}}
								>
									<Button size={'small'} variant={'contained'}>
										{t('Shop what fits')}
									</Button>
								</Link>
								<Button size={'small'} variant={'outlined'} onClick={() => openFormHandler(room)}>
									{t('Edit')}
								</Button>
								<Button size={'small'} color={'error'} onClick={() => removeRoomHandler(room._id)}>
									{t('Delete')}
								</Button>
							</Stack>
						</Stack>
					))}
				</Stack>
			)}
		</Stack>
	);
};

export default MyRooms;
