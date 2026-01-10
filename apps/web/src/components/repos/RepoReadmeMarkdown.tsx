import {
  Accordion,
  Anchor,
  Box,
  Code,
  Image,
  Stack,
  Text,
  Typography,
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import GithubSlugger from 'github-slugger';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

type RepoDetails = Record<string, unknown> | null | undefined;

type TocItem = {
  level: 2 | 3;
  text: string;
  slug: string;
};

export type RepoReadmeMarkdownProps = {
  markdown: string;
  repoFullName: string;
  repoDetails?: RepoDetails;
};

function getDefaultBranch(repoDetails: RepoDetails) {
  const raw =
    repoDetails && typeof repoDetails === 'object' ? repoDetails : undefined;
  const branch = raw?.default_branch;
  return typeof branch === 'string' && branch.trim() ? branch : 'main';
}

function isProbablyAbsoluteUrl(url: string) {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:')
  );
}

function resolveRepoHref(args: {
  href: string;
  repoFullName: string;
  defaultBranch: string;
}) {
  const { href, repoFullName, defaultBranch } = args;
  if (!href) return href;
  if (href.startsWith('#')) return href;
  if (isProbablyAbsoluteUrl(href)) return href;

  // Keep absolute-paths inside repo root: `/docs/a.md` -> `docs/a.md`
  const normalized = href.startsWith('/') ? href.slice(1) : href;
  const base = `https://github.com/${repoFullName}/blob/${defaultBranch}/`;
  return new URL(normalized, base).toString();
}

function resolveRepoImageSrc(args: {
  src: string;
  repoFullName: string;
  defaultBranch: string;
}) {
  const { src, repoFullName, defaultBranch } = args;
  if (!src) return src;
  if (isProbablyAbsoluteUrl(src)) return src;
  if (src.startsWith('data:')) return src;

  const normalized = src.startsWith('/') ? src.slice(1) : src;
  const base = `https://raw.githubusercontent.com/${repoFullName}/${defaultBranch}/`;
  return new URL(normalized, base).toString();
}

function extractPlainText(input: unknown): string {
  if (typeof input === 'string') return input;
  if (Array.isArray(input)) return input.map(extractPlainText).join('');
  if (input && typeof input === 'object' && 'props' in (input as any)) {
    return extractPlainText((input as any).props?.children);
  }
  return '';
}

function extractToc(markdown: string): Array<TocItem> {
  const slugger = new GithubSlugger();
  const items: Array<TocItem> = [];

  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker: '```' | '~~~' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      const marker = trimmed.startsWith('```') ? '```' : '~~~';
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (fenceMarker === marker) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }

    if (inFence) continue;

    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(trimmed);
    if (!m) continue;

    const level = m[1] === '##' ? 2 : 3;
    const text = m[2].replace(/\s+#+\s*$/, '').trim();
    if (!text) continue;

    items.push({ level, text, slug: slugger.slug(text) });
  }

  return items;
}

const readmeSanitizeSchema = {
  ...defaultSchema,
  tagNames: Array.from(
    new Set([
      ...(defaultSchema.tagNames ?? []),
      'details',
      'summary',
      'kbd',
      'sup',
      'sub',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'img',
    ]),
  ),
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    a: Array.from(
      new Set([
        ...(defaultSchema.attributes?.a ?? []),
        'href',
        'title',
        'target',
        'rel',
      ]),
    ),
    img: Array.from(
      new Set([
        ...(defaultSchema.attributes?.img ?? []),
        'src',
        'alt',
        'title',
        'width',
        'height',
        'loading',
      ]),
    ),
    details: Array.from(
      new Set([...(defaultSchema.attributes?.details ?? []), 'open']),
    ),
    '*': Array.from(
      new Set([...(defaultSchema.attributes?.['*'] ?? []), 'className']),
    ),
  },
} as const;

