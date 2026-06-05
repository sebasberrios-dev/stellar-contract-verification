"use client";

interface ProgressStepsProps {
  currentStep: number;
}

const STEPS = [
  "Reading contract from blockchain",
  "Extracting SEP-58 metadata",
  "Cloning source repository",
  "Compiling WASM with Docker",
  "Comparing hashes",
];

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <ul className="space-y-3">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <li key={step} className="flex items-center gap-3">
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                {isDone && (
                  <svg
                    className="w-5 h-5 text-[#00BFFF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {isActive && (
                  <svg
                    className="animate-spin w-5 h-5 text-[#00BFFF]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {!isDone && !isActive && (
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </span>
              <span
                className={
                  isDone
                    ? "text-[#00BFFF] text-sm"
                    : isActive
                    ? "text-white text-sm"
                    : "text-slate-600 text-sm"
                }
              >
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
