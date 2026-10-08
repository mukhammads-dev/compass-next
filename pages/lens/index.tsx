import { NextPage } from 'next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack } from '@mui/material';
import CenterFocusWeakRoundedIcon from '@mui/icons-material/CenterFocusWeakRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import LensStage, { LensPick } from '../../libs/components/lens/LensStage';
import LensResults from '../../libs/components/lens/LensResults';
import usePhotoPicker from '../../libs/hooks/usePhotoPicker';
import { lensPhotoVar } from '../../apollo/store';
import { LENS_REGION } from '../../apollo/user/query';
import { searchPhoto } from '../../libs/upload';
import { LENS_TAP_SIZE } from '../../libs/config';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

type Status = 'idle' | 'scanning' | 'done' | 'error';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Compass Lens: shop the furniture in your own room photo.
 * The photo arrives from the home hero (lensPhotoVar) or is picked, dropped or pasted here.
 */
const Lens: NextPage = () => {
	const { t } = useTranslation('common');
	const client = useApolloClient();
	const handedOver = useReactiveVar(lensPhotoVar);
	const [photo, setPhoto] = useState<string>('');
	const [image, setImage] = useState<string>('');
	const [picks, setPicks] = useState<LensPick[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>('idle');
	const [error, setError] = useState<string>('');
	const taps = useRef<number>(0);
	const previewUrl = useRef<string>('');

	/** HANDLERS **/
	const searchHandler = useCallback(async (file: File) => {
		// the local preview shows at once; boxes from the server are relative, so they fit it as well
		if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
		previewUrl.current = URL.createObjectURL(file);
		setPhoto(previewUrl.current);
		setImage('');
		setPicks([]);
		setSelectedId(null);
		setError('');
		setStatus('scanning');

		try {
			const result = await searchPhoto(file);
			const found: LensPick[] = result.finds.map((find, index) => ({ ...find, id: `find-${index}` }));
			setImage(result.image);
			setPicks(found);
			setSelectedId((found.find((pick) => pick.products.length) ?? found[0])?.id ?? null);
			setStatus('done');
		} catch (err: any) {
			console.log('ERROR, searchHandler:', err.message);
			setError(err.message);
			setStatus('error');
		}
	}, []);

	const { open, dragging, dropProps, inputProps } = usePhotoPicker(searchHandler);

	/**
	 * A tap on something already found selects it (the smallest box under the finger).
	 * Anywhere else it searches a square around that spot, which becomes a pick like any other.
	 */
	const tapHandler = async (x: number, y: number) => {
		if (status !== 'done' || !image) return;
		const under = picks
			.filter((pick) => !pick.loading && x >= pick.x && x <= pick.x + pick.w && y >= pick.y && y <= pick.y + pick.h)
			.sort((a, b) => a.w * a.h - b.w * b.h)[0];
		if (under) {
			setSelectedId(under.id);
			return;
		}
		const box = {
			x: clamp(x - LENS_TAP_SIZE / 2, 0, 1 - LENS_TAP_SIZE),
			y: clamp(y - LENS_TAP_SIZE / 2, 0, 1 - LENS_TAP_SIZE),
			w: LENS_TAP_SIZE,
			h: LENS_TAP_SIZE,
		};
		const id = `tap-${++taps.current}`;
		setPicks((prev) => [...prev, { ...box, id, score: 1, products: [], picked: true, loading: true }]);
		setSelectedId(id);

		try {
			const { data } = await client.query({
				query: LENS_REGION,
				variables: { input: { image, ...box } },
				fetchPolicy: 'network-only',
			});
			setPicks((prev) => prev.map((pick) => (pick.id === id ? { ...data.lensRegion, id, picked: true } : pick)));
		} catch (err: any) {
			setPicks((prev) => prev.filter((pick) => pick.id !== id));
			sweetMixinErrorAlert(err.message).then();
		}
	};

	/** LIFECYCLES **/
	useEffect(() => {
		if (!handedOver) return;
		lensPhotoVar(null);
		searchHandler(handedOver).then();
	}, [handedOver, searchHandler]);

	useEffect(
		() => () => {
			if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
		},
		[],
	);

	return (
		<Stack id={'lens-page'} className={dragging ? 'is-dragging' : ''} {...dropProps}>
			<Stack className={'container'}>
				<header className={'lens-head'}>
					<h1>{photo ? t('Shop this room') : t('Shop your photo')}</h1>
					{photo && (
						<button type={'button'} className={'btn-line'} onClick={open}>
							{t('New photo')}
						</button>
					)}
				</header>

				{!photo ? (
					<div className={'lens-drop'}>
						<CenterFocusWeakRoundedIcon className={'drop-icon'} />
						<button type={'button'} className={'lens-btn'} onClick={open}>
							{t('Choose a photo')}
						</button>
						<span>{t('or drop or paste a room photo here')}</span>
					</div>
				) : (
					<div className={'lens-layout'}>
						<div className={'lens-photo'}>
							<LensStage
								photo={photo}
								picks={picks}
								selectedId={selectedId}
								scanning={status === 'scanning'}
								onSelect={setSelectedId}
								onTap={tapHandler}
							/>
							{status === 'done' && <p className={'lens-tip'}>{t('Tap anywhere on the photo to search that spot.')}</p>}
						</div>
						<LensResults
							picks={picks}
							selectedId={selectedId}
							scanning={status === 'scanning'}
							error={error}
							onSelect={setSelectedId}
							onRetry={open}
						/>
					</div>
				)}

				<input {...inputProps} />
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Lens);
