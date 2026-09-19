import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/site/InfoPage';
import { getAllCities } from '@/lib/data/cities';
import { getCityConverterPairs, getZoneConverterPairs } from '@/lib/data/converters';
import { getAllCountries } from '@/lib/data/countries';
import { getAllTimezones } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { REPO_URL, SITE_NAME } from '@/lib/seo/site';

const TITLE = `About ${SITE_NAME}`;
const DESCRIPTION = `What ${SITE_NAME} is, how every time on the site is calculated from the IANA time zone database, and where the city, country and photo data comes from.`;

export const metadata = buildMetadata({
  title: 'About This Site – How Times Are Calculated',
  description: DESCRIPTION,
  path: routes.about(),
  indexable: true,
});

export default function AboutPage() {
  const cities = getAllCities().length;
  const countries = getAllCountries().length;
  const abbreviations = getAllTimezones().length;
  const conversions = getZoneConverterPairs().length + getCityConverterPairs().length;

  return (
    <InfoPage
      title={TITLE}
      crumb="About"
      description={DESCRIPTION}
      path={routes.about()}
      intro="A free, fast reference for the current time anywhere, built so that the answer is on screen before anything else."
    >
      <InfoSection id="what" title="What the site does">
        <p>
          {SITE_NAME} shows the current local time, date, time zone and daylight saving status for {cities} cities in {countries} countries, explains {abbreviations} time
          zone abbreviations, and offers {conversions} ready-made conversions between time zones and cities. Around that sit the tools people reach for next: a{' '}
          <Link href={routes.converterHub()}>time zone converter</Link> for any date, a <Link href={routes.meetingPlanner()}>meeting planner</Link> that finds overlapping
          working hours, a <Link href={routes.worldClock()}>world clock</Link>, <Link href={routes.timerHub()}>countdown timers</Link>, an alarm, a stopwatch and date and
          hours calculators.
        </p>
        <p>There are no accounts, no paywalls and no adverts. Everything runs in the page you are looking at.</p>
      </InfoSection>

      <InfoSection id="how" title="How the times are calculated">
        <p>
          Every time on the site comes from the IANA time zone database, the same rule set that phones, computers and servers use. Cities are stored with their IANA zone
          identifier, such as <code>America/New_York</code>, never with a fixed offset, so daylight saving changes, half-hour and quarter-hour offsets, and historical rule
          changes are handled by the database rather than by us.
        </p>
        <p>
          Pages are rendered on the server with a recent snapshot and then the clocks tick in your browser from your device&rsquo;s clock. If your device clock is wrong, the
          times shown will be wrong by the same amount; the time zone rules still apply correctly.
        </p>
        <p>
          Sunrise, sunset and day length are computed from each city&rsquo;s coordinates with standard solar-position formulas, accurate to about a minute. Time differences
          between places are calculated for the specific date you choose, so a comparison in March can differ from one in November when only one side observes daylight saving
          time.
        </p>
      </InfoSection>

      <InfoSection id="data" title="Where the data comes from">
        <ul>
          <li>
            City and country records, including coordinates and population, come from{' '}
            <a href="https://www.geonames.org/" rel="noopener noreferrer">
              GeoNames
            </a>{' '}
            under the Creative Commons Attribution 4.0 licence.
          </li>
          <li>Time zone rules come from the IANA time zone database through the standard internationalisation features of the browser and of the server runtime.</li>
          <li>
            City photographs come from{' '}
            <a href="https://commons.wikimedia.org/" rel="noopener noreferrer">
              Wikimedia Commons
            </a>{' '}
            under free licences. Each photo carries its author and licence next to the image, linking to the original file.
          </li>
          <li>No paid data services are used, and nothing is fetched from third parties while you use the site.</li>
        </ul>
      </InfoSection>

      <InfoSection id="accuracy" title="Accuracy and corrections">
        <p>
          Time zone abbreviations are ambiguous: CST is used for Central Standard Time in North America, China Standard Time and Cuba Standard Time. Pages about abbreviations say
          which meaning they cover and when a region switches between standard and daylight names, and they never label a daylight-time period with the standard-time
          abbreviation.
        </p>
        <p>
          If you spot a wrong time, an outdated daylight saving rule or a city that is missing, please <Link href={routes.contact()}>tell us</Link>. The site is open source on{' '}
          <a href={REPO_URL} rel="noopener noreferrer">
            GitHub
          </a>
          , where every calculation and data rule can be inspected.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
