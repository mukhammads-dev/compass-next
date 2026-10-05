import { ChangeEvent, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar, Button, Stack, TextField } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { GET_MEMBER } from '../../../apollo/user/query';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { MemberUpdate } from '../../types/member/member.update';
import { refreshSession } from '../../auth';
import { uploadImage } from '../../upload';
import { cleanObject } from '../../utils';
import { DEFAULT_AVATAR, imageUrl, validImageTypes } from '../../config';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { T } from '../../types/common';

const MyProfile = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [updateData, setUpdateData] = useState<MemberUpdate>({});
	const [uploading, setUploading] = useState<boolean>(false);

	/** APOLLO REQUESTS **/
	const [updateMember, { loading: saving }] = useMutation(UPDATE_MEMBER);

	useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { input: user._id },
		skip: !user._id,
		onCompleted: (data: T) => {
			const member = data?.getMember;
			if (!member) return;
			setUpdateData({
				memberNick: member.memberNick,
				memberPhone: member.memberPhone,
				memberFullName: member.memberFullName ?? '',
				memberImage: member.memberImage ?? '',
				memberAddress: member.memberAddress ?? '',
				memberDesc: member.memberDesc ?? '',
			});
		},
	});

	/** HANDLERS **/
	const uploadImageHandler = async (e: ChangeEvent<HTMLInputElement>) => {
		try {
			const file = e.target.files?.[0];
			if (!file) return;
			setUploading(true);
			const path = await uploadImage(file, 'member');
			setUpdateData({ ...updateData, memberImage: path });
		} catch (err: any) {
			console.log('ERROR, uploadImageHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	const updateMemberHandler = async () => {
		try {
			const input = cleanObject({ ...updateData });
			const result = await updateMember({ variables: { input } });
			refreshSession(result?.data?.updateMember);
			await sweetMixinSuccessAlert(t('Profile updated') as string);
		} catch (err: any) {
			console.log('ERROR, updateMemberHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const field = (key: keyof MemberUpdate, label: string, multiline = false) => (
		<TextField
			label={t(label)}
			value={updateData[key] ?? ''}
			onChange={(e) => setUpdateData({ ...updateData, [key]: e.target.value })}
			multiline={multiline}
			minRows={multiline ? 3 : undefined}
			fullWidth
		/>
	);

	return (
		<Stack className={'my-section'}>
			<h2>{t('Profile')}</h2>
			<Stack className={'profile-form'}>
				<Stack className={'avatar-upload'}>
					<Avatar src={imageUrl(updateData.memberImage, DEFAULT_AVATAR)} sx={{ width: 96, height: 96 }} />
					<Button component={'label'} variant={'outlined'} disabled={uploading}>
						{uploading ? t('Uploading...') : t('Change photo')}
						<input hidden type={'file'} accept={validImageTypes} onChange={uploadImageHandler} />
					</Button>
				</Stack>
				<Stack className={'form-grid'}>
					{field('memberNick', 'Nickname')}
					{field('memberPhone', 'Phone')}
					{field('memberFullName', user.memberType === 'AGENT' ? 'Store name' : 'Full name')}
					{field('memberAddress', 'Address')}
				</Stack>
				{field('memberDesc', 'About', true)}
				<Stack className={'form-actions'}>
					<Button variant={'contained'} onClick={updateMemberHandler} disabled={saving || uploading}>
						{t('Save')}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default MyProfile;
