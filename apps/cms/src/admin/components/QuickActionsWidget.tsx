import { Box, Flex, Typography } from '@strapi/design-system';
import { ArrowRight, Plus } from '@strapi/icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const actions = [
  {
    label: 'Adicionar produto',
    detail: 'Cadastre imagens, preço e disponibilidade.',
    href: '/store/products/new',
    primary: true,
  },
  {
    label: 'Adicionar kit',
    detail: 'Agrupe produtos para uma nova oferta.',
    href: '/store/kits/new',
  },
  {
    label: 'Adicionar coleção',
    detail: 'Organize produtos por uma campanha ou linha.',
    href: '/store/collections/new',
  },
  {
    label: 'Editar página inicial',
    detail: 'Atualize banners, destaques e conteúdos.',
    href: '/store/home-page',
  },
] as const;

const ActionLink = styled(Link)<{ $primary?: boolean }>`
  display: flex;
  min-height: 5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid
    ${({ theme, $primary }) => ($primary ? theme.colors.primary600 : theme.colors.neutral200)};
  border-radius: 0.25rem;
  color: ${({ theme, $primary }) => ($primary ? theme.colors.buttonNeutral0 : theme.colors.neutral800)};
  background: ${({ theme, $primary }) => ($primary ? theme.colors.primary600 : theme.colors.neutral0)};
  text-decoration: none;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary500};
    background: ${({ theme, $primary }) => ($primary ? theme.colors.primary700 : theme.colors.primary100)};
    transform: translateY(-0.125rem);
  }
`;

export default function QuickActionsWidget() {
  return (
    <Flex direction="column" alignItems="stretch" gap={2} padding={1}>
      {actions.map((action) => (
        <ActionLink
          key={action.label}
          to={action.href}
          $primary={action.primary}
        >
          <Flex gap={3} alignItems="center">
            {action.primary ? <Plus aria-hidden /> : null}
            <Box>
              <Typography
                tag="p"
                fontWeight="semiBold"
                textColor="currentColor"
              >
                {action.label}
              </Typography>
              <Typography
                tag="p"
                variant="pi"
                textColor={action.primary ? 'buttonNeutral0' : 'neutral600'}
              >
                {action.detail}
              </Typography>
            </Box>
          </Flex>
          <ArrowRight aria-hidden />
        </ActionLink>
      ))}
    </Flex>
  );
}
