import type { ChatEntry, ChatServerEvent } from '../libs/types/chat/chat';
import { chatEntriesVar, chatErrorVar, chatOnlineVar, chatStatusVar } from './store';

/**
 * Live chat connection (compass-api SocketGateway, plain WebSocket — no GraphQL subscriptions).
 *
 * One socket per browser tab. The JWT goes in the URL (?token=) because browsers cannot set
 * headers on a WebSocket; without a token the tab joins as a guest and can only read.
 * Incoming events are written to reactive vars in ./store, so any component can render them.
 * Unexpected drops reconnect with backoff (1s, 2s, 4s … up to 15s).
 */

const WS_URL = process.env.REACT_APP_API_WS ?? 'ws://localhost:3007';
const MAX_ENTRIES = 120;
const MAX_BACKOFF_MS = 15_000;

class ChatSocket {
	private socket: WebSocket | null = null;
	private token = '';
	private retries = 0;
	private retryTimer: ReturnType<typeof setTimeout> | null = null;

	/** Opens (or re-opens with a new token). Calling it again with the same token is a no-op. */
	public connect(token: string): void {
		if (typeof window === 'undefined') return;
		if (this.socket && this.token === token) return;

		this.close();
		this.token = token;
		this.open();
	}

	/** Returns false when the socket is not open (the UI keeps the draft). */
	public send(text: string): boolean {
		if (this.socket?.readyState !== WebSocket.OPEN) return false;
		this.socket.send(JSON.stringify({ event: 'message', data: text }));
		return true;
	}

	private open(): void {
		const url = this.token ? `${WS_URL}?token=${encodeURIComponent(this.token)}` : WS_URL;
		chatStatusVar(this.retries ? 'reconnecting' : 'connecting');

		const socket = new WebSocket(url);
		this.socket = socket;

		socket.onopen = () => {
			this.retries = 0;
			chatStatusVar('open');
		};
		socket.onmessage = (message: MessageEvent<string>) => this.handle(message.data);
		socket.onclose = () => {
			// a socket we replaced or closed on purpose must not trigger a reconnect
			if (this.socket !== socket) return;
			this.socket = null;
			this.scheduleReconnect();
		};
	}

	private close(): void {
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = null;
		this.retries = 0;
		const socket = this.socket;
		this.socket = null;
		socket?.close();
	}

	private scheduleReconnect(): void {
		const delay = Math.min(1000 * 2 ** this.retries, MAX_BACKOFF_MS);
		this.retries += 1;
		chatStatusVar('reconnecting');
		this.retryTimer = setTimeout(() => this.open(), delay);
	}

	private handle(raw: string): void {
		let data: ChatServerEvent;
		try {
			data = JSON.parse(raw) as ChatServerEvent;
		} catch {
			return;
		}

		switch (data.event) {
			case 'history':
				chatOnlineVar(data.online);
				chatEntriesVar(data.list.map((message) => ({ kind: 'message', id: message.id, message })));
				break;
			case 'presence':
				chatOnlineVar(data.online);
				// guests only change the counter; members get a small "joined / left" line
				if (data.member) {
					this.append({
						kind: 'presence',
						id: `${data.action}-${data.member._id}-${Date.now()}`,
						action: data.action,
						memberNick: data.member.memberNick,
					});
				}
				break;
			case 'message':
				this.append({ kind: 'message', id: data.message.id, message: data.message });
				break;
			case 'error':
				chatErrorVar(data.message);
				break;
		}
	}

	private append(entry: ChatEntry): void {
		chatEntriesVar([...chatEntriesVar(), entry].slice(-MAX_ENTRIES));
	}
}

/** The single connection the app uses. Drive it with useChatSocket(); send with chatSocket.send(). */
export const chatSocket = new ChatSocket();
