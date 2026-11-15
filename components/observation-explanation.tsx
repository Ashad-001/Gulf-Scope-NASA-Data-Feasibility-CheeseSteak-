import Link from 'next/link';
import { minimumReferencePeriods, observationContext } from '../lib/observation-context.mjs';
import { alpha, minimumYears, trendFamily } from '../lib/series-analysis.mjs';
import { variables } from '../lib/series-catalog.mjs';

type Observation = Parameters<typeof observationContext>[0][number];
type Measurement = {
  definition: (typeof variables)[number];
  displayed: Observation[];
  record: { monthly: Observation[]; annual: Observation[] };
  years: Observation[];
  trend: ReturnType<typeof trendFamily>[number];
  unit: string;
};

const energyBudget = 'https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/';
const soilMoisture = 'https://science.nasa.gov/earth/earth-observatory/a-little-bit-of-water-a-lot-of-impact/';
const temperature = {
  factors: 'Sunlight warms the surface, which transfers heat to the air. Clouds change incoming sunlight and how much heat escapes. Evaporation can cool the surface.',
  source: energyBudget, title: 'NASA Earth’s energy budget', related: 'ALLSKY_SFC_SW_DWN',
};
const rainfall = {
  factors: 'Rain can form when moist air rises, cools and condenses. How much rain falls depends in part on the available moisture and how air is lifted.',
  source: 'https://gpm.nasa.gov/education/water-cycle', title: 'NASA GPM water cycle', related: 'RH2M',
};
const guidance: Record<string, typeof temperature> = {
  T2M: temperature, T2M_MIN_AVG: temperature, T2M_MAX_AVG: temperature,
  PRECTOTCORR: rainfall, IMERG_PRECTOT: rainfall,
  SFMC: {
    factors: 'Rain can wet the topsoil quickly. Direct evaporation can dry it between rain events.',
    source: soilMoisture, title: 'NASA Earth Observatory on soil moisture', related: 'IMERG_PRECTOT',
  },
  RZMC: {
    factors: 'Water can soak down into the root zone, drain deeper or be taken up by plants. These processes influence how long moisture stays below the surface.',
    source: soilMoisture, title: 'NASA Earth Observatory on soil moisture', related: 'IMERG_PRECTOT',
  },
  RH2M: {
    factors: 'Relative humidity depends on both water vapor and temperature. With the same amount of water vapor, cooling generally raises relative humidity and warming lowers it.',
    source: 'https://science.nasa.gov/earth/earth-observatory/relative-humidity-in-the-upper-troposphere-4312/',
    title: 'NASA Earth Observatory on relative humidity', related: 'T2M',
  },
  ALLSKY_SFC_SW_DWN: {
    factors: 'Sun angle and daylight duration affect the energy reaching the surface. Clouds and airborne particles can reflect or absorb sunlight before it reaches the ground.',
    source: energyBudget, title: 'NASA Earth’s energy budget', related: 'T2M',
  },
  WS2M: {
    factors: 'Uneven heating creates differences in air pressure that drive winds. Stronger pressure differences over short distances can drive stronger winds.',
    source: 'https://www.nasa.gov/wp-content/uploads/2023/06/weather-to-fly-by-k-8.pdf',
    title: 'NASA Weather to Fly By', related: 'T2M',
  },
};
const displayNumber = new Intl.NumberFormat('en', { maximumSignificantDigits: 6 });
const calendarMonth = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' });

export function ObservationExplanation({ measurements, location, first, last, monthly }: {
  measurements: Measurement[]; location: { id: string; name: string }; first: number; last: number; monthly: boolean;
}) {
  return <details className="mission-disclosure">
    <summary>What might explain this?</summary>
    {measurements.map(({ definition, displayed, record, years, trend, unit }) => {
      const context = observationContext(displayed, monthly ? record.monthly : record.annual, monthly);
      const month = context && monthly && context.latest.month
        ? calendarMonth.format(new Date(Date.UTC(context.latest.year, context.latest.month - 1, 1))) : '';
      const explanation = guidance[definition.id];
      const related = variables.find(variable => variable.id === explanation.related);
      const relatedFirst = related && Math.max(first, related.start);
      const relatedLast = related && Math.min(last, related.end);
      const relatedLink = related && relatedFirst !== undefined && relatedLast !== undefined && relatedFirst <= relatedLast
        ? '/investigate?' + new URLSearchParams({ mode: 'series', location: location.id, series: related.dataset + ':' + related.id,
          resolution: monthly ? 'monthly' : 'annual', first: String(relatedFirst), last: String(relatedLast) }) : null;
      return <div key={definition.id}>
        {measurements.length > 1 && <h3>{definition.name}</h3>}
        <p><strong>What the data shows.</strong> {context ? <>
          The latest complete {monthly ? 'month' : 'year'} in your {first}–{last} selection was {month && month + ' '}{context.latest.year} at {location.name}, with {displayNumber.format(context.latest.value)} {unit}.
          {context.reference ? <> That was <strong>{context.reference.position}</strong> compared with the middle half of {context.count} other complete {monthly ? month + ' values' : 'annual values'} in this measurement’s archive at the same study point ({context.reference.first}–{context.reference.last}). The reference median was {displayNumber.format(context.reference.median)} {unit}, and the middle half ranged from {displayNumber.format(context.reference.lower)} to {displayNumber.format(context.reference.upper)} {unit}.</>
            : <> The archive contains only {context.count} other complete {monthly ? month + ' values' : 'annual values'} for this measurement at this point. At least {minimumReferencePeriods} are needed here to describe a typical range.</>}
        </> : <> No complete {monthly ? 'monthly' : 'annual'} value is available for {location.name} in {first}–{last}.</>}</p>
        <p>{monthly ? 'Comparing the same calendar month reduces the influence of regular seasonal differences. ' : ''}A high or low reading describes variation between years. The trend test separately assesses the complete annual record in your selected window.{' '}
          {trend.estimate && trend.adjustedP !== null
            ? trend.adjustedP <= alpha
              ? <>The adjusted test found a statistically significant {trend.estimate.direction} trend over {years[0].year}–{years.at(-1)!.year}.</>
              : <>The adjusted test did not detect a statistically significant trend over {years[0].year}–{years.at(-1)!.year}.</>
            : trend.estimate ? 'An adjusted significance result is unavailable for this window.'
              : <>This window has {years.length} complete annual values. A trend test requires at least {minimumYears} consecutive complete years.</>}
        </p>
        <p><strong>Possible influencing factors.</strong> {explanation.factors} <a href={explanation.source}>{explanation.title} ↗</a></p>
        <p><strong>What the data cannot prove.</strong> This record represents a study point. A high or low value, a pattern shared with another measurement, or a statistically significant trend cannot establish the cause or describe a country as a whole.</p>
        {relatedLink && <p><Link href={relatedLink}>Investigate {related?.name.toLowerCase()} at {location.name} ↗</Link></p>}
      </div>;
    })}
  </details>;
}
