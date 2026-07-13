import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageTemplate,
  PolitykaPrywatnosciTemplate,
  politykaPrywatnosciIntro,
} from "@moduly/legal-consent";
import { modulyConfig } from "@/moduly.config";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  robots: { index: false },
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Detailing Łącko
        </Link>
      </div>
      <LegalPageTemplate
        brandName={modulyConfig.branding.name}
        title="Polityka prywatności"
        intro={politykaPrywatnosciIntro({
          brandName: modulyConfig.branding.name,
          contactEmail: modulyConfig.email.contactEmail,
          siteUrl: modulyConfig.branding.storefrontUrl,
        })}
        breadcrumbs={[
          { label: "Strona główna", href: "/" },
          { label: "Polityka prywatności" },
        ]}
      >
        <PolitykaPrywatnosciTemplate
          config={{
            brandName: modulyConfig.branding.name,
            contactEmail: modulyConfig.email.contactEmail,
            siteUrl: modulyConfig.branding.storefrontUrl,
          }}
        />
      </LegalPageTemplate>
    </div>
  );
}
