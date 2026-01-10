import {
  Anchor,
  Avatar,
  Box,
  Card,
  Flex,
  Group,
  Mark,
  Text,
} from '@mantine/core';
import { IconExternalLink, IconStar } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import type { RepoListItem } from '~server/repos';

interface RepoCardProps {
  repo: RepoListItem;
  variant?: 'grid' | 'list';
  searchQuery?: string;
}

/**
 * Extracts keywords from search query for highlighting.
 * - Splits by whitespace
 * - Removes "-" prefixed exclusion terms
 * - Removes quotes from phrases
 * - Returns unique non-empty keywords
 */
function extractKeywords(query: string): Array<string> {
  if (!query.trim()) return [];

  const words = query
    .split(/\s+/)
    .filter((w) => w && !w.startsWith('-')) // ignore exclusion terms
    .map((w) => w.replace(/^["']|["']$/g, '')) // remove surrounding quotes
    .filter((w) => w.length > 0);

  return [...new Set(words)];
}

/**
 * Highlights keywords in text by wrapping matches with <Mark>.
 * Case-insensitive matching.
 */
function highlightText(text: string, keywords: Array<string>): ReactNode {
  if (!keywords.length || !text) return text;

  // Build regex pattern matching any keyword (case-insensitive)
  const escapedKeywords = keywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    // Check if this part matches any keyword (case-insensitive)
    const isMatch = keywords.some(
      (kw) => part.toLowerCase() === kw.toLowerCase(),
    );
    if (isMatch) {
      return (
        <Mark key={i} color="yellow">
          {part}
        </Mark>
      );
    }
    return part;
  });
}

export function RepoCard({
  repo,
  variant = 'grid',
  searchQuery,
}: RepoCardProps) {
  const [owner, repoName] = repo.repo.split('/');
  const keywords = searchQuery ? extractKeywords(searchQuery) : [];

  // Apply highlight to displayed text
  const displayRepoName = keywords.length
    ? highlightText(repoName, keywords)
    : repoName;
  const displayOwner = keywords.length ? highlightText(owner, keywords) : owner;
  const displayDescription = keywords.length
    ? highlightText(repo.description || 'No description', keywords)
    : repo.description || 'No description';

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
              {displayRepoName}
            </Text>

            <Text size="xs" c="dimmed" w={120} style={{ flexShrink: 0 }}>
              {displayOwner}
            </Text>

            <Text size="xs" c="dimmed" flex={1} truncate miw={0}>
              {displayDescription}
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
              {displayRepoName}
            </Text>
            <Text size="sm" c="dimmed">
              {displayOwner}
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
          {displayDescription}
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
