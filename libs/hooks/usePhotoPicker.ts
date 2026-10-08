import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { LENS_MAX_PHOTO_BYTES, validImageTypes } from '../config';
import { sweetMixinErrorAlert } from '../sweetAlert';

/**
 * One photo from a file dialog, drag & drop, or paste (Ctrl/Cmd + V).
 * Spread `inputProps` on a hidden <input> and `dropProps` on the drop area.
 */
const usePhotoPicker = (onPhoto: (file: File) => void) => {
	const { t } = useTranslation('common');
	const inputRef = useRef<HTMLInputElement>(null);
	const dragDepth = useRef<number>(0);
	const [dragging, setDragging] = useState<boolean>(false);

	const accept = (file: File | undefined) => {
		if (!file) return;
		if (!validImageTypes.split(', ').includes(file.type)) {
			sweetMixinErrorAlert(t('Please choose a JPG, PNG or WEBP photo.')).then();
			return;
		}
		if (file.size > LENS_MAX_PHOTO_BYTES) {
			sweetMixinErrorAlert(t('This photo is too large. Choose one under 15 MB.')).then();
			return;
		}
		onPhoto(file);
	};

	/** LIFECYCLES **/
	useEffect(() => {
		const pasteHandler = (e: ClipboardEvent) => {
			const file = Array.from(e.clipboardData?.files ?? []).find((item) => item.type.startsWith('image/'));
			if (file) accept(file);
		};
		window.addEventListener('paste', pasteHandler);
		return () => window.removeEventListener('paste', pasteHandler);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onPhoto]);

	/** HANDLERS **/
	const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

	const dropProps = {
		onDragEnter: (e: DragEvent) => {
			if (!hasFiles(e)) return;
			e.preventDefault();
			dragDepth.current++;
			setDragging(true);
		},
		onDragOver: (e: DragEvent) => {
			if (hasFiles(e)) e.preventDefault();
		},
		onDragLeave: () => {
			dragDepth.current = Math.max(0, dragDepth.current - 1);
			if (!dragDepth.current) setDragging(false);
		},
		onDrop: (e: DragEvent) => {
			if (!hasFiles(e)) return;
			e.preventDefault();
			dragDepth.current = 0;
			setDragging(false);
			accept(e.dataTransfer.files[0]);
		},
	};

	const inputProps = {
		ref: inputRef,
		type: 'file',
		accept: validImageTypes,
		hidden: true,
		onChange: (e: ChangeEvent<HTMLInputElement>) => {
			accept(e.target.files?.[0]);
			e.target.value = ''; // the same photo can be picked again
		},
	};

	return { open: () => inputRef.current?.click(), dragging, dropProps, inputProps };
};

export default usePhotoPicker;
