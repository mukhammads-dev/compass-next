import Link from 'next/link';

interface LogoProps {
	light?: boolean;
	href?: string;
}

/** Wordmark rendered as HTML so it uses the site font (an <img> SVG cannot load web fonts). */
const Logo = ({ light = false, href = '/' }: LogoProps) => (
	<Link href={href} className={`brand-logo ${light ? 'light' : ''}`} aria-label={'Compass home'}>
		<img src={light ? '/img/logo/mark-light.svg' : '/img/logo/mark.svg'} alt={''} />
		<span>
			compass<i>.</i>
		</span>
	</Link>
);

export default Logo;
