import type { PropsWithChildren, ReactNode } from 'react';
import { Main } from '@strapi/design-system';
import { useAuth } from '@strapi/strapi/admin';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  iconPath,
  StoreLayout,
  StorePage,
  StoreSidebar,
} from './StoreSidebar';

export const FormShell = styled(Main)`
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #292824;
  background: #f7f5f2;
  font-family: 'Priscila Inter', Inter, Arial, sans-serif;
`;

const Topbar = styled.header`
  box-sizing: border-box;
  display: flex;
  min-height: 86px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 28px;
  border-bottom: 1px solid #ece8e1;
  background: #fafafa;
`;

const Back = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #7d6645;
  font-size: 16px;
  font-weight: 650;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
`;

const Locale = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #252421;
  font-size: 14px;
  font-weight: 700;

  img {
    width: 22px;
    height: 22px;
  }
`;

const Profile = styled(Link)`
  display: flex;
  min-height: 54px;
  align-items: center;
  gap: 9px;
  padding: 6px 12px;
  border: 1px solid #ece8e1;
  border-radius: 12px;
  color: #252421;
  background: #fff;
  text-decoration: none;
`;

const Avatar = styled.span`
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 10px;
  color: #fff;
  background: #7d6645;
  font-size: 13px;
  font-weight: 750;
`;

const ProfileText = styled.span`
  display: grid;
  min-width: 116px;

  strong {
    font-size: 14px;
    font-weight: 600;
  }

  small {
    color: #777168;
    font-size: 12px;
  }
`;

export const FormWorkspace = styled.div`
  box-sizing: border-box;
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: 36px 32px 64px;

  @media (max-width: 48rem) {
    padding: 24px 18px 42px;
  }
`;

export const FormHeading = styled.header`
  margin-bottom: 30px;

  h1 {
    margin: 0 0 8px;
    color: #292824;
    font-size: clamp(28px, 3vw, 36px);
    font-weight: 650;
    line-height: 1.15;
    letter-spacing: -0.7px;
    text-wrap: balance;
  }

  p {
    max-width: 66ch;
    margin: 0;
    color: #777168;
    font-size: 15px;
    line-height: 1.65;
  }
`;

export const FormCard = styled.section`
  overflow: hidden;
  border: 1px solid #e8e2d9;
  border-radius: 14px;
  background: #fff;
`;

export const FormSection = styled.section`
  display: grid;
  gap: 24px;
  padding: 30px;

  & + & {
    border-top: 1px solid #ece8e1;
  }

  @media (max-width: 48rem) {
    padding: 22px 18px;
  }
`;

export const SectionHeading = styled.header`
  h2 {
    margin: 0;
    color: #292824;
    font-size: 20px;
    font-weight: 650;
    letter-spacing: -0.2px;
  }

  p {
    max-width: 68ch;
    margin: 7px 0 0;
    color: #777168;
    font-size: 14px;
    line-height: 1.55;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;

  @media (max-width: 48rem) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: grid;
  gap: 9px;
  min-width: 0;
  color: #292824;
  font-size: 15px;
  font-weight: 650;

  small {
    color: #817a70;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.5;
  }
`;

export const Required = styled.span`
  color: #c33d4d;
`;

const control = `
  box-sizing: border-box;
  width: 100%;
  min-height: 56px;
  padding: 14px 16px;
  border: 1px solid #d9d4cc;
  border-radius: 10px;
  outline: none;
  color: #292824;
  background: #fbfbfa;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
  &:hover { border-color: #b8aa98; }
  &:focus { border-color: #92754d; box-shadow: 0 0 0 3px rgba(146, 117, 77, .13); background: #fff; }
  &:disabled { cursor: not-allowed; color: #8b857c; background: #f1efec; }
`;

export const Input = styled.input`
  ${control}
`;

export const Textarea = styled.textarea`
  ${control}
  min-height: 130px;
  resize: vertical;
  line-height: 1.55;
`;

export const Select = styled.select`
  ${control}
  cursor: pointer;
`;

export const CheckRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 17px 18px;
  border: 1px solid #e4ddd3;
  border-radius: 11px;
  background: #fbfaf8;
  cursor: pointer;

  input {
    width: 19px;
    height: 19px;
    margin: 1px 0 0;
    accent-color: #8f7048;
  }

  strong,
  small {
    display: block;
  }

  strong {
    color: #292824;
    font-size: 15px;
  }

  small {
    margin-top: 3px;
    color: #777168;
    font-size: 13px;
    line-height: 1.45;
  }
`;

export const FormNotice = styled.div<{ $error?: boolean; $success?: boolean }>`
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid
    ${({ $error, $success }) =>
      $error ? '#efb3bb' : $success ? '#a6d7b8' : '#e0d4c3'};
  border-radius: 10px;
  color: ${({ $error, $success }) =>
    $error ? '#9f1239' : $success ? '#166534' : '#705835'};
  background: ${({ $error, $success }) =>
    $error ? '#fff4f5' : $success ? '#f0fbf4' : '#fbf7f0'};
  font-size: 14px;
  line-height: 1.5;
`;

export const FormFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 22px 30px;
  border-top: 1px solid #ece8e1;
  background: #fbfaf8;
`;

export const FormButton = styled.button<{ $primary?: boolean }>`
  min-height: 48px;
  padding: 12px 20px;
  border: 1px solid ${({ $primary }) => ($primary ? '#8f7048' : '#bca98f')};
  border-radius: 9px;
  color: ${({ $primary }) => ($primary ? '#fff' : '#755a36')};
  background: ${({ $primary }) => ($primary ? '#8f7048' : '#fff')};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 150ms ease, background-color 150ms ease;

  &:hover:not(:disabled) {
    background: ${({ $primary }) => ($primary ? '#765b38' : '#f8f3ec')};
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid rgba(143, 112, 72, 0.25);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export const SummaryList = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  border: 1px solid #e8e2d9;
  border-radius: 11px;
  background: #e8e2d9;

  div {
    min-width: 0;
    padding: 17px 18px;
    background: #fff;
  }

  dt {
    margin-bottom: 6px;
    color: #817a70;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
    color: #292824;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
  }

  @media (max-width: 42rem) {
    grid-template-columns: 1fr;
  }
`;

const initials = (first?: string, last?: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';

export function StoreFormPage({
  activeHref,
  backTo,
  backLabel,
  language,
  labelledBy,
  children,
}: PropsWithChildren<{
  activeHref: string;
  backTo: string;
  backLabel: string;
  language: 'pt' | 'fr';
  labelledBy: string;
}>) {
  const user = useAuth('StoreFormPage', (state) => state.user);
  const name =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    'Utilizador';

  return (
    <FormShell labelledBy={labelledBy}>
      <StoreLayout>
        <StoreSidebar activeHref={activeHref} />
        <StorePage>
          <Topbar>
            <Back to={backTo}>← {backLabel}</Back>
            <TopActions>
              <Locale>
                <span>{language === 'fr' ? 'FR / €' : 'PT / KZ'}</span>
                <img src={iconPath('language')} alt="" aria-hidden />
              </Locale>
              <Profile to="/store/profile">
                <Avatar>{initials(user?.firstname, user?.lastname)}</Avatar>
                <ProfileText>
                  <strong>{name}</strong>
                  <small>{user?.roles?.[0]?.name || 'Admin'}</small>
                </ProfileText>
                <span aria-hidden>⌄</span>
              </Profile>
            </TopActions>
          </Topbar>
          {children as ReactNode}
        </StorePage>
      </StoreLayout>
    </FormShell>
  );
}
