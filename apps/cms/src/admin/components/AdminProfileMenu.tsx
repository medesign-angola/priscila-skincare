import { useAuth } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Menu = styled.details`
  position: relative;

  &[open] > summary {
    border-color: var(--ps-border-strong);
    box-shadow: 0 8px 24px rgba(68, 53, 35, 0.08);
  }
`;

const Trigger = styled.summary`
  display: flex;
  min-height: 54px;
  cursor: pointer;
  list-style: none;
  align-items: center;
  gap: 9px;
  padding: 6px 12px;
  border: 1px solid var(--ps-border);
  border-radius: 12px;
  color: var(--ps-heading);
  background: var(--ps-surface);
  user-select: none;

  &::-webkit-details-marker {
    display: none;
  }

  &:focus-visible {
    outline: 2px solid var(--ps-accent);
    outline-offset: 2px;
  }
`;

const Avatar = styled.span`
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 10px;
  color: var(--ps-on-accent);
  background: var(--ps-accent);
  font-size: 13px;
  font-weight: 750;
`;

const Copy = styled.span`
  display: grid;
  min-width: 116px;
  text-align: left;

  strong {
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: var(--ps-text-subtle);
    font-size: 12px;
  }
`;

const Chevron = styled.span`
  margin-left: 4px;
  color: var(--ps-text-subtle);
  transition: transform 160ms ease;

  ${Menu}[open] & {
    transform: rotate(180deg);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  display: grid;
  width: 220px;
  padding: 8px;
  border: 1px solid var(--ps-border);
  border-radius: 12px;
  background: var(--ps-surface);
  box-shadow: 0 18px 42px rgba(68, 53, 35, 0.14);
`;

const MenuLink = styled(Link)`
  padding: 11px 12px;
  border-radius: 8px;
  color: var(--ps-heading);
  font-size: 14px;
  font-weight: 550;
  text-decoration: none;

  &:hover {
    color: var(--ps-accent);
    background: var(--ps-surface-muted);
  }
`;

const LogoutButton = styled.button`
  padding: 11px 12px;
  cursor: pointer;
  border: 0;
  border-top: 1px solid var(--ps-border);
  border-radius: 0 0 8px 8px;
  color: var(--ps-danger-text);
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-align: left;

  &:hover {
    background: var(--ps-danger-bg);
  }
`;

const initials = (first?: string, last?: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';

export function AdminProfileMenu() {
  const { locale } = useIntl();
  const navigate = useNavigate();
  const user = useAuth('AdminProfileMenu', (state) => state.user);
  const logout = useAuth('AdminProfileMenu.logout', (state) => state.logout);
  const isFrench = locale.toLowerCase().startsWith('fr');
  const name =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    (isFrench ? 'Utilisateur' : 'Utilizador');

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <Menu data-profile-menu>
      <Trigger aria-label={isFrench ? 'Menu du profil' : 'Menu do perfil'}>
        <Avatar>{initials(user?.firstname, user?.lastname)}</Avatar>
        <Copy>
          <strong>{name}</strong>
          <small>{user?.roles?.[0]?.name || 'Admin'}</small>
        </Copy>
        <Chevron aria-hidden>⌄</Chevron>
      </Trigger>
      <Dropdown>
        <MenuLink to="/store/profile">
          {isFrench ? 'Mon profil' : 'O meu perfil'}
        </MenuLink>
        <LogoutButton type="button" onClick={() => void handleLogout()}>
          {isFrench ? 'Se déconnecter' : 'Terminar sessão'}
        </LogoutButton>
      </Dropdown>
    </Menu>
  );
}
