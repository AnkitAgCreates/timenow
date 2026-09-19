import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/site/InfoPage';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { CONTACT_EMAIL, REPO_URL, SITE_NAME } from '@/lib/seo/site';

const DESCRIPTION = `How to reach ${SITE_NAME}: report a wrong time or DST rule, suggest a city or conversion page, or ask about a photo credit, and what to include.`;

export const metadata = buildMetadata({
  title: 'Contact – Report a Time Error or Suggest a City',
  description: DESCRIPTION,
  path: routes.contact(),
  indexable: true,
});

const ISSUES_URL = `${REPO_URL}/issues`;

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      crumb="Contact"
      description={DESCRIPTION}
      path={routes.contact()}
      intro="Found a wrong time, a missing city or a photo credit that needs fixing? Here is how to reach us and what helps us act quickly."
    >
      <InfoSection id="reach" title="How to reach us">
        <p>
          The fastest route is the site&rsquo;s public issue tracker on GitHub:{' '}
          <a href={ISSUES_URL} rel="noopener noreferrer">
            open an issue
          </a>
          . Anyone can read existing reports there, so you may find yours already answered. A GitHub account is needed to post.
        </p>
        {CONTACT_EMAIL ? (
          <p>
            You can also email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        ) : null}
        <p>
          This is a small independent project. Every message is read, but there is no support desk and no guaranteed response time. There are no accounts on the site, so
          there is nothing account-related we can help with.
        </p>
      </InfoSection>

      <InfoSection id="wrong-time" title="Reporting a wrong time or time zone">
        <p>Most reports turn out to be daylight saving edge cases or a device clock that is off, so a few details let us tell the difference straight away:</p>
        <ul>
          <li>The page address, for example a city page such as the one for London.</li>
          <li>The time the page showed, the time you expected, and the date and time of day you looked.</li>
          <li>The time zone your device is set to, and whether its clock is set automatically.</li>
          <li>For daylight saving questions, the date the change should or should not have happened.</li>
        </ul>
        <p>
          The rules come from the IANA time zone database. When a government changes its daylight saving policy at short notice, the database is updated within days and the site
          follows automatically; until then the old rule applies, and a report still helps us check.
        </p>
      </InfoSection>

      <InfoSection id="suggest" title="Suggesting a city, country or conversion">
        <p>
          New pages are added from structured data, not written one by one, so a suggestion needs the city or country name, the country it belongs to and, if you know it, its
          IANA time zone. Conversion pages between two time zones or two cities are added when people search for them, so mention how you would phrase the search.
        </p>
      </InfoSection>

      <InfoSection id="photos" title="Photo credits and licensing">
        <p>
          City photographs come from Wikimedia Commons under free licences, and each one names its author and licence next to the image with a link to the original file. If you
          are the author and the credit is wrong or you would like the photo replaced, tell us which page it is on and we will change it.
        </p>
        <p>
          For anything else about the site, see the <Link href={routes.about()}>about page</Link> and the <Link href={routes.privacy()}>privacy policy</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
