import { useAuth } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Menu = styled.details`
  position: relative;

  &[open] > summary {
    border-color: #cdbb9f;
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
  border: 1px solid #ece8e1;
  border-radius: 12px;
  color: #252421;
  background: #fff;
  user-select: none;

  &::-webkit-details-marker {
    display: none;
  }

  &:focus-visible {
    outline: 2px solid #7d6645;
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
  color: #fff;
  background: #7d6645;
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
    color: #777168;
    font-size: 12px;
  }
`;

const Chevron = styled.span`
  margin-left: 4px;
  color: #777168;
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
  border: 1px solid #e5dfd6;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(68, 53, 35, 0.14);
`;

const MenuLink = styled(Link)`
  padding: 11px 12px;
  border-radius: 8px;
  color: #292824;
  font-size: 14px;
  font-weight: 550;
  text-decoration: none;

  &:hover {
    color: #6f5737;
    background: #f7f3ed;
  }
`;

const LogoutButton = styled.button`
  padding: 11px 12px;
  cursor: pointer;
  border: 0;
  border-top: 1px solid #eee8df;
  border-radius: 0 0 8px 8px;
  color: #9b3434;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-align: left;

  &:hover {
    background: #fff4f2;
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
