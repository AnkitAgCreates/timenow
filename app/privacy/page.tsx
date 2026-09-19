import Link from 'next/link';
import { AnalyticsChoice } from '@/components/analytics/AnalyticsChoice';
import { InfoPage, InfoSection } from '@/components/site/InfoPage';
import { ANALYTICS_CONFIGURED } from '@/lib/analytics-config';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { SITE_NAME } from '@/lib/seo/site';

const DESCRIPTION = `${SITE_NAME} has no accounts, sets no cookies and loads no trackers. What stays on your device, what the host logs, and how your time zone is detected.`;

export const metadata = buildMetadata({
  title: 'Privacy Policy – No Accounts, No Cookies',
  description: DESCRIPTION,
  path: routes.privacy(),
  indexable: true,
});

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      crumb="Privacy"
      description={DESCRIPTION}
      path={routes.privacy()}
      intro="The short version: this site does not know who you are, does not set cookies, and does not load trackers. The details are below in plain language."
      updated="20 September 2026"
    >
      <InfoSection id="collect" title="What we collect">
        <p>
          Nothing that identifies you. There are no accounts, sign-ups, forms or comment fields, so there is nothing for you to submit and nothing for us to keep. The site sets
          no cookies.
        </p>
      </InfoSection>

      <InfoSection id="device" title="What is stored on your device">
        <p>
          A few features remember your choices so they are there when you come back: the cities in your <Link href={routes.worldClock()}>world clock</Link> and the alarms you
          set on the <Link href={routes.alarm()}>alarm page</Link>. These are saved in your browser&rsquo;s local storage, on your device only. They are never sent to us or to
          anyone else, and you can remove them at any time by clearing the site&rsquo;s data in your browser settings.
        </p>
        <p>
          Share links from the <Link href={routes.meetingPlanner()}>meeting planner</Link> encode the places, date and hours you picked in the link itself so the other person
          sees the same grid. They contain no personal information.
        </p>
      </InfoSection>

      <InfoSection id="timezone" title="How your time zone is detected">
        <p>
          The homepage shows the time for the time zone your device is set to. It reads that setting through the standard web API for dates and times, the same way any website
          formats a date. The site never asks for your location, never uses GPS or the browser&rsquo;s geolocation permission, and does not store the detected zone.
        </p>
      </InfoSection>

      <InfoSection id="hosting" title="Hosting and server logs">
        <p>
          The site is hosted on Vercel. Like every web host, Vercel receives the technical details of each request, such as your IP address, browser type, the page requested
          and the time, and keeps them briefly in operational logs used for security, abuse prevention and reliability. We do not use these logs to build profiles or to
          identify visitors. Vercel&rsquo;s handling of this data is described in the{' '}
          <a href="https://vercel.com/legal/privacy-policy" rel="noopener noreferrer">
            Vercel privacy policy
          </a>
          .
        </p>
      </InfoSection>

      <InfoSection id="analytics" title="Analytics and advertising">
        {ANALYTICS_CONFIGURED ? (
          <>
            <p>
              No advertising. For analytics we use Google Analytics 4, and only if you accept the banner shown on your first visit. Until you accept, nothing is requested
              from Google and no analytics cookie is set; if you decline, the same is true and the banner does not return.
            </p>
            <p>
              After you accept, Google Analytics records which pages are viewed, which tools are used (for example that a timer was started or a conversion was made), the type
              of device and browser, and an approximate location derived from your IP address at country or city level. Google does not store the IP address itself. It sets
              first-party cookies named <code>_ga</code> and <code>_ga_…</code> on this domain so that repeat visits count as one visitor; they expire after two years. All
              advertising features are switched off, and we do not link analytics data to any identity, because there is none to link to.
            </p>
            <p>
              Google processes this data on our behalf under the{' '}
              <a href="https://policies.google.com/privacy" rel="noopener noreferrer">
                Google privacy policy
              </a>
              .
            </p>
            <AnalyticsChoice />
          </>
        ) : (
          <p>
            None. No analytics script and no advertising script loads on any page today. The site is prepared for Google Analytics behind a consent banner; if that is
            switched on, this section changes to describe exactly what it measures.
          </p>
        )}
      </InfoSection>

      <InfoSection id="third-parties" title="Third-party content">
        <p>
          Fonts, scripts, styles and city photographs are served from this site&rsquo;s own domain, so opening a page makes no requests to other companies
          {ANALYTICS_CONFIGURED ? ', apart from Google Analytics after you have accepted it' : ''}. Where a page links out, for example to GeoNames, Wikimedia Commons or
          GitHub, those sites have their own privacy policies once you follow the link.
        </p>
      </InfoSection>

      <InfoSection id="children" title="Children">
        <p>The site is a general-audience reference and collects no personal data from anyone, including children.</p>
      </InfoSection>

      <InfoSection id="changes" title="Changes and questions">
        <p>
          If this policy changes, the date at the top of the page changes with it, and any new data use is described here before it starts. Questions about privacy can be sent
          through the <Link href={routes.contact()}>contact page</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