export function RepoReadmeMarkdown(props: RepoReadmeMarkdownProps) {
  const { markdown, repoFullName, repoDetails } = props;
  const defaultBranch = getDefaultBranch(repoDetails);

  const toc = useMemo(() => extractToc(markdown), [markdown]);
  const slugger = new GithubSlugger();

  return (
    <Stack gap="md">
      {toc.length > 0 && (
        <Accordion variant="contained" radius="md">
          <Accordion.Item value="toc">
            <Accordion.Control>Table of contents</Accordion.Control>
            <Accordion.Panel>
              <Stack gap={4}>
                {toc.map((item) => (
                  <Anchor
                    key={item.slug}
                    href={`#${item.slug}`}
                    size="sm"
                    style={{ paddingLeft: item.level === 3 ? 12 : 0 }}
                  >
                    {item.text}
                  </Anchor>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      <Typography>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            [rehypeRaw, {}],
            [rehypeSanitize, readmeSanitizeSchema],
          ]}
          components={{
            a({ children, href }) {
              const resolved = href
                ? resolveRepoHref({ href, repoFullName, defaultBranch })
                : undefined;
              const isExternal =
                !!resolved &&
                isProbablyAbsoluteUrl(resolved) &&
                !resolved.includes(`github.com/${repoFullName}`);

              return (
                <Anchor
                  href={resolved}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </Anchor>
              );
            },
            img({ alt, src, title }) {
              const resolved = src
                ? resolveRepoImageSrc({ src, repoFullName, defaultBranch })
                : undefined;
              return (
                <Image
                  src={resolved}
                  alt={alt ?? ''}
                  title={title}
                  fit="contain"
                  radius="sm"
                  my="sm"
                />
              );
            },
            code({ children, className }) {
              const raw = String(children ?? '').replace(/\n$/, '');
              const match = /language-(\w+)/.exec(className ?? '');
              const language = match?.[1];
              const isBlock = raw.includes('\n');

              if (language) {
                return (
                  <CodeHighlight
                    code={raw}
                    language={language}
                    radius="md"
                    withCopyButton
                    withBorder
                  />
                );
              }

              if (isBlock) {
                return (
                  <Code block style={{ whiteSpace: 'pre', overflowX: 'auto' }}>
                    {raw}
                  </Code>
                );
              }

              return <Code>{raw}</Code>;
            },
            pre({ children }) {
              // Let CodeHighlight handle its own wrapper; for plain <pre><code> fallbacks, keep layout stable
              return <Box my="sm">{children}</Box>;
            },
            h1({ children }) {
              const text = extractPlainText(children);
              const id = slugger.slug(text);
              return (
                <Text component="h1" id={id} fw={800} fz={28} mt="md" mb="sm">
                  {children}
                </Text>
              );
            },
            h2({ children }) {
              const text = extractPlainText(children);
              const id = slugger.slug(text);
              return (
                <Text component="h2" id={id} fw={750} fz={22} mt="lg" mb="sm">
                  {children}
                </Text>
              );
            },
            h3({ children }) {
              const text = extractPlainText(children);
              const id = slugger.slug(text);
              return (
                <Text component="h3" id={id} fw={700} fz={18} mt="md" mb="xs">
                  {children}
                </Text>
              );
            },
            table({ children }) {
              return (
                <Box component="div" style={{ overflowX: 'auto' }} my="sm">
                  <Box component="table" style={{ width: '100%' }}>
                    {children}
                  </Box>
                </Box>
              );
            },
            th({ children }) {
              return (
                <Box
                  component="th"
                  style={{ textAlign: 'left', padding: '8px' }}
                >
                  {children}
                </Box>
              );
            },
            td({ children }) {
              return (
                <Box
                  component="td"
                  style={{ padding: '8px', verticalAlign: 'top' }}
                >
                  {children}
                </Box>
              );
            },
            tr({ children }) {
              return <Box component="tr">{children}</Box>;
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </Typography>
    </Stack>
  );
}
