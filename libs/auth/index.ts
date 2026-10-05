import { jwtDecode } from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { AuthUser, emptyUser, userVar } from '../../apollo/store';
import { LOGIN, SIGN_UP } from '../../apollo/user/mutation';
import { MemberType } from '../enums/member.enum';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { LoginInput, MemberInput } from '../types/member/member.input';
import { Member } from '../types/member/member';
import { T } from '../types/common';
import { getJwtToken, removeJwtToken, setJwtToken } from './token';

export { getJwtToken } from './token';

/**
 * AUTH FLOW (compass-api keeps the JWT payload minimal):
 *   login / signup → full Member + accessToken → token to storage, Member to userVar
 *   page reload    → layout calls updateUserInfo(token) → 5 claims to userVar
 *   logout         → clear token, reset userVar, clear Apollo cache
 */

const toAuthUser = (member: Partial<Member> | CustomJwtPayload): AuthUser => ({
	_id: member._id ?? '',
	memberType: member.memberType ?? '',
	memberStatus: member.memberStatus ?? '',
	memberNick: member.memberNick ?? '',
	memberImage: member.memberImage ?? '',
	memberPoints: (member as Partial<Member>).memberPoints,
});

const applySession = (member: T | undefined): void => {
	const accessToken: string | undefined = member?.accessToken;
	if (!member || !accessToken) throw new Error('Authentication failed!');
	setJwtToken(accessToken);
	userVar(toAuthUser(member));
};

export const logIn = async (input: LoginInput): Promise<void> => {
	const apolloClient = initializeApollo();
	const result = await apolloClient.mutate({ mutation: LOGIN, variables: { input }, fetchPolicy: 'network-only' });
	applySession(result?.data?.login);
};

export const signUp = async (input: MemberInput): Promise<void> => {
	const apolloClient = initializeApollo();
	const result = await apolloClient.mutate({ mutation: SIGN_UP, variables: { input }, fetchPolicy: 'network-only' });
	applySession(result?.data?.signup);
};

/** After updateMember the backend re-issues the token with the new nick / image. */
export const refreshSession = (member: T | undefined): void => {
	if (member?.accessToken) applySession(member);
};

/** Restores the signed-in member from the stored token (page reload). Expired tokens are dropped. */
export const updateUserInfo = (jwtToken: string): boolean => {
	if (!jwtToken) return false;
	try {
		const claims = jwtDecode<CustomJwtPayload>(jwtToken);
		if (claims.exp && claims.exp * 1000 < Date.now()) {
			removeJwtToken();
			userVar(emptyUser);
			return false;
		}
		const current = userVar();
		// keep richer data (points) from the login response when it is the same member
		userVar(current._id === claims._id ? { ...current, ...toAuthUser(claims) } : toAuthUser(claims));
		return true;
	} catch (err) {
		removeJwtToken();
		userVar(emptyUser);
		return false;
	}
};

export const logOut = async (): Promise<void> => {
	removeJwtToken();
	userVar(emptyUser);
	await initializeApollo().clearStore();
};

export const isAdmin = (user: AuthUser): boolean => user.memberType === MemberType.ADMIN;
export const isAgent = (user: AuthUser): boolean => user.memberType === MemberType.AGENT;
