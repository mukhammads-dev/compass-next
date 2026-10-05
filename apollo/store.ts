import { makeVar } from '@apollo/client';

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
