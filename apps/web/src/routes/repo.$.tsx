import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconExternalLink,
  IconFileText,
  IconInfoCircle,
  IconSearch,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import { getRepoByName } from '~server/repos';
import { RepoReadmeMarkdown } from '~components/repos/RepoReadmeMarkdown';

const repoQueryOptions = (fullName: string) =>
  queryOptions({
    queryKey: ['repo', fullName],
    queryFn: () => getRepoByName({ data: { name: fullName } }),
    staleTime: 60 * 1000,
  });

export const Route = createFileRoute('/repo/$')({
  loader: ({ context: { queryClient }, params }) => {
    const fullName = params._splat ?? '';
    return queryClient.ensureQueryData(repoQueryOptions(fullName));
  },
  component: RepoDetailPage,
  pendingComponent: () => (
    <Center py="xl">
      <Loader size="lg" />
    </Center>
  ),
});

function RepoDetailPage() {
  const { _splat } = Route.useParams();
  const fullName = _splat ?? '';

  return (
    <Suspense
      fallback={
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      }
    >
      <RepoContent fullName={fullName} />
    </Suspense>
  );
}

function RepoContent({ fullName }: { fullName: string }) {
  const router = useRouter();
  const { data: repo } = useSuspenseQuery(repoQueryOptions(fullName));

  if (!repo) {
    return (
      <Container size={960} py="4xl">
        <Center>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} variant="light" color="gray" radius="xl">
              <IconSearch size={32} stroke={1.5} />
            </ThemeIcon>
            <Title order={2}>Repository Not Found</Title>
            <Text c="dimmed">
              This repository may have been deleted or the name is incorrect
            </Text>
            <Button
              variant="default"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.history.back()}
            >
              Go Back
            </Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  const [owner, repoName] = repo.repo.split('/');

  const handleCopyRepoName = () => {
    copy(repo.repo);
    toast.success('Repository name copied');
  };

  return (
    <Container size={960} py="xl">
      <Stack gap="xl">
        <Anchor component={Link} to="/repos" c="dimmed" size="sm">
          <Flex align="center" gap={4}>
            <IconArrowLeft size={16} />
            Back to List
          </Flex>
        </Anchor>

        <Stack gap="md">
          <Flex gap="md" align="center">
            <Avatar
              src={repo.ownerAvatarUrl}
              alt={owner}
              size="lg"
              radius="sm"
            />
            <Box>
              <Title order={1} mb={4}>
                {repoName}
              </Title>
              <Text c="dimmed">{owner}</Text>
            </Box>
          </Flex>
          <Group gap="sm">
            <Button variant="default" onClick={handleCopyRepoName}>
              Copy Name
            </Button>
            <Button
              component="a"
              href={`https://github.com/${repo.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              rightSection={<IconExternalLink size={16} />}
            >
              Open on GitHub
            </Button>
          </Group>
        </Stack>

        <Text size="lg" c={repo.description ? undefined : 'dimmed'} lh={1.7}>
          {repo.description || 'No description available'}
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
              Starred At
            </Text>
            <Text fw={500}>
              {repo.starredAt
                ? dayjs(repo.starredAt).format('YYYY-MM-DD HH:mm')
                : '—'}
            </Text>
          </Card>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
              Description Updated
            </Text>
            <Text fw={500}>
              {repo.descriptionUpdatedAt
                ? dayjs(repo.descriptionUpdatedAt).format('YYYY-MM-DD HH:mm')
                : '—'}
            </Text>
          </Card>
          <Card padding="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
              README Updated
            </Text>
            <Text fw={500}>
              {repo.readmeUpdatedAt
                ? dayjs(repo.readmeUpdatedAt).format('YYYY-MM-DD HH:mm')
                : '—'}
            </Text>
          </Card>
        </SimpleGrid>

        <Tabs defaultValue="readme">
          <Tabs.List>
            <Tabs.Tab value="readme" leftSection={<IconFileText size={16} />}>
              README
            </Tabs.Tab>
            <Tabs.Tab value="info" leftSection={<IconInfoCircle size={16} />}>
              Details
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="readme" pt="md">
            <Card padding="xl" withBorder>
              {repo.readme ? (
                <Box style={{ maxHeight: 600, overflow: 'auto' }}>
                  <RepoReadmeMarkdown
                    markdown={repo.readme}
                    repoFullName={repo.repo}
                    repoDetails={repo.repoDetails}
                  />
                </Box>
              ) : (
                <Center py="xl">
                  <Text c="dimmed" fs="italic">
                    No README content available
                  </Text>
                </Center>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="info" pt="md">
            <Stack gap="lg">
              <Box>
                <Title order={4} mb="md">
                  <Flex align="center" gap="sm">
                    <IconInfoCircle size={20} />
                    Full Information
                  </Flex>
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Card padding="md" withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                      Full Name
                    </Text>
                    <Text fw={500}>{repo.repo}</Text>
                  </Card>
                  <Card padding="md" withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                      GitHub Repo ID
                    </Text>
                    <Text fw={500}>{repo.repoId ?? '—'}</Text>
                  </Card>
                  <Card padding="md" withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                      Starred At
                    </Text>
                    <Text fw={500}>
                      {repo.starredAt
                        ? dayjs(repo.starredAt).format('YYYY-MM-DD HH:mm')
                        : '—'}
                    </Text>
                  </Card>
                  <Card padding="md" withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                      Description Updated
                    </Text>
                    <Text fw={500}>
                      {repo.descriptionUpdatedAt
                        ? dayjs(repo.descriptionUpdatedAt).format(
                            'YYYY-MM-DD HH:mm',
                          )
                        : '—'}
                    </Text>
                  </Card>
                  <Card padding="md" withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                      README Updated
                    </Text>
                    <Text fw={500}>
                      {repo.readmeUpdatedAt
                        ? dayjs(repo.readmeUpdatedAt).format('YYYY-MM-DD HH:mm')
                        : '—'}
                    </Text>
                  </Card>
                  <Card padding="md" withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                      Created At
                    </Text>
                    <Text fw={500}>
                      {repo.createdAt
                        ? dayjs(repo.createdAt).format('YYYY-MM-DD HH:mm')
                        : '—'}
                    </Text>
                  </Card>
                  <Card padding="md" withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
                      Updated At
                    </Text>
                    <Text fw={500}>
                      {repo.updatedAt
                        ? dayjs(repo.updatedAt).format('YYYY-MM-DD HH:mm')
                        : '—'}
                    </Text>
                  </Card>
                </SimpleGrid>
              </Box>

              {repo.initialDescription &&
                repo.initialDescription !== repo.description && (
                  <Box>
                    <Title order={4} mb="md">
                      <Flex align="center" gap="sm">
                        Original Description
                        <Badge size="sm" variant="light">
                          Changed
                        </Badge>
                      </Flex>
                    </Title>
                    <Text lh={1.7}>{repo.initialDescription}</Text>
                  </Box>
                )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
