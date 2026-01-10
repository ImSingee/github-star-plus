import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useDebouncedValue, useIntersection } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Loader,
  Menu,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconBook,
  IconChevronDown,
  IconLayoutGrid,
  IconLayoutList,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from '@tabler/icons-react';
import { z } from 'zod';
import type { SortField, SortOrder } from '~server/repos';
import { getRepos, getReposCount } from '~server/repos';
import { RepoCard } from '~components/repos/RepoCard';

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute('/repos/')({
  validateSearch: searchSchema,
  component: ReposPage,
});

const SORT_OPTIONS: Array<{
  field: SortField;
  order: SortOrder;
  label: string;
}> = [
  { field: 'starredAt', order: 'desc', label: 'Starred (Newest)' },
  { field: 'starredAt', order: 'asc', label: 'Starred (Oldest)' },
  { field: 'repo', order: 'asc', label: 'Name (A-Z)' },
  { field: 'repo', order: 'desc', label: 'Name (Z-A)' },
];

function ReposPage() {
  const navigate = useNavigate();
  const { q: searchQuery } = Route.useSearch();
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [debouncedQuery] = useDebouncedValue(localQuery, 300);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortField>('starredAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const isInitialMount = useRef(true);

  const { ref: loadMoreRef, entry } = useIntersection({
    threshold: 0.1,
  });

  const { data: totalCount } = useQuery({
    queryKey: ['repos-count'],
    queryFn: () => getReposCount(),
    staleTime: 60 * 1000,
  });

  const {
    data: reposData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['search-repos', 'list', searchQuery ?? '', sortBy, sortOrder],
    queryFn: async ({ pageParam = 0 }) => {
      return getRepos({
        data: {
          query: searchQuery,
          limit: 30,
          offset: pageParam,
          sortBy,
          sortOrder,
        },
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 30 * 1000,
  });

  const repos = useMemo(() => {
    return reposData?.pages.flatMap((page) => page.repos) ?? [];
  }, [reposData]);

  const isFetchingMore = isFetchingNextPage;
  const hasMore = hasNextPage;

  useEffect(() => {
    if (entry?.isIntersecting && hasMore && !isFetchingMore) {
      fetchNextPage();
    }
  }, [entry?.isIntersecting, fetchNextPage, hasMore, isFetchingMore]);

  // Auto-search on debounced query change
  useEffect(() => {
    // Skip the initial mount to avoid unnecessary navigation
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const trimmed = debouncedQuery.trim();
    const currentQuery = searchQuery ?? '';

    // Only navigate if the query actually changed
    if (trimmed !== currentQuery) {
      if (trimmed) {
        navigate({ to: '/repos', search: { q: trimmed } });
      } else {
        navigate({ to: '/repos', search: {} });
      }
    }
  }, [debouncedQuery, navigate, searchQuery]);

  const handleClear = () => {
    setLocalQuery('');
  };

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.field === sortBy && o.order === sortOrder)
      ?.label ?? 'Starred (Newest)';

  return (
    <Container
      size={layout === 'list' ? 960 : 'xl'}
      py="xl"
      style={{ transition: 'max-width 0.3s ease' }}
    >
      <Stack gap="xl">
        <Box>
          <Title order={1} mb="xs">
            Repositories
          </Title>
          <Text c="dimmed">
            {totalCount?.toLocaleString() ?? '—'} starred repositories
            {searchQuery && reposData && (
              <> · {reposData.pages[0]?.total ?? 0} results found</>
            )}
          </Text>
        </Box>

        <Flex gap="md" wrap="wrap" align="center">
          <TextInput
            placeholder="Search repositories..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={18} />}
            rightSection={
              localQuery && (
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={handleClear}
                  aria-label="Clear search"
                >
                  <IconX size={14} />
                </ActionIcon>
              )
            }
            style={{ flex: 1, minWidth: 200, maxWidth: 400 }}
          />

          <Flex gap="md" ml="auto">
            <Menu shadow="md" width={180}>
              <Menu.Target>
                <Button
                  variant="default"
                  rightSection={<IconChevronDown size={14} />}
                  leftSection={
                    sortOrder === 'asc' ? (
                      <IconSortAscending size={16} />
                    ) : (
                      <IconSortDescending size={16} />
                    )
                  }
                >
                  {currentSortLabel}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {SORT_OPTIONS.map((option) => (
                  <Menu.Item
                    key={`${option.field}-${option.order}`}
                    onClick={() => handleSortChange(option.field, option.order)}
                    leftSection={
                      option.order === 'asc' ? (
                        <IconSortAscending size={14} />
                      ) : (
                        <IconSortDescending size={14} />
                      )
                    }
                    style={{
                      backgroundColor:
                        sortBy === option.field && sortOrder === option.order
                          ? 'var(--mantine-color-blue-light)'
                          : undefined,
                    }}
                  >
                    {option.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>

            <SegmentedControl
              value={layout}
              onChange={(v) => setLayout(v as 'grid' | 'list')}
              data={[
                {
                  value: 'grid',
                  label: <IconLayoutGrid size={16} />,
                },
                {
                  value: 'list',
                  label: <IconLayoutList size={16} />,
                },
              ]}
            />
          </Flex>
        </Flex>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} height={180} radius="md" />
            ))}
          </SimpleGrid>
        ) : repos.length === 0 ? (
          <Center py="4xl">
            <Stack align="center" gap="md">
              <ThemeIcon size={64} variant="light" color="gray" radius="xl">
                <IconBook size={32} stroke={1.5} />
              </ThemeIcon>
              <Title order={3}>
                {searchQuery
                  ? 'No matching repositories found'
                  : 'No starred repositories yet'}
              </Title>
              <Text c="dimmed">
                {searchQuery
                  ? 'Try using different keywords'
                  : 'Star some GitHub repositories to see them here'}
              </Text>
              {searchQuery && (
                <Button variant="default" onClick={handleClear}>
                  Clear Search
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <>
            {layout === 'list' ? (
              <Stack gap="sm">
                {repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} variant="list" />
                ))}
              </Stack>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </SimpleGrid>
            )}

            {hasMore && (
              <Center ref={loadMoreRef} py="xl">
                {isFetchingMore ? (
                  <Loader size="sm" />
                ) : (
                  <Button variant="subtle" onClick={() => fetchNextPage()}>
                    Load More
                  </Button>
                )}
              </Center>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
