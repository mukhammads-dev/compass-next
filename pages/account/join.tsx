import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Button, CircularProgress, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { logIn, signUp } from '../../libs/auth';
import { MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

interface JoinForm {
	nick: string;
	password: string;
	phone: string;
	type: MemberType;
}

const Join: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [loginView, setLoginView] = useState<boolean>(true);
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [form, setForm] = useState<JoinForm>({ nick: '', password: '', phone: '', type: MemberType.USER });

	/** HANDLERS **/
	const changeHandler = (key: keyof JoinForm, value: string) => setForm({ ...form, [key]: value });

	const submitHandler = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const nick = form.nick.trim();
			if (!nick || !form.password || (!loginView && !form.phone.trim())) throw new Error(Message.INSERT_ALL_INPUTS);
			setSubmitting(true);

			if (loginView) await logIn({ memberNick: nick, memberPassword: form.password });
			else
				await signUp({
					memberNick: nick,
					memberPassword: form.password,
					memberPhone: form.phone.trim(),
					memberType: form.type,
				});

			const back = typeof router.query.back === 'string' && router.query.back.startsWith('/') ? router.query.back : '/';
			await router.push(back);
		} catch (err: any) {
			console.log('ERROR, submitHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Stack id={'join-page'}>
			<Stack className={'container'}>
				<Stack className={'join-card'}>
					<Stack className={'join-tabs'}>
						<button className={loginView ? 'active' : ''} onClick={() => setLoginView(true)}>
							{t('Login')}
						</button>
						<button className={!loginView ? 'active' : ''} onClick={() => setLoginView(false)}>
							{t('Sign up')}
						</button>
					</Stack>

					<form onSubmit={submitHandler}>
						<TextField
							label={t('Nickname')}
							value={form.nick}
							onChange={(e) => changeHandler('nick', e.target.value)}
							autoComplete={'username'}
							fullWidth
						/>
						<TextField
							label={t('Password')}
							type={'password'}
							value={form.password}
							onChange={(e) => changeHandler('password', e.target.value)}
							autoComplete={loginView ? 'current-password' : 'new-password'}
							fullWidth
						/>

						{!loginView && (
							<>
								<TextField
									label={t('Phone')}
									value={form.phone}
									onChange={(e) => changeHandler('phone', e.target.value)}
									placeholder={'010-0000-0000'}
									autoComplete={'tel'}
									fullWidth
								/>
								<Stack className={'type-select'}>
									<span>{t('I want to')}</span>
									<ToggleButtonGroup
										exclusive
										fullWidth
										color={'primary'}
										value={form.type}
										onChange={(_, value) => value && changeHandler('type', value)}
									>
										<ToggleButton value={MemberType.USER}>{t('Shop & share my home')}</ToggleButton>
										<ToggleButton value={MemberType.AGENT}>{t('Open a store')}</ToggleButton>
									</ToggleButtonGroup>
								</Stack>
							</>
						)}

						<Button type={'submit'} variant={'contained'} size={'large'} fullWidth disabled={submitting}>
							{submitting ? <CircularProgress size={22} color={'inherit'} /> : loginView ? t('Login') : t('Create account')}
						</Button>
					</form>

					<p className={'switch-text'}>
						{loginView ? t("Don't have an account?") : t('Already have an account?')}{' '}
						<button onClick={() => setLoginView(!loginView)}>{loginView ? t('Sign up') : t('Login')}</button>
					</p>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Join);
