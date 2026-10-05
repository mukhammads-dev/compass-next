import { JwtPayload } from 'jwt-decode';

/** compass-api keeps the token small: only these fields are inside the JWT. */
export interface CustomJwtPayload extends JwtPayload {
	_id: string;
	memberType: string;
	memberStatus: string;
	memberNick: string;
	memberImage?: string;
}
