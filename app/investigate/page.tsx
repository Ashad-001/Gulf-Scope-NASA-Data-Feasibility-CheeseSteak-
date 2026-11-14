import { Investigation } from '../../components/investigation';
import { getLocations } from '../../lib/study';

export const metadata = { title: 'Bahrain investigation | GulfScope' };

export default async function Page({ searchParams }: {
  searchParams: Promise<{ location?: string | string[] }>;
}) {
  const locations = getLocations();
  const { location } = await searchParams;
  const initialLocation = locations.find(item => item.id === location)?.id ?? 'bahrain';
  return <Investigation key={initialLocation} locations={locations} initialLocation={initialLocation} />;
}
