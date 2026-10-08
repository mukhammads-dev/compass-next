import { MouseEvent } from 'react';
import { useTranslation } from 'next-i18next';
import { LensFind } from '../../types/lens/lens';
import { enumLabel } from '../../utils';

/** A find on the page: detector finds and spots the member tapped look the same. */
export interface LensPick extends LensFind {
	id: string;
	/** tapped by the member rather than found by the detector */
	picked?: boolean;
	loading?: boolean;
}

interface LensStageProps {
	photo: string;
	picks: LensPick[];
	selectedId: string | null;
	scanning: boolean;
	onSelect: (id: string) => void;
	/** tap position, 0..1 of the photo */
	onTap: (x: number, y: number) => void;
}

export const pickLabel = (pick: LensPick, t: (key: string) => string): string =>
	pick.label ? t(enumLabel(pick.label)) : t('Your pick');

const percent = (value: number) => `${value * 100}%`;

/**
 * The member's photo as a viewfinder: a pin on every find, corner brackets around the selected one.
 * While the photo is analysed a single scan line runs over it.
 */
const LensStage = ({ photo, picks, selectedId, scanning, onSelect, onTap }: LensStageProps) => {
	const { t } = useTranslation('common');
	const selected = picks.find((pick) => pick.id === selectedId);

	/** HANDLERS **/
	const tapHandler = (e: MouseEvent<HTMLDivElement>) => {
		if (scanning) return;
		const rect = e.currentTarget.getBoundingClientRect();
		onTap((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
	};

	return (
		<div className={`lens-stage ${scanning ? 'is-scanning' : ''}`} onClick={tapHandler}>
			<img src={photo} alt={t('Your room photo') as string} />

			{scanning && <span className={'scan-line'} aria-hidden />}

			{selected && !scanning && (
				<div
					className={`viewfinder ${selected.loading ? 'is-loading' : ''}`}
					style={{
						left: percent(selected.x),
						top: percent(selected.y),
						width: percent(selected.w),
						height: percent(selected.h),
					}}
					aria-hidden
				>
					<i className={'corner tl'} />
					<i className={'corner tr'} />
					<i className={'corner bl'} />
					<i className={'corner br'} />
					<b className={selected.y < 0.08 ? 'inside' : ''}>{pickLabel(selected, t)}</b>
				</div>
			)}

			{!scanning &&
				picks.map((pick) => (
					<button
						key={pick.id}
						type={'button'}
						className={`lens-pin ${pick.id === selectedId ? 'active' : ''} ${
							pick.products.length || pick.loading ? '' : 'empty'
						}`}
						style={{ left: percent(pick.x + pick.w / 2), top: percent(pick.y + pick.h / 2) }}
						onClick={(e) => {
							e.stopPropagation();
							onSelect(pick.id);
						}}
						aria-label={pickLabel(pick, t)}
						aria-pressed={pick.id === selectedId}
					/>
				))}
		</div>
	);
};

export default LensStage;
