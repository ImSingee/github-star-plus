import { createFileRoute } from '@tanstack/react-router';
import { Center, Container, Stack, Text, Title } from '@mantine/core';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Container size="sm" py={96}>
      <Center>
        <Stack gap="md" align="center">
          <Title order={1}>Coming soon</Title>
          <Text c="dimmed" ta="center">
            The dashboard is still under development. Check back later.
          </Text>
        </Stack>
      </Center>
    </Container>
  );
}
