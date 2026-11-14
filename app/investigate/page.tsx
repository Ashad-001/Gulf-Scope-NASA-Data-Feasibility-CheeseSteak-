import { Investigation } from '../../components/investigation';
import { getLocations } from '../../lib/study';

export const metadata = { title: 'Bahrain investigation | GulfScope' };

export default function Page() {
  return <Investigation locations={getLocations()} />;
}
