import { createFileRoute } from '@tanstack/react-router';
import { SearchHero } from '~components/search/SearchHero';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SearchHero />;
}
