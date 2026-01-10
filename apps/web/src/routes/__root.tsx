import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { MantineProvider } from '@mantine/core';
import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from '@mantine/code-highlight';
import { Toaster } from 'sonner';
import { NavigationProgress } from '@mantine/nprogress';
import { ModalsProvider } from '@mantine/modals';
import hljs from 'highlight.js';
import type { QueryClient } from '@tanstack/react-query';
import appCss from '~styles.css?url';
import { shadcnTheme as theme } from '~ui/shadcn-blue-theme/theme';
import { shadcnCssVariableResolver as cssVariablesResolver } from '~ui/shadcn-blue-theme/cssVariableResolver';
import { AppLayout } from '~components/layout/AppLayout';

const codeHighlightAdapter = createHighlightJsAdapter(hljs);

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'GitHub Star Plus',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  component: AppLayout,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
        >
          <CodeHighlightAdapterProvider adapter={codeHighlightAdapter}>
            <ModalsProvider>{children}</ModalsProvider>
          </CodeHighlightAdapterProvider>

          <Toaster position="top-center" richColors />
          <NavigationProgress />
        </MantineProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'React Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
