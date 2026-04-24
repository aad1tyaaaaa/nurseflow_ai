import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-white p-10 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-deep mb-4">Contact Support</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-6">Need a hand? We’ve got you.</h1>
        <div className="space-y-4 text-sm text-text-secondary font-body leading-relaxed">
          <p>For workspace setup, integration questions, or clinical workflow support, contact the NurseFlow AI operations team.</p>
          <p><strong className="text-text-primary">Email:</strong> <a href="mailto:support@nurseflow.ai" className="text-primary-deep hover:underline">support@nurseflow.ai</a></p>
          <p><strong className="text-text-primary">Hours:</strong> Monday–Friday, 8:00 AM to 6:00 PM local hospital time</p>
          <p><strong className="text-text-primary">Include:</strong> your unit, environment, and a short description of the issue so support can help faster.</p>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-sm font-bold text-primary-deep hover:underline">← Back to homepage</Link>
        </div>
      </div>
    </main>
  );
}
