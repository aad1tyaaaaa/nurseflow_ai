import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-white p-10 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-deep mb-4">Terms of Service</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-6">Use the platform responsibly.</h1>
        <div className="space-y-4 text-sm text-text-secondary font-body leading-relaxed">
          <p>NurseFlow AI is intended to support licensed clinical workflows, not replace professional judgment. Always verify AI-generated suggestions against patient condition, policy, and local protocol.</p>
          <p>Users are responsible for safeguarding credentials, working within authorized environments, and ensuring documentation entered into the platform is accurate and appropriate.</p>
          <p>Clinical organizations should validate integrations, alert thresholds, and escalation pathways before relying on the software in operational care settings.</p>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-sm font-bold text-primary-deep hover:underline">← Back to homepage</Link>
        </div>
      </div>
    </main>
  );
}
