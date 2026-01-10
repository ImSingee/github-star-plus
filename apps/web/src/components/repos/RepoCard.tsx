import { Anchor, Avatar, Box, Card, Flex, Group, Text } from '@mantine/core';
import { IconExternalLink, IconStar } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { RepoListItem } from '~server/repos';

interface RepoCardProps {
  repo: RepoListItem;
  variant?: 'grid' | 'list';
}

export function RepoCard({ repo, variant = 'grid' }: RepoCardProps) {
  const [owner, repoName] = repo.repo.split('/');

  if (variant === 'list') {
    return (
      <a href={`/repo/${repo.repo}`} style={{ textDecoration: 'none' }}>
        <Card
          padding="sm"
          radius="md"
          withBorder
          style={{
            transition: 'all 0.15s ease',
            cursor: 'pointer',
          }}
          styles={{
            root: {
              '&:hover': {
                borderColor: 'var(--mantine-color-blue-6)',
              },
            },
          }}
        >
          <Flex gap="sm" align="center">
            <Avatar
              src={repo.ownerAvatarUrl}
              alt={owner}
              size="sm"
              radius="sm"
            />

            <Text fw={600} size="sm" w={180} style={{ flexShrink: 0 }} truncate>
              {repoName}
            </Text>

            <Text size="xs" c="dimmed" w={120} style={{ flexShrink: 0 }}>
              {owner}
            </Text>

            <Text size="xs" c="dimmed" flex={1} truncate miw={0}>
              {repo.description || 'No description'}
            </Text>

            {repo.starredAt && (
              <Text
                size="xs"
                c="dimmed"
                w={100}
                style={{ flexShrink: 0, textAlign: 'right' }}
              >
                <Flex align="center" gap={4} justify="flex-end">
                  <IconStar size={12} />
                  {dayjs(repo.starredAt).format('YYYY-MM-DD')}
                </Flex>
              </Text>
            )}

            <Anchor
              href={`https://github.com/${repo.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="dimmed"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              GitHub <IconExternalLink size={12} />
            </Anchor>
          </Flex>
        </Card>
      </a>
    );
  }

  return (
    <a href={`/repo/${repo.repo}`} style={{ textDecoration: 'none' }}>
      <Card
        padding="lg"
        radius="md"
        withBorder
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'all 0.15s ease',
          cursor: 'pointer',
        }}
        styles={{
          root: {
            '&:hover': {
              borderColor: 'var(--mantine-color-blue-6)',
              transform: 'translateY(-2px)',
            },
          },
        }}
      >
        <Flex gap="md" align="flex-start" mb="sm">
          <Avatar src={repo.ownerAvatarUrl} alt={owner} size="md" radius="sm" />
          <Box flex={1} miw={0}>
            <Text fw={600} size="md" truncate>
              {repoName}
            </Text>
            <Text size="sm" c="dimmed">
              {owner}
            </Text>
          </Box>
        </Flex>

        <Text
          size="sm"
          c="dimmed"
          lh={1.6}
          mb="md"
          flex={1}
          lineClamp={3}
          style={{ wordBreak: 'break-word' }}
        >
          {repo.description || 'No description'}
        </Text>

        <Group
          justify="space-between"
          mt="auto"
          pt="sm"
          style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        >
          <Text size="xs" c="dimmed">
            {repo.starredAt ? (
              <Flex align="center" gap={4}>
                <IconStar size={12} />
                {dayjs(repo.starredAt).format('YYYY-MM-DD')}
              </Flex>
            ) : (
              '—'
            )}
          </Text>

          <Anchor
            href={`https://github.com/${repo.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="dimmed"
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            GitHub <IconExternalLink size={12} />
          </Anchor>
        </Group>
      </Card>
    </a>
  );
}
