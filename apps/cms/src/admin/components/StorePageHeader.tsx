import type { ReactNode } from 'react';
import styled from 'styled-components';
import { AdminProfileMenu } from './AdminProfileMenu';
import { ContentLocaleSwitcher } from './ContentLocaleSwitcher';

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
        <ContentLocaleSwitcher fallbackLocale={language} />
        <AdminProfileMenu />
      </Actions>
    </Header>
  );
}
