import axios from 'axios';
import { print } from 'graphql';
import { LENS_SEARCH } from '../apollo/user/mutation';
import { getJwtToken } from './auth/token';
import { REACT_APP_API_GRAPHQL_URL } from './config';
import { LensResult } from './types/lens/lens';

type UploadTarget = 'member' | 'product' | 'community' | 'my-room';

/**
 * Posts a GraphQL multipart request and returns its `data`.
 * The server's own message is surfaced: GraphQL errors can arrive with HTTP 400, which axios would
 * otherwise report as "Request failed with status code 400".
 */
const postMultipart = async (formData: FormData): Promise<any> => {
	const token = getJwtToken();
	try {
		const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, {
			headers: { 'apollo-require-preflight': true, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		});
		if (response.data?.errors?.length) throw new Error(response.data.errors[0].message);
		return response.data.data;
	} catch (err: any) {
		const message = err.response?.data?.errors?.[0]?.message;
		throw message ? new Error(message) : err;
	}
};

/** Uploads one image through the GraphQL multipart spec. Returns the stored path ("uploads/..."). */
export const uploadImage = async (file: File, target: UploadTarget): Promise<string> => {
	const formData = new FormData();
	formData.append(
		'operations',
		JSON.stringify({
			query: 'mutation ImageUploader($file: Upload!, $target: String!) { imageUploader(file: $file, target: $target) }',
			variables: { file: null, target },
		}),
	);
	formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
	formData.append('0', file);

	return (await postMultipart(formData)).imageUploader;
};

/** Uploads several images in one request, keeping their order. */
export const uploadImages = async (files: File[], target: UploadTarget): Promise<string[]> => {
	const formData = new FormData();
	formData.append(
		'operations',
		JSON.stringify({
			query:
				'mutation ImagesUploader($files: [Upload!]!, $target: String!) { imagesUploader(files: $files, target: $target) }',
			variables: { files: files.map(() => null), target },
		}),
	);
	const map: Record<string, string[]> = {};
	files.forEach((_, index) => (map[index] = [`variables.files.${index}`]));
	formData.append('map', JSON.stringify(map));
	files.forEach((file, index) => formData.append(String(index), file));

	return (await postMultipart(formData)).imagesUploader;
};

/** Compass Lens: uploads a room photo and returns what was found in it. Works for guests too. */
export const searchPhoto = async (file: File): Promise<LensResult> => {
	const formData = new FormData();
	formData.append('operations', JSON.stringify({ query: print(LENS_SEARCH), variables: { file: null } }));
	formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
	formData.append('0', file);

	return (await postMultipart(formData)).lensSearch;
};
