import { Investigation } from '../../components/investigation';
import { getLocations, getStudy } from '../../lib/study';
import './investigation.css';
import './bahrain-pilot.css';
import Link from 'next/link';
import { BahrainPilotView } from '../../components/bahrain-pilot';
import { bahrainPilot } from '../../lib/bahrain-pilot';
import { SeriesExplorer, type SeriesQuery } from '../../components/series-explorer';
import { OrbitaHero } from '../../components/orbita-hero';

export const metadata = { title: 'Earth system investigation | GulfScope' };

export default async function Page({ searchParams }: {
  searchParams: Promise<SeriesQuery>;
}) {
  const query = await searchParams;
  const { location, mode } = query;
  if (mode === 'series') return <SeriesExplorer query={query} />;
  if (mode === 'native-cell') return <div className="orbita-native">
    <OrbitaHero scene="bahrain" chapter="04 / Native cell study"
      title={<><span className="orbita-desktop-title">One cell. Two readings.</span><span className="orbita-mobile-title">Inside a single<br /> Earth cell.</span></>}
      description="A verified two-month reading. Not a climate trend." note="Bahrain / Native MERRA-2" />
    <BahrainPilotView pilot={bahrainPilot} locations={getLocations()} />
  </div>;
  const studies = getLocations().map(({ id }) => {
    const study = getStudy(id)!;
    const variables = study.variables.map(({ monthly, ...annualVariable }) => annualVariable);
    return { ...study, variables };
  });
  const initialLocation = studies.find(study => study.id === location)?.id ?? 'bahrain';
  const example = getStudy('bahrain')!.variables.find(variable => variable.id === 'PRECTOTCORR')!;
  return <div className="orbita-original">
    <OrbitaHero scene="horizon" chapter="05 / Original POWER studies" title="The original record."
      description="A point-study reading experience, retained alongside the new field desk." note="1981–2025 / Annual and monthly" />
    <section className="orbita-width orbita-original-example" aria-labelledby="original-example">
      <h2 className="orbita-label" id="original-example">Bahrain / Precipitation example</h2>
      <div><p className="mission-slope">{example.trend.slopePerDecade.toFixed(2)} <small>{example.unit} / decade</small></p>
      <p>{example.trend.significant ? 'Statistically significant' : 'Not statistically significant'}. A negative estimate alone does not establish a decline.</p></div>
      <aside className="orbita-interpretation"><p className="orbita-label">POWER meteorology / Derived from MERRA-2</p>
      <p>{example.annual.length} annual values · {example.monthly.length} months</p></aside>
    </section>
    <nav className="editorial-shell pilot-entry" aria-label="Investigation modes">
      <Link href="/investigate?mode=native-cell">Explore Bahrain’s native MERRA-2 cell ↗</Link>
      {' · '}<Link href="/investigate?mode=series">Explore datasets and historical periods ↗</Link>
    </nav>
    <Investigation key={initialLocation} studies={studies} initialLocation={initialLocation} />
  </div>;
}
