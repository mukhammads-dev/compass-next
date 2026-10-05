/** Mirror of compass-api `socket/socket.types.ts`. */
import { MemberType } from '../../enums/member.enum';

export interface ChatMember {
	_id: string;
	memberNick: string;
	memberImage: string;
	memberType: MemberType;
}

export interface ChatMessage {
	id: string;
	text: string;
	member: ChatMember;
	createdAt: string;
}

/** What the server sends; the client switches on `event`. */
export type ChatServerEvent =
	| { event: 'history'; list: ChatMessage[]; online: number }
	| { event: 'presence'; action: 'joined' | 'left'; member: ChatMember | null; online: number }
	| { event: 'message'; message: ChatMessage }
	| { event: 'error'; message: string };

/** One row in the chat window: a message, or a small "Sora joined" line. */
export type ChatEntry =
	| { kind: 'message'; id: string; message: ChatMessage }
	| { kind: 'presence'; id: string; action: 'joined' | 'left'; memberNick: string };

export type ChatStatus = 'idle' | 'connecting' | 'open' | 'reconnecting';
