import { Investigation } from '../../components/investigation';
import { getLocations, getStudy } from '../../lib/study';
import './investigation.css';

export const metadata = { title: 'Earth system investigation | GulfScope' };

export default async function Page({ searchParams }: {
  searchParams: Promise<{ location?: string | string[] }>;
}) {
  const { location } = await searchParams;
  const studies = getLocations().map(({ id }) => {
    const study = getStudy(id)!;
    const variables = study.variables.map(({ monthly, ...annualVariable }) => annualVariable);
    return { ...study, variables };
  });
  const initialLocation = studies.find(study => study.id === location)?.id ?? 'bahrain';
  return <Investigation key={initialLocation} studies={studies} initialLocation={initialLocation} />;
}
