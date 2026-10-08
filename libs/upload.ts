import axios from 'axios';
import { print } from 'graphql';
import { LENS_SEARCH } from '../apollo/user/mutation';
import { getJwtToken } from './auth/token';
import { REACT_APP_API_GRAPHQL_URL } from './config';
import { LensResult } from './types/lens/lens';

type UploadTarget = 'member' | 'product' | 'article' | 'my-room';

const headers = () => ({
	'apollo-require-preflight': true,
	Authorization: `Bearer ${getJwtToken()}`,
});

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

	const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, { headers: headers() });
	if (response.data?.errors?.length) throw new Error(response.data.errors[0].message);
	return response.data.data.imageUploader;
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

	const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, { headers: headers() });
	if (response.data?.errors?.length) throw new Error(response.data.errors[0].message);
	return response.data.data.imagesUploader;
};

/** Compass Lens: uploads a room photo and returns what was found in it. Works for guests too. */
export const searchPhoto = async (file: File): Promise<LensResult> => {
	const formData = new FormData();
	formData.append('operations', JSON.stringify({ query: print(LENS_SEARCH), variables: { file: null } }));
	formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
	formData.append('0', file);

	const token = getJwtToken();
	const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, {
		headers: { 'apollo-require-preflight': true, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
	});
	if (response.data?.errors?.length) throw new Error(response.data.errors[0].message);
	return response.data.data.lensSearch;
};
