import Swal from 'sweetalert2';

const PRIMARY = '#141414';
const MUTED = '#B7BDB9';

export const sweetMixinErrorAlert = async (msg: string, duration: number = 3000) => {
	await Swal.fire({ icon: 'error', title: msg, showConfirmButton: false, timer: duration });
};

export const sweetMixinSuccessAlert = async (msg: string, duration: number = 2000) => {
	await Swal.fire({ icon: 'success', title: msg, showConfirmButton: false, timer: duration });
};

export const sweetTopSmallSuccessAlert = async (msg: string, duration: number = 2000) => {
	const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: duration });
	await Toast.fire({ icon: 'success', title: msg });
};

export const sweetConfirmAlert = async (msg: string): Promise<boolean> => {
	const response = await Swal.fire({
		icon: 'question',
		text: msg,
		showCancelButton: true,
		confirmButtonColor: PRIMARY,
		cancelButtonColor: MUTED,
	});
	return Boolean(response?.isConfirmed);
};
