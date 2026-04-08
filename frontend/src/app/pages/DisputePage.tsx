import { Link } from "react-router";

export function DisputePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="px-4 py-6 bg-amber-50 border border-amber-200 rounded-[2rem] text-sm text-amber-900 font-medium whitespace-pre-line text-center shadow-lg border-2">
        <h1 className="text-xl font-bold mb-2">Dispute Resolution</h1>
        This feature is currently under development.
        Community-governed dispute resolution is coming soon.
        <div className="mt-4 mb-4 text-xs font-bold text-amber-600 tracking-wider">COMING SOON</div>
        
        <Link
          to="/app/bounties"
          className="inline-block mt-4 px-4 py-2 bg-white rounded-full border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm"
        >
          ← Back to Bounties
        </Link>
      </div>
    </div>
  );
}
