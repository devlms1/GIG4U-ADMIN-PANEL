export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 text-white flex-col justify-center px-16">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          GIG<span className="text-accent-500">4U</span>
        </h1>
        <p className="text-xl text-navy-200 leading-relaxed max-w-md">
          Work Orchestration Platform — connecting clients with service
          providers for seamless operations.
        </p>
        <div className="mt-12 space-y-4">
          {[
            'Manage your workforce end-to-end',
            'Real-time KYC & compliance tracking',
            'Transparent billing & payouts',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-navy-200">
              <svg
                className="w-5 h-5 text-accent-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
