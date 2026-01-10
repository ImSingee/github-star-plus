import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import {
  Anchor,
  AppShell,
  Box,
  Container,
  Flex,
  Group,
  Text,
} from '@mantine/core';
import { IconBook, IconHome, IconSearch } from '@tabler/icons-react';

export function AppLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Don't show layout on home page (it has its own full-screen design)
  const isHomePage = currentPath === '/';
  if (isHomePage) {
    return <Outlet />;
  }

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Flex h="100%" align="center" gap="xl">
            <Anchor
              component={Link}
              to="/"
              underline="never"
              c="inherit"
              fw={600}
            >
              <Flex align="center" gap="sm">
                <IconBook size={24} color="var(--mantine-color-blue-6)" />
                GitHub Star+
              </Flex>
            </Anchor>

            <Group gap="xs">
              <Anchor
                component={Link}
                to="/"
                underline="never"
                c={currentPath === '/' ? 'blue' : 'dimmed'}
                px="md"
                py="xs"
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  backgroundColor:
                    currentPath === '/'
                      ? 'var(--mantine-color-blue-light)'
                      : undefined,
                }}
              >
                <Flex align="center" gap={4}>
                  <IconHome size={18} />
                  Home
                </Flex>
              </Anchor>
              <Anchor
                component={Link}
                to="/repos"
                underline="never"
                c={currentPath.startsWith('/repos') ? 'blue' : 'dimmed'}
                px="md"
                py="xs"
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  backgroundColor: currentPath.startsWith('/repos')
                    ? 'var(--mantine-color-blue-light)'
                    : undefined,
                }}
              >
                <Flex align="center" gap={4}>
                  <IconSearch size={18} />
                  Repositories
                </Flex>
              </Anchor>
            </Group>
          </Flex>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <Box
        component="footer"
        py="xl"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <Container size="xl">
          <Flex justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} GitHub Star Plus
            </Text>
            <Anchor
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              c="dimmed"
            >
              GitHub
            </Anchor>
          </Flex>
        </Container>
      </Box>
    </AppShell>
  );
}
