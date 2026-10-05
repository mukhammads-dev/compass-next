import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html>
			<Head>
				<meta name="robots" content="index,follow" />
				<meta
					name="description"
					content="Compass — furniture and home marketplace. Shop products straight from real Room Tours, check if they fit your space, and sell your used furniture."
				/>
				<meta name="keywords" content="compass, furniture, home, interior, room tour, 집들이, 가구, 인테리어" />
				<meta name="theme-color" content="#141414" />
				<link rel="icon" href="/img/logo/favicon.svg" type="image/svg+xml" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,400..700,100&family=Manrope:wght@400;500;600;700;800&family=Noto+Serif+KR:wght@500;600&display=swap"
				/>
				{/* Pretendard: the standard Korean UI font (glyphs Manrope does not have) */}
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
				/>
				<link rel="preconnect" href="https://images.unsplash.com" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
