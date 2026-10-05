import Head from 'next/head';
import { Stack } from '@mui/material';
import useRestoreAuth from '../../hooks/useRestoreAuth';
import Top from '../Top';
import Footer from '../Footer';

/** Detail pages: navbar + footer, no banner. */
const withLayoutFull = (Component: any) => {
	const LayoutFull = (props: any) => {
		/** LIFECYCLES **/
		useRestoreAuth();

		return (
			<>
				<Head>
					<title>Compass</title>
				</Head>
				<Stack id={'pc-wrap'}>
					<Stack id={'top'}>
						<Top />
					</Stack>

					<Stack id={'main'} className={'main-full'}>
						<Component {...props} />
					</Stack>

					<Stack id={'footer'}>
						<Footer />
					</Stack>
				</Stack>
			</>
		);
	};
	return LayoutFull;
};

export default withLayoutFull;
