import Link from 'next/link';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Avatar } from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import { chatEntriesVar, chatErrorVar, chatOnlineVar, chatStatusVar, userVar } from '../../apollo/store';
import { chatSocket } from '../../apollo/socket';
import { ChatEntry, ChatMessage } from '../types/chat/chat';
import { MemberType } from '../enums/member.enum';
import { DEFAULT_AVATAR, imageUrl } from '../config';

const MAX_LENGTH = 500; // mirrors CHAT_MESSAGE_MAX_LENGTH in compass-api
const GROUP_WINDOW_MS = 5 * 60 * 1000;

/** Same author within five minutes → one group: avatar and name are shown once. */
const startsGroup = (entries: ChatEntry[], index: number): boolean => {
	const current = entries[index];
	const previous = entries[index - 1];
	if (current.kind !== 'message' || previous?.kind !== 'message') return true;
	const sameAuthor = previous.message.member._id === current.message.member._id;
	const gap = Date.parse(current.message.createdAt) - Date.parse(previous.message.createdAt);
	return !sameAuthor || gap > GROUP_WINDOW_MS;
};

/**
 * Compass live chat: a floating button that opens one public room for everyone on the site.
 * Guests can read along; members write. State comes from apollo/socket.ts via reactive vars.
 */
const Chat = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const entries = useReactiveVar(chatEntriesVar);
	const online = useReactiveVar(chatOnlineVar);
	const status = useReactiveVar(chatStatusVar);
	const error = useReactiveVar(chatErrorVar);

	const [open, setOpen] = useState<boolean>(false);
	const [draft, setDraft] = useState<string>('');
	const [unread, setUnread] = useState<number>(0);
	const listRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const seenRef = useRef<string>('');

	const isMember = Boolean(user._id);
	const canSend = isMember && status === 'open' && draft.trim().length > 0;
	const lastEntry = entries[entries.length - 1];

	/** LIFECYCLES **/

	// count messages from others that arrive while the window is closed
	useEffect(() => {
		if (!lastEntry || lastEntry.id === seenRef.current) return;
		const fromOther = lastEntry.kind === 'message' && lastEntry.message.member._id !== user._id;
		if (!open && fromOther && seenRef.current) setUnread((count) => count + 1);
		seenRef.current = lastEntry.id;
	}, [lastEntry, open, user._id]);

	// stay pinned to the newest message while the reader is at the bottom (or just wrote)
	useEffect(() => {
		const list = listRef.current;
		if (!list || !open) return;
		const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
		const mine = lastEntry?.kind === 'message' && lastEntry.message.member._id === user._id;
		if (nearBottom || mine) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
	}, [lastEntry, open, user._id]);

	useEffect(() => {
		if (!open) return;
		setUnread(0);
		listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
		inputRef.current?.focus();
	}, [open]);

	/** HANDLERS **/
	const sendHandler = (event?: FormEvent) => {
		event?.preventDefault();
		if (!canSend) return;
		if (chatSocket.send(draft.trim())) setDraft('');
	};

	const keyHandler = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		// Enter sends, Shift+Enter makes a new line; ignore Enter while a Korean IME is composing
		if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
			event.preventDefault();
			sendHandler();
		}
		if (event.key === 'Escape') setOpen(false);
	};

	const renderMessage = (message: ChatMessage, groupStart: boolean) => {
		const mine = message.member._id === user._id;
		const time = moment(message.createdAt).format('HH:mm');
		const isStore = message.member.memberType === MemberType.AGENT;

		return (
			<div className={`chat-msg ${mine ? 'mine' : ''} ${groupStart ? 'group-start' : ''}`}>
				{!mine && (
					<span className={'chat-avatar'}>
						{groupStart && (
							<Link href={{ pathname: '/member', query: { memberId: message.member._id } }}>
								<Avatar src={imageUrl(message.member.memberImage, DEFAULT_AVATAR)} alt={message.member.memberNick} />
							</Link>
						)}
					</span>
				)}
				<div className={'chat-body'}>
					{groupStart && !mine && (
						<span className={'chat-author'}>
							{message.member.memberNick}
							{isStore && <em>{t('Store')}</em>}
						</span>
					)}
					<div className={'chat-bubble'}>
						<p>{message.text}</p>
						<time dateTime={message.createdAt}>{time}</time>
					</div>
				</div>
			</div>
		);
	};

	const statusText =
		status === 'open' ? t('{{count}} online', { count: online }) : status === 'idle' ? t('Offline') : t('Connecting…');

	return (
		<div className={'live-chat'}>
			{open && (
				<section
					className={'chat-panel'}
					role={'dialog'}
					aria-label={t('Live chat') as string}
					onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
				>
					<header className={'chat-head'}>
						<div>
							<h2>{t('Live chat')}</h2>
							<span className={`chat-status ${status}`}>
								<i />
								{statusText}
							</span>
						</div>
						<button className={'chat-close'} onClick={() => setOpen(false)} aria-label={t('Close') as string}>
							<CloseRoundedIcon />
						</button>
					</header>

					<div className={'chat-list'} ref={listRef} aria-live={'polite'}>
						<p className={'chat-intro'}>{t('Ask the community about furniture, sizes and stores. Be kind.')}</p>
						{entries.length === 0 && <p className={'chat-empty'}>{t('No messages yet. Say hello.')}</p>}
						{entries.map((entry, index) =>
							entry.kind === 'message' ? (
								<div key={entry.id}>{renderMessage(entry.message, startsGroup(entries, index))}</div>
							) : (
								<p key={entry.id} className={'chat-presence'}>
									{t(entry.action === 'joined' ? '{{nick}} joined' : '{{nick}} left', { nick: entry.memberNick })}
								</p>
							),
						)}
					</div>

					{isMember ? (
						<form className={'chat-compose'} onSubmit={sendHandler}>
							{error && <p className={'chat-error'}>{t(error)}</p>}
							<div className={'compose-row'}>
								<textarea
									ref={inputRef}
									rows={1}
									value={draft}
									maxLength={MAX_LENGTH}
									placeholder={t('Write a message') as string}
									onChange={(event) => {
										setDraft(event.target.value);
										if (error) chatErrorVar('');
									}}
									onKeyDown={keyHandler}
									aria-label={t('Write a message') as string}
								/>
								<button type={'submit'} disabled={!canSend} aria-label={t('Send') as string}>
									<ArrowUpwardRoundedIcon />
								</button>
							</div>
							{draft.length > MAX_LENGTH - 80 && (
								<span className={'chat-count'}>
									{draft.length}/{MAX_LENGTH}
								</span>
							)}
						</form>
					) : (
						<div className={'chat-guest'}>
							<span>{t('Log in to join the conversation.')}</span>
							<Link href={'/account/join'}>{t('Login')}</Link>
						</div>
					)}
				</section>
			)}

			<button
				className={'chat-launcher'}
				onClick={() => setOpen((value) => !value)}
				aria-label={(open ? t('Close') : t('Live chat')) as string}
				aria-expanded={open}
			>
				{open ? <CloseRoundedIcon /> : <ChatBubbleOutlineRoundedIcon />}
				{!open && unread > 0 && <span className={'chat-unread'}>{unread > 9 ? '9+' : unread}</span>}
			</button>
		</div>
	);
};

export default Chat;
