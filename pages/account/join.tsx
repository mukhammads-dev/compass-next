import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CircularProgress, Stack } from '@mui/material';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import WeekendOutlinedIcon from '@mui/icons-material/WeekendOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { logIn, signUp } from '../../libs/auth';
import { MemberType } from '../../libs/enums/member.enum';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

type Mode = 'login' | 'signup';

interface JoinForm {
	nick: string;
	password: string;
	phone: string;
	type: MemberType;
}

/** Same limits as compass-api LoginInput / MemberInput, checked before the request is sent. */
const NICK_LENGTH = { min: 3, max: 12 };
const PASSWORD_LENGTH = { min: 5, max: 12 };
const isNickValid = (nick: string) => nick.trim().length >= NICK_LENGTH.min && nick.trim().length <= NICK_LENGTH.max;
const isPasswordValid = (password: string) =>
	password.length >= PASSWORD_LENGTH.min && password.length <= PASSWORD_LENGTH.max;
const isPhoneValid = (phone: string) => phone.replace(/\D/g, '').length >= 9;

interface FieldProps {
	id: string;
	label: string;
	icon: ReactNode;
	hint?: string;
	error?: string;
	trailing?: ReactNode;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}

/** Label above, icon inside, one line of help or error below. */
const Field = ({ id, label, icon, hint, error, trailing, inputProps }: FieldProps) => (
	<div className={`join-field ${error ? 'has-error' : ''}`}>
		<label htmlFor={id}>{label}</label>
		<div className={'input-wrap'}>
			<span className={'input-icon'}>{icon}</span>
			<input id={id} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} {...inputProps} />
			{trailing}
		</div>
		{(error || hint) && (
			<span id={`${id}-help`} className={'field-help'}>
				{error || hint}
			</span>
		)}
	</div>
);

