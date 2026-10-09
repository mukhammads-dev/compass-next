import { useTranslation } from 'next-i18next';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import { PaymentMethod } from '../../enums/order.enum';
import { PaymentInput } from '../../types/order/order';
import { TEST_CARD, TEST_DECLINED_CARD } from '../../config';

interface PaymentFormProps {
	value: PaymentInput;
	onChange: (value: PaymentInput) => void;
}

const METHODS = [
	{ id: PaymentMethod.CARD, label: 'Card', icon: <CreditCardRoundedIcon /> },
	{ id: PaymentMethod.KAKAO_PAY, label: 'Kakao Pay', icon: <ChatBubbleRoundedIcon /> },
	{ id: PaymentMethod.BANK_TRANSFER, label: 'Bank transfer', icon: <AccountBalanceOutlinedIcon /> },
];

/** "4242424242424242" → "4242 4242 4242 4242" while typing. */
const formatCardNumber = (raw: string) =>
	raw
		.replace(/\D/g, '')
		.slice(0, 16)
		.replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (raw: string) => {
	const digits = raw.replace(/\D/g, '').slice(0, 4);
	return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

/** Payment is simulated: no money moves. The card is still checked like a real gateway would. */
const PaymentForm = ({ value, onChange }: PaymentFormProps) => {
	const { t } = useTranslation('common');
	const set = (patch: Partial<PaymentInput>) => onChange({ ...value, ...patch });

	return (
		<div className={'payment-form'}>
			<div className={'pay-methods'} role={'radiogroup'} aria-label={t('Payment method') as string}>
				{METHODS.map((method) => (
					<button
						key={method.id}
						type={'button'}
						role={'radio'}
						aria-checked={value.method === method.id}
						className={`${value.method === method.id ? 'active' : ''} ${method.id === PaymentMethod.KAKAO_PAY ? 'kakao' : ''}`}
						onClick={() => set({ method: method.id })}
					>
						{method.icon}
						{t(method.label)}
					</button>
				))}
			</div>

			{value.method === PaymentMethod.CARD && (
				<div className={'card-fields'}>
					<label className={'field wide'}>
						<span>{t('Card number')}</span>
						<input
							inputMode={'numeric'}
							autoComplete={'cc-number'}
							placeholder={'0000 0000 0000 0000'}
							value={value.cardNumber ?? ''}
							onChange={(e) => set({ cardNumber: formatCardNumber(e.target.value) })}
						/>
					</label>
					<label className={'field'}>
						<span>{t('Name on card')}</span>
						<input
							autoComplete={'cc-name'}
							value={value.cardHolder ?? ''}
							onChange={(e) => set({ cardHolder: e.target.value })}
						/>
					</label>
					<label className={'field'}>
						<span>{t('Expiry (MM/YY)')}</span>
						<input
							inputMode={'numeric'}
							autoComplete={'cc-exp'}
							placeholder={'MM/YY'}
							value={value.cardExpiry ?? ''}
							onChange={(e) => set({ cardExpiry: formatExpiry(e.target.value) })}
						/>
					</label>
				</div>
			)}

			{value.method === PaymentMethod.KAKAO_PAY && (
				<p className={'pay-hint'}>{t('You will confirm the payment in Kakao Pay.')}</p>
			)}
			{value.method === PaymentMethod.BANK_TRANSFER && (
				<p className={'pay-hint'}>{t('The amount is transferred from your bank account right away.')}</p>
			)}

			<div className={'test-mode'}>
				<strong>{t('Test mode')}</strong>
				<span>{t('No real money is charged.')}</span>
				{value.method === PaymentMethod.CARD && (
					<>
						<button
							type={'button'}
							onClick={() =>
								set({ cardNumber: TEST_CARD, cardExpiry: '12/30', cardHolder: value.cardHolder || 'Test Buyer' })
							}
						>
							{t('Use the test card')}
						</button>
						<small>{t('{{card}} is always declined.', { card: TEST_DECLINED_CARD })}</small>
					</>
				)}
			</div>
		</div>
	);
};

export const isPaymentReady = (value: PaymentInput): boolean =>
	value.method !== PaymentMethod.CARD ||
	(value.cardNumber?.replace(/\D/g, '').length === 16 &&
		/^(0[1-9]|1[0-2])\/\d{2}$/.test(value.cardExpiry ?? '') &&
		(value.cardHolder?.trim().length ?? 0) >= 2);

export default PaymentForm;
