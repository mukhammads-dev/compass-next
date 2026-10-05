import { useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { Notice, NoticeInput } from '../../../types/notice/notice';
import { NoticeCategory, NoticeStatus } from '../../../enums/notice.enum';

interface NoticeFormProps {
	notice?: Notice | null;
	onSubmit: (input: NoticeInput) => void;
	onCancel: () => void;
}

const toDateInput = (value?: Date) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const NoticeForm = ({ notice, onSubmit, onCancel }: NoticeFormProps) => {
	const [form, setForm] = useState<NoticeInput>({
		noticeCategory: notice?.noticeCategory ?? NoticeCategory.NOTICE,
		noticeStatus: notice?.noticeStatus ?? NoticeStatus.ACTIVE,
		noticeTitle: notice?.noticeTitle ?? '',
		noticeContent: notice?.noticeContent ?? '',
		eventStartAt: notice?.eventStartAt,
		eventEndAt: notice?.eventEndAt,
	});
	const isEvent = form.noticeCategory === NoticeCategory.EVENT;

	return (
		<Stack className={'notice-form'}>
			<Stack className={'form-grid'}>
				<TextField
					select
					label={'Category'}
					value={form.noticeCategory}
					onChange={(e) => setForm({ ...form, noticeCategory: e.target.value as NoticeCategory })}
				>
					{Object.values(NoticeCategory).map((category) => (
						<MenuItem key={category} value={category}>
							{category}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					label={'Status'}
					value={form.noticeStatus}
					onChange={(e) => setForm({ ...form, noticeStatus: e.target.value as NoticeStatus })}
				>
					{Object.values(NoticeStatus).map((status) => (
						<MenuItem key={status} value={status}>
							{status}
						</MenuItem>
					))}
				</TextField>
			</Stack>
			<TextField
				label={'Title'}
				value={form.noticeTitle}
				onChange={(e) => setForm({ ...form, noticeTitle: e.target.value })}
				fullWidth
			/>
			{isEvent && (
				<Stack className={'form-grid'}>
					<TextField
						type={'date'}
						label={'Starts'}
						InputLabelProps={{ shrink: true }}
						value={toDateInput(form.eventStartAt)}
						onChange={(e) => setForm({ ...form, eventStartAt: e.target.value ? new Date(e.target.value) : undefined })}
					/>
					<TextField
						type={'date'}
						label={'Ends'}
						InputLabelProps={{ shrink: true }}
						value={toDateInput(form.eventEndAt)}
						onChange={(e) => setForm({ ...form, eventEndAt: e.target.value ? new Date(e.target.value) : undefined })}
					/>
				</Stack>
			)}
			<TextField
				label={'Content'}
				value={form.noticeContent}
				onChange={(e) => setForm({ ...form, noticeContent: e.target.value })}
				multiline
				minRows={5}
				fullWidth
			/>
			<Stack className={'form-actions'}>
				<Button variant={'outlined'} onClick={onCancel}>
					Cancel
				</Button>
				<Button
					variant={'contained'}
					disabled={!form.noticeTitle.trim() || !form.noticeContent.trim()}
					onClick={() => onSubmit({ ...form, noticeTitle: form.noticeTitle.trim(), noticeContent: form.noticeContent.trim() })}
				>
					{notice ? 'Save' : 'Create'}
				</Button>
			</Stack>
		</Stack>
	);
};

export default NoticeForm;
