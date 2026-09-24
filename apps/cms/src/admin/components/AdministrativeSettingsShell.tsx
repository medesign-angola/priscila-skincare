import type { ComponentType } from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { StorePageHeader } from './StorePageHeader';
import {
  StoreLayout,
  StorePage,
  StoreSidebar,
} from './StoreSidebar';

const Shell = styled.div`
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #292824;
  background: #f7f5f2;
  font-family: 'Priscila Inter', Inter, Arial, sans-serif;
`;

const NativeSettings = styled.section`
  min-height: calc(100dvh - 93px);
  padding: 0 0 48px;
  background: #f7f5f2;

  /* The native settings layout reserves a second sidebar. The Priscila
     navigation already provides that context, so keep only its content. */
  > div {
    grid-template-columns: minmax(0, 1fr) !important;
  }

  > div > div:has(nav[aria-label]) {
    display: none !important;
  }

  nav[aria-label='Settings'],
  nav[aria-label='Definições'],
  nav[aria-label='Paramètres'] {
    display: none !important;
  }

  [data-strapi-main-content] {
    width: 100%;
    min-width: 0;
    padding-bottom: 0 !important;
    overflow: visible;
    background: #f7f5f2;
  }

  [data-strapi-main-content] > header,
  [data-strapi-main-content] > div {
    box-sizing: border-box;
  }

  table {
    overflow: hidden;
    border: 1px solid #e8e2d9;
    border-radius: 12px;
    background: #fff;
  }

  button,
  a,
  input,
  textarea,
  select {
    font-family: inherit;
  }

  button,
  a {
    transition:
      color 160ms ease,
      background-color 160ms ease,
      border-color 160ms ease,
      transform 160ms ease;
  }

  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 3px solid rgba(143, 112, 72, 0.24);
    outline-offset: 2px;
  }
`;

export function withAdministrativeSettingsShell(
  NativeSettingsLayout: ComponentType,
) {
  function AdministrativeSettingsShell() {
    const { locale } = useIntl();
    const { pathname, search } = useLocation();
    const language = locale.toLowerCase().startsWith('fr') ? 'fr' : 'pt';

    return (
      <Shell>
        <StoreLayout>
          <StoreSidebar activeHref={`${pathname}${search}`} />
          <StorePage>
            <StorePageHeader
              id="administration-page-title"
              title={language === 'fr' ? 'Administration' : 'Administração'}
              language={language}
            />
            <NativeSettings aria-labelledby="administration-page-title">
              <NativeSettingsLayout />
            </NativeSettings>
          </StorePage>
        </StoreLayout>
      </Shell>
    );
  }

  AdministrativeSettingsShell.displayName = 'AdministrativeSettingsShell';
  return AdministrativeSettingsShell;
}