const Join: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [mode, setMode] = useState<Mode>('login');
	const [form, setForm] = useState<JoinForm>({ nick: '', password: '', phone: '', type: MemberType.USER });
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [remember, setRemember] = useState<boolean>(true);
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [formError, setFormError] = useState<string>('');

	const isSignup = mode === 'signup';

	/** LIFECYCLES **/
	// /account/join?mode=signup&type=AGENT opens sign up with the store role picked (footer "Open a store")
	useEffect(() => {
		if (router.query.mode === 'signup') setMode('signup');
		if (router.query.type === MemberType.AGENT) setForm((current) => ({ ...current, type: MemberType.AGENT }));
	}, [router.query.mode, router.query.type]);

	/** VALIDATION **/
	const errors = {
		nick: isNickValid(form.nick) ? '' : t('Use {{min}}–{{max}} characters', NICK_LENGTH),
		password: isPasswordValid(form.password) ? '' : t('Use {{min}}–{{max}} characters', PASSWORD_LENGTH),
		phone: !isSignup || isPhoneValid(form.phone) ? '' : t('Enter a valid phone number'),
	};
	const canSubmit = !errors.nick && !errors.password && !errors.phone && !submitting;
	const errorFor = (key: keyof typeof errors) => (touched[key] ? errors[key] : '');

	/** HANDLERS **/
	const changeHandler = (key: keyof JoinForm, value: string) => {
		setForm({ ...form, [key]: value });
		if (formError) setFormError('');
	};

	const switchMode = (next: Mode) => {
		setMode(next);
		setTouched({});
		setFormError('');
	};

	const submitHandler = async (e: FormEvent) => {
		e.preventDefault();
		setTouched({ nick: true, password: true, phone: true });
		if (!canSubmit) return;

		try {
			setSubmitting(true);
			const memberNick = form.nick.trim();
			if (isSignup) {
				await signUp(
					{ memberNick, memberPassword: form.password, memberPhone: form.phone.trim(), memberType: form.type },
					remember,
				);
			} else {
				await logIn({ memberNick, memberPassword: form.password }, remember);
			}
			const back = typeof router.query.back === 'string' && router.query.back.startsWith('/') ? router.query.back : '/';
			await router.push(back);
		} catch (err: any) {
			console.log('ERROR, submitHandler:', err.message);
			setFormError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Stack id={'join-page'}>
			<div className={'join-card'}>
				<header className={'join-head'}>
					<h1>{isSignup ? t('Create your account') : t('Welcome back')}</h1>
					<p>
						{isSignup
							? t('Shop real homes, share yours, or open a store.')
							: t('Log in to save rooms, follow stores and join the chat.')}
					</p>
				</header>

				<form onSubmit={submitHandler} noValidate>
					{formError && (
						<div className={'form-error'} role={'alert'}>
							<ErrorOutlineRoundedIcon fontSize={'small'} />
							<span>{t(formError)}</span>
						</div>
					)}

					{isSignup && (
						<fieldset className={'role-picker'}>
							<legend>{t('I want to')}</legend>
							<div className={'role-options'}>
								{[
									{
										value: MemberType.USER,
										icon: <WeekendOutlinedIcon />,
										title: t('Shop & share my home'),
										desc: t('Buy, sell used, post Room Tours'),
									},
									{
										value: MemberType.AGENT,
										icon: <StorefrontOutlinedIcon />,
										title: t('Open a store'),
										desc: t('List new furniture as a store'),
									},
								].map((role) => (
									<label key={role.value} className={`role-option ${form.type === role.value ? 'selected' : ''}`}>
										<input
											type={'radio'}
											name={'memberType'}
											value={role.value}
											checked={form.type === role.value}
											onChange={() => changeHandler('type', role.value)}
										/>
										<span className={'role-icon'}>{role.icon}</span>
										<strong>{role.title}</strong>
										<small>{role.desc}</small>
									</label>
								))}
							</div>
						</fieldset>
					)}

					<Field
						id={'join-nick'}
						label={t('Nickname')}
						icon={<PersonOutlineRoundedIcon />}
						error={errorFor('nick')}
						hint={isSignup ? t('Use {{min}}–{{max}} characters', NICK_LENGTH) : undefined}
						inputProps={{
							value: form.nick,
							placeholder: t('e.g. minji_home') as string,
							/* "username" made Chrome offer saved e-mail addresses; a nickname is not an e-mail.
							   Logging in still offers the nickname saved with the password. */
							name: isSignup ? 'nickname' : 'username',
							autoComplete: isSignup ? 'nickname' : 'username',
							inputMode: 'text',
							autoCapitalize: 'none',
							spellCheck: false,
							maxLength: NICK_LENGTH.max,
							onChange: (e) => changeHandler('nick', e.target.value),
							onBlur: () => setTouched({ ...touched, nick: true }),
						}}
					/>

					<Field
						id={'join-password'}
						label={t('Password')}
						icon={<LockOutlinedIcon />}
						error={errorFor('password')}
						hint={isSignup ? t('Use {{min}}–{{max}} characters', PASSWORD_LENGTH) : undefined}
						inputProps={{
							type: showPassword ? 'text' : 'password',
							value: form.password,
							placeholder: '••••••••',
							autoComplete: isSignup ? 'new-password' : 'current-password',
							maxLength: PASSWORD_LENGTH.max,
							onChange: (e) => changeHandler('password', e.target.value),
							onBlur: () => setTouched({ ...touched, password: true }),
						}}
						trailing={
							<button
								type={'button'}
								className={'peek-btn'}
								onClick={() => setShowPassword(!showPassword)}
								aria-label={(showPassword ? t('Hide password') : t('Show password')) as string}
							>
								{showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
							</button>
						}
					/>

					{isSignup && (
						<Field
							id={'join-phone'}
							label={t('Phone')}
							icon={<PhoneIphoneRoundedIcon />}
							error={errorFor('phone')}
							inputProps={{
								type: 'tel',
								value: form.phone,
								placeholder: '010-0000-0000',
								autoComplete: 'tel',
								onChange: (e) => changeHandler('phone', e.target.value),
								onBlur: () => setTouched({ ...touched, phone: true }),
							}}
						/>
					)}

					<label className={'remember'}>
						<input type={'checkbox'} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
						<span className={'box'} aria-hidden />
						<span>{t('Keep me logged in')}</span>
					</label>

					<button type={'submit'} className={'submit-btn'} disabled={!canSubmit}>
						{submitting ? (
							<CircularProgress size={22} color={'inherit'} />
						) : isSignup ? (
							t('Create account')
						) : (
							t('Log in')
						)}
					</button>
				</form>

				<p className={'switch-text'}>
					{isSignup ? t('Already have an account?') : t('New to Compass?')}{' '}
					<button type={'button'} onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
						{isSignup ? t('Log in') : t('Create an account')}
					</button>
				</p>
			</div>

			<p className={'join-trust'}>
				<ShieldOutlinedIcon fontSize={'inherit'} />
				{t('Passwords are stored encrypted.')}
			</p>
		</Stack>
	);
};

export default withLayoutBasic(Join);
