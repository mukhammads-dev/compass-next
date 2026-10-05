import numeral from 'numeral';

/** 489000 → "₩489,000" */
export const formatPrice = (value: number | undefined): string => {
	return `₩${numeral(value ?? 0).format('0,0')}`;
};

/** Discount percent of a sale price, or 0 when there is no sale. */
export const discountPercent = (price: number, salePrice?: number): number => {
	if (!salePrice || salePrice >= price) return 0;
	return Math.round(((price - salePrice) / price) * 100);
};

/** ENUM_VALUE → "Enum value" for display. */
export const enumLabel = (value: string | undefined): string => {
	if (!value) return '';
	const text = value.replace(/_/g, ' ').toLowerCase();
	return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Removes empty keys so the inquiry sent to the backend stays minimal. */
export const cleanObject = <V extends object>(obj: V): V => {
	return Object.fromEntries(
		Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)),
	) as V;
};
