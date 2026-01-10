import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Anchor,
  Avatar,
  Box,
  Center,
  Container,
  Flex,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import {
  IconArrowRight,
  IconBrandGithub,
  IconSearch,
} from '@tabler/icons-react';
import type { RepoListItem } from '~server/repos';
import { getRepos, getReposCount } from '~server/repos';

export function SearchHero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: totalCount } = useQuery({
    queryKey: ['repos-count'],
    queryFn: () => getReposCount(),
    staleTime: 60 * 1000,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-repos', 'suggestions', debouncedQuery],
    queryFn: () =>
      getRepos({ data: { query: debouncedQuery, limit: 8, offset: 0 } }),
    enabled: debouncedQuery.length > 0,
    staleTime: 30 * 1000,
  });

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim()) {
        navigate({
          to: '/repos',
          search: { q: searchQuery.trim() },
        });
      } else {
        navigate({ to: '/repos' });
      }
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleResultClick = (repo: RepoListItem) => {
    setShowResults(false);
    navigate({ to: `/repo/${repo.repo}` });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box pos="relative" style={{ minHeight: '100vh' }}>
      <Box
        pos="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-slate-9) 0%, var(--mantine-color-slate-8) 50%, var(--mantine-color-blue-9) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Box pos="relative" style={{ zIndex: 1 }}>
        <Container size="md" py="4xl">
          <Center mih="calc(100vh - 80px)">
            <Stack align="center" gap="xl" w="100%">
              <IconBrandGithub size={72} stroke={1.5} color="white" />

              <Title order={1} c="white" ta="center" fz={{ base: 32, md: 48 }}>
                GitHub Star Plus
              </Title>

              <Text c="slate.4" ta="center" size="lg" maw={500}>
                Search and manage your starred GitHub repositories, discover
                more amazing projects
              </Text>

              <Box w="100%" maw={600} ref={containerRef} pos="relative">
                <TextInput
                  placeholder="Search repositories by name or description..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.currentTarget.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  onKeyDown={handleKeyDown}
                  leftSection={<IconSearch size={20} />}
                  rightSection={isSearching ? <Loader size="xs" /> : null}
                  size="lg"
                  styles={{
                    input: {
                      height: 56,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'white',
                      '&::placeholder': {
                        color: 'var(--mantine-color-slate-5)',
                      },
                      '&:focus': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'var(--mantine-color-blue-5)',
                      },
                    },
                  }}
                />

                {showResults && debouncedQuery && (
                  <Box
                    pos="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    pb="sm"
                    mt="xs"
                    style={{ zIndex: 100 }}
                  >
                    <Paper
                      bg="slate.8"
                      radius="md"
                      shadow="xl"
                      style={{
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        maxHeight: 400,
                        overflowY: 'auto',
                      }}
                    >
                      {searchResults?.repos &&
                      searchResults.repos.length > 0 ? (
                        <>
                          {searchResults.repos.map((repo) => (
                            <UnstyledButton
                              key={repo.id}
                              w="100%"
                              p="md"
                              onClick={() => handleResultClick(repo)}
                              style={{
                                borderBottom:
                                  '1px solid rgba(255, 255, 255, 0.05)',
                              }}
                              styles={{
                                root: {
                                  '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.05)',
                                  },
                                },
                              }}
                            >
                              <Flex gap="md" align="flex-start">
                                <Avatar
                                  src={repo.ownerAvatarUrl}
                                  alt={repo.repo.split('/')[0]}
                                  size="sm"
                                  radius="sm"
                                />
                                <Box flex={1} miw={0}>
                                  <Text fw={600} c="white" truncate>
                                    {repo.repo}
                                  </Text>
                                  {repo.description && (
                                    <Text size="sm" c="slate.4" truncate>
                                      {repo.description}
                                    </Text>
                                  )}
                                </Box>
                              </Flex>
                            </UnstyledButton>
                          ))}
                          <UnstyledButton
                            w="100%"
                            p="md"
                            onClick={() => handleSearch(debouncedQuery)}
                            styles={{
                              root: {
                                '&:hover': {
                                  background: 'rgba(255, 255, 255, 0.05)',
                                },
                              },
                            }}
                          >
                            <Flex gap="md" align="center">
                              <IconSearch
                                size={20}
                                color="var(--mantine-color-slate-5)"
                                stroke={1.5}
                              />
                              <Text size="sm" c="blue.4">
                                View all results for "{debouncedQuery}" (
                                {searchResults.total} found)
                              </Text>
                            </Flex>
                          </UnstyledButton>
                        </>
                      ) : !isSearching ? (
                        <Center p="xl">
                          <Text size="sm" c="slate.4">
                            No matching repositories found
                          </Text>
                        </Center>
                      ) : null}
                    </Paper>
                  </Box>
                )}
              </Box>

              <Anchor
                component={Link}
                to="/repos"
                c="slate.4"
                size="lg"
                mt="xl"
                underline="hover"
              >
                <Flex align="center" gap={6}>
                  Browse all {totalCount?.toLocaleString() ?? '—'} repositories
                  <IconArrowRight size={18} />
                </Flex>
              </Anchor>
            </Stack>
          </Center>
        </Container>
      </Box>
    </Box>
  );
}
