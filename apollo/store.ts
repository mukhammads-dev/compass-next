import { makeVar } from '@apollo/client';
import type { ChatEntry, ChatStatus } from '../libs/types/chat/chat';

/** The signed-in member as the UI needs it. Empty _id means guest. */
export interface AuthUser {
	_id: string;
	memberType: string;
	memberStatus: string;
	memberNick: string;
	memberImage: string;
	memberPoints?: number;
}

export const emptyUser: AuthUser = {
	_id: '',
	memberType: '',
	memberStatus: '',
	memberNick: '',
	memberImage: '',
};

// REACTIVE VARIABLE: created once, read with useReactiveVar(userVar) anywhere.
export const userVar = makeVar<AuthUser>(emptyUser);

/* ---- live chat (filled by apollo/socket.ts, read by the LiveChat widget) ---- */

/** Messages and join/leave lines, oldest first. */
export const chatEntriesVar = makeVar<ChatEntry[]>([]);
/** Open connections on the server, guests included. */
export const chatOnlineVar = makeVar<number>(0);
export const chatStatusVar = makeVar<ChatStatus>('idle');
/** The last error the server sent to this connection (cleared when the user types). */
export const chatErrorVar = makeVar<string>('');
