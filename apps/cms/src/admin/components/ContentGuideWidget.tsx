import { Box, Flex, Typography } from '@strapi/design-system';
import { CheckCircle } from '@strapi/icons';

const steps = [
  'Use nomes claros e confirme sempre as duas línguas.',
  'Prefira imagens WebP e vídeos otimizados para a web.',
  'Revise a pré-visualização antes de publicar alterações.',
];

export default function ContentGuideWidget() {
  return (
    <Box padding={1}>
      <Typography tag="p" textColor="neutral600">
        Três cuidados para manter a loja consistente.
      </Typography>
      <Flex direction="column" alignItems="stretch" gap={3} paddingTop={4}>
        {steps.map((step) => (
          <Flex key={step} gap={3} alignItems="flex-start">
            <Box paddingTop={1} textColor="primary600"><CheckCircle aria-hidden /></Box>
            <Typography>{step}</Typography>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
