import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AdminProfileMenu } from './AdminProfileMenu';
import { iconPath } from './StoreSidebar';

const Header = styled.header`
  box-sizing: border-box;
  display: flex;
  min-height: 93px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 32px;
  border-bottom: 1px solid #ece8e1;
  background: #fafafa;

  @media (max-width: 48rem) {
    min-height: auto;
    align-items: flex-start;
    padding: 20px;
    flex-direction: column;
  }
`;

const Title = styled.h1`
  margin: 0;
  color: #2f303a;
  font-size: 24px;
  font-weight: 600;
  line-height: 29px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;

  @media (max-width: 48rem) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

const LanguageLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  color: #1a1917;
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  letter-spacing: 0.28px;
  text-decoration: none;
  text-transform: uppercase;

  img {
    width: 24px;
    height: 24px;
  }
`;

export function StorePageHeader({
  id,
  title,
  language,
  primaryAction,
}: {
  id: string;
  title: string;
  language: 'pt' | 'fr';
  primaryAction?: ReactNode;
}) {
  return (
    <Header>
      <Title id={id}>{title}</Title>
      <Actions>
        {primaryAction}
        <LanguageLink
          to="/store/profile"
          aria-label={language === 'fr' ? 'Modifier la langue et la devise' : 'Alterar idioma e moeda'}
        >
          <span>{language === 'fr' ? 'FR / €' : 'PT / KZ'}</span>
          <img src={iconPath('language')} alt="" aria-hidden />
        </LanguageLink>
        <AdminProfileMenu />
      </Actions>
    </Header>
  );
}
