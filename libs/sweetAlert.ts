import Swal, { SweetAlertOptions } from 'sweetalert2';
import { i18n } from 'next-i18next';
import { Message } from './enums/common.enum';

/**
 * Compass popups.
 * - Errors and saved-messages are a small pill at the top: they inform, they do not block.
 * - Only two things open a real dialog: "are you sure?" and "log in first".
 * Look and feel live in scss/pc/common/popup.scss (classes cp-*), icons are drawn here.
 */

const tr = (text: string): string => (i18n?.t ? (i18n.t(text) as string) : text);

const ICON = {
	error:
		'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.1"/></svg>',
	success:
		'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16 9.6"/></svg>',
	question:
		'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8v.3M12 16.6v.1"/></svg>',
	lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
};

const pill = (kind: 'error' | 'success', msg: string, duration: number) =>
	Swal.fire({
		toast: true,
		position: 'top',
		showConfirmButton: false,
		timer: duration,
		timerProgressBar: false,
		iconHtml: ICON[kind],
		icon: kind,
		title: tr(msg),
		showClass: { popup: 'cp-in' },
		hideClass: { popup: 'cp-out' },
		customClass: { popup: `cp-pill cp-${kind}`, icon: 'cp-icon', title: 'cp-pill-text' },
		didOpen: (popup) => {
			popup.addEventListener('mouseenter', Swal.stopTimer);
			popup.addEventListener('mouseleave', Swal.resumeTimer);
		},
	});

const dialog = (options: SweetAlertOptions) =>
	Swal.fire({
		buttonsStyling: false,
		reverseButtons: true,
		focusCancel: false,
		showClass: { popup: 'cp-in' },
		hideClass: { popup: 'cp-out' },
		...options,
		customClass: {
			popup: 'cp-dialog',
			icon: 'cp-icon',
			title: 'cp-title',
			htmlContainer: 'cp-text',
			actions: 'cp-actions',
			confirmButton: 'cp-btn cp-btn-primary',
			cancelButton: 'cp-btn cp-btn-ghost',
		},
	});

/** "Log in first" gets a way forward, not just a red cross. */
const loginPrompt = async () => {
	const response = await dialog({
		icon: 'info',
		iconHtml: ICON.lock,
		title: tr('Log in to continue'),
		text: tr('Save pieces, follow stores and keep a cart with a free Compass account.'),
		showCancelButton: true,
		confirmButtonText: tr('Log in'),
		cancelButtonText: tr('Not now'),
	});
	if (response.isConfirmed) {
		const back = encodeURIComponent(window.location.pathname + window.location.search);
		window.location.href = `/account/join?back=${back}`;
	}
};

export const sweetMixinErrorAlert = async (msg: string, duration: number = 3200) => {
	if (msg === Message.NOT_AUTHENTICATED) return loginPrompt();
	await pill('error', msg, duration);
};

export const sweetMixinSuccessAlert = async (msg: string, duration: number = 1800) => {
	await pill('success', msg, duration);
};

export const sweetTopSmallSuccessAlert = async (msg: string, duration: number = 1600) => {
	await pill('success', msg, duration);
};

export const sweetConfirmAlert = async (msg: string): Promise<boolean> => {
	const response = await dialog({
		icon: 'question',
		iconHtml: ICON.question,
		text: msg,
		showCancelButton: true,
		confirmButtonText: tr('Yes, continue'),
		cancelButtonText: tr('Cancel'),
	});
	return Boolean(response?.isConfirmed);
};
