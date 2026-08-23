import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/shared/layout/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy · CampusClean",
  description:
    "How CampusClean collects, uses, and protects personal and report data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="22 August 2026">
      <LegalSection title="Who we are">
        <p>
          CampusClean is a campus issue reporting platform that helps students
          submit reports (such as waterlogging, elevators, escalators, and
          washrooms) and helps coordinators verify and resolve them. This policy
          explains what information we collect and how we use it.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>Depending on how you use CampusClean, we may collect:</p>
        <ul>
          <li>
            <strong className="font-semibold text-ink">Account details</strong>{" "}
            — name, email address, phone number (optional), and a hashed
            password.
          </li>
          <li>
            <strong className="font-semibold text-ink">Report content</strong>{" "}
            — titles, descriptions, issue type, photos, campus location, and
            status history.
          </li>
          <li>
            <strong className="font-semibold text-ink">Reward activity</strong>{" "}
            — points balance and a ledger of awards tied to verified or
            resolved reports.
          </li>
          <li>
            <strong className="font-semibold text-ink">
              Technical session data
            </strong>{" "}
            — authentication cookies needed to keep you signed in securely.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use your information">
        <ul>
          <li>To create and manage your account.</li>
          <li>
            To investigate, assign, and resolve campus reports you submit.
          </li>
          <li>
            To show coordinators queues, analytics, and export files needed for
            campus operations.
          </li>
          <li>
            To award points when a coordinator verifies (and optionally resolves)
            a valid report.
          </li>
          <li>To protect the service against spam and abuse.</li>
        </ul>
        <p>
          We do not sell personal data. We do not use report photos or campus
          location for advertising.
        </p>
      </LegalSection>

      <LegalSection title="Photos and campus location">
        <p>
          Photos and campus locations you attach to a report are used only to
          investigate that issue. Coordinators can see them while handling the
          report. Public marketing pages do not list your personal reports or
          contact details.
        </p>
      </LegalSection>

      <LegalSection title="Who can see your data">
        <ul>
          <li>
            <strong className="font-semibold text-ink">Students</strong> see
            their own reports, profile, and points history.
          </li>
          <li>
            <strong className="font-semibold text-ink">Coordinators</strong> see
            report details needed for triage and resolution, including photos,
            campus location, and limited student contact fields on the report.
          </li>
          <li>
            <strong className="font-semibold text-ink">Service providers</strong>{" "}
            that host the app, database, or image uploads may process data on
            our behalf under contractual limits.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Retention">
        <p>
          We keep account and complaint records for as long as needed to
          operate the service, meet departmental record-keeping needs, and
          handle disputes. You may request correction of inaccurate profile
          details from your profile page, or ask for account deletion by
          contacting the department that operates your CampusClean instance.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Passwords are hashed. Sessions use secure cookies. Uploaded images are checked for
          allowed types and size. No method of transmission or storage is
          perfectly secure; we take reasonable steps to protect your data.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          CampusClean is intended for campus community use. If you believe a
          minor’s data was submitted inappropriately, contact the operating
          team so it can be reviewed and removed where appropriate.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy as the product changes. The “Last updated”
          date at the top of this page will change when we do. Continued use
          after an update means you accept the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy questions about this CampusClean deployment, contact the
          municipal or departmental operator that hosts your instance, or use
          the contact channel published on your local CampusClean landing page.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
