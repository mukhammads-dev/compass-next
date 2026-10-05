import { useRouter } from 'next/router';
import { useEffect } from 'react';

/** /_admin → first admin section. */
const AdminIndex = () => {
	const router = useRouter();
	useEffect(() => {
		router.replace('/_admin/users').then();
	}, [router]);
	return null;
};

export default AdminIndex;
