import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-white p-10 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-deep mb-4">Privacy Policy</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-6">Your clinical data stays protected.</h1>
        <div className="space-y-4 text-sm text-text-secondary font-body leading-relaxed">
          <p>NurseFlow AI is designed for secure clinical workflow support. Session data, authentication tokens, and operational activity are handled with least-privilege principles in mind.</p>
          <p>Protected health information should only be entered in authorized environments. Access controls, audit trails, and role-based visibility are expected parts of the platform workflow.</p>
          <p>If you need a data handling review for your environment, contact your administrator or support team before onboarding live patient data.</p>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-sm font-bold text-primary-deep hover:underline">← Back to homepage</Link>
        </div>
      </div>
    </main>
  );
}
