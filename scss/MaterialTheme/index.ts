import { ThemeOptions } from '@mui/material/styles';

const FONT = "'Manrope', 'Pretendard Variable', Pretendard, 'Apple SD Gothic Neo', sans-serif";

/** Compass light theme v2. Colors and fonts mirror scss/variables.scss. */
export const light: ThemeOptions = {
	palette: {
		mode: 'light',
		primary: { main: '#141414', dark: '#000000', contrastText: '#FFFFFF' },
		secondary: { main: '#141414', contrastText: '#FFFFFF' },
		warning: { main: '#D0843F' },
		error: { main: '#D93A2B' },
		background: { default: '#FFFFFF', paper: '#FFFFFF' },
		text: { primary: '#141414', secondary: '#6B6B6B' },
		divider: '#ECEBE8',
	},
	typography: {
		fontFamily: FONT,
		h1: { fontWeight: 800, letterSpacing: '-0.03em' },
		h2: { fontWeight: 800, letterSpacing: '-0.03em' },
		h3: { fontWeight: 700, letterSpacing: '-0.02em' },
		h4: { fontWeight: 700, letterSpacing: '-0.02em' },
		button: { textTransform: 'none', fontWeight: 700 },
	},
	shape: { borderRadius: 12 },
	components: {
		MuiButton: {
			defaultProps: { disableElevation: true },
			styleOverrides: {
				root: { borderRadius: 999, paddingInline: 20, minHeight: 40 },
				sizeLarge: { minHeight: 48, paddingInline: 26, fontSize: 15 },
				outlined: { borderColor: '#D9D7D2' },
			},
		},
		MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
		MuiOutlinedInput: {
			styleOverrides: {
				root: { background: '#FFFFFF', borderRadius: 12 },
				notchedOutline: { borderColor: '#E3E1DC' },
			},
		},
		MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, minHeight: 44 } } },
		MuiTabs: { styleOverrides: { indicator: { height: 2, borderRadius: 2 } } },
	},
};
