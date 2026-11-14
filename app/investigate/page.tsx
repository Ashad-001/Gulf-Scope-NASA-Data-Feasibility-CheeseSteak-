import { Investigation } from '../../components/investigation';
import { getLocations, getStudy } from '../../lib/study';
import './investigation.css';
import './bahrain-pilot.css';
import Link from 'next/link';
import { BahrainPilotView } from '../../components/bahrain-pilot';
import { bahrainPilot } from '../../lib/bahrain-pilot';

export const metadata = { title: 'Earth system investigation | GulfScope' };

export default async function Page({ searchParams }: {
  searchParams: Promise<{ location?: string | string[]; mode?: string | string[] }>;
}) {
  const { location, mode } = await searchParams;
  if (mode === 'native-cell') return <BahrainPilotView pilot={bahrainPilot} />;
  const studies = getLocations().map(({ id }) => {
    const study = getStudy(id)!;
    const variables = study.variables.map(({ monthly, ...annualVariable }) => annualVariable);
    return { ...study, variables };
  });
  const initialLocation = studies.find(study => study.id === location)?.id ?? 'bahrain';
  return <>
    <nav className="pilot-entry" aria-label="Investigation modes">
      <Link href="/investigate?mode=native-cell">Explore Bahrain’s native MERRA-2 cell ↗</Link>
    </nav>
    <Investigation key={initialLocation} studies={studies} initialLocation={initialLocation} />
  </>;
}
