import { useRef, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { iconPath } from './StoreSidebar';

type ContentLocale = 'pt' | 'fr';

const Switcher = styled.details.attrs({
  'data-store-select': '',
})`
  position: relative;

  summary {
    display: inline-flex;
    min-height: 40px;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border-radius: 8px;
    color: #1a1917;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.28px;
    cursor: pointer;
    list-style: none;
    text-transform: uppercase;
  }

  summary::-webkit-details-marker { display: none; }
  summary:hover,
  &[open] summary { background: #f0ece6; }
  summary img { width: 24px; height: 24px; }
`;

const Menu = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  display: grid;
  width: 230px;
  padding: 8px;
  border: 1px solid #e5ded4;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 16px 38px rgba(47, 48, 58, 0.16);

  strong {
    padding: 8px 10px 6px;
    color: #716b63;
    font-size: 12px;
    font-weight: 600;
  }

  button {
    display: flex;
    min-height: 42px;
    align-items: center;
    justify-content: space-between;
    padding: 9px 10px;
    border: 0;
    border-radius: 8px;
    color: #312f2b;
    background: transparent;
    font: inherit;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
  }

  button:hover,
  button[aria-current='true'] { background: #f4efe7; }
  button:disabled { cursor: wait; opacity: 0.65; }
  button span:last-child { color: #7d6645; font-weight: 700; }

  .locale-error {
    padding: 6px 10px;
    color: #b42318;
    font-size: 12px;
    line-height: 1.35;
  }
`;

export function ContentLocaleSwitcher({
  fallbackLocale = 'pt',
}: {
  fallbackLocale?: ContentLocale;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const { put } = useFetchClient();
  const { locale: interfaceLocale } = useIntl();
  const [searchParams] = useSearchParams();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const frenchInterface = interfaceLocale.toLowerCase().startsWith('fr');
  const requestedLocale =
    searchParams.get('locale') ||
    searchParams.get('plugins[i18n][locale]');
  const contentLocale: ContentLocale =
    requestedLocale === 'fr'
      ? 'fr'
      : requestedLocale === 'pt'
        ? 'pt'
        : fallbackLocale;

  const selectLocale = async (locale: ContentLocale) => {
    if (switching) return;
    const next = new URLSearchParams(searchParams);
    next.set('locale', locale);
    next.delete('plugins[i18n][locale]');
    if (detailsRef.current) detailsRef.current.open = false;
    if (
      locale === contentLocale &&
      interfaceLocale.toLowerCase().startsWith(locale)
    )
      return;

    setSwitching(true);
    setSwitchError(null);
    try {
      // A preferência do utilizador controla o idioma real do painel Strapi.
      // A query controla simultaneamente a localização dos conteúdos.
      await put('/admin/users/me', { preferedLanguage: locale });
      window.localStorage.setItem('strapi-admin-language', locale);
      const target = new URL(window.location.href);
      target.search = next.toString();
      window.location.assign(target.toString());
    } catch {
      setSwitchError(
        frenchInterface
          ? "Impossible de changer la langue. Réessayez."
          : 'Não foi possível alterar o idioma. Tente novamente.',
      );
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Switcher ref={detailsRef}>
      <summary
        aria-label={
          frenchInterface
            ? "Sélectionner la langue du panneau et du contenu"
            : 'Selecionar idioma do painel e do conteúdo'
        }
      >
        <span>{contentLocale === 'fr' ? 'FR / €' : 'PT / KZ'}</span>
        <img src={iconPath('language')} alt="" aria-hidden />
      </summary>
      <Menu role="menu">
        <strong>
          {frenchInterface
            ? 'Langue du panneau et du contenu'
            : 'Idioma do painel e do conteúdo'}
        </strong>
        {switchError && <span className="locale-error">{switchError}</span>}
        <button
          type="button"
          role="menuitem"
          aria-current={contentLocale === 'pt'}
          disabled={switching}
          onClick={() => void selectLocale('pt')}
        >
          <span>{frenchInterface ? 'Portugais' : 'Português'}</span>
          <span>PT / KZ</span>
        </button>
        <button
          type="button"
          role="menuitem"
          aria-current={contentLocale === 'fr'}
          disabled={switching}
          onClick={() => void selectLocale('fr')}
        >
          <span>Français</span>
          <span>FR / €</span>
        </button>
      </Menu>
    </Switcher>
  );
}
