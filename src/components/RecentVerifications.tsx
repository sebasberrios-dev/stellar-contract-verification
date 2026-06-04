export default function RecentVerifications() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full flex flex-col">
      <h2 className="text-white font-semibold text-lg mb-4">Recent Verifications</h2>
      <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
        {/* Shield icon */}
        <svg
          className="w-12 h-12 text-slate-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
        <p className="text-slate-500 text-sm">No recent verifications in this session.</p>
        <p className="text-slate-600 text-xs mt-1">Submit a contract ID to get started.</p>
      </div>
    </div>
  );
}
