import { useRouter } from 'next/router';
import { useEffect } from 'react';

/** /admin is a friendly alias: the admin panel lives under /_admin (Nestar convention). */
const AdminAlias = () => {
	const router = useRouter();
	useEffect(() => {
		router.replace('/_admin/users').then();
	}, [router]);
	return null;
};

export default AdminAlias;
