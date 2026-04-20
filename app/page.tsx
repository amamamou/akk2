import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
      <main className="w-full max-w-3xl px-6 py-16 sm:px-10">
        <div className="mb-10 flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-md bg-gray-900/5">
            <Image
              src="/akousticarts.webp"
              alt="Akoustic Arts"
              fill
              sizes="32px"
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Akoustic Arts
            </p>
            <p className="text-sm text-gray-500">Pro audio scheduling & playback</p>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-10 shadow-sm sm:px-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Coming soon
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Your Akoustic Arts control center is on the way
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
            This workspace will become the place where you manage players, build
              schedules, monitor what&apos;s on air, and configure your account. We&apos;re
              putting the final touches on it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
            >
              Go to dashboard
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
            >
              Manage players
            </Link>
          </div>

          <div className="mt-6 grid gap-4 text-xs text-gray-500 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-gray-700">What you&apos;ll get</p>
              <p className="mt-1">
                A unified view across dashboard, schedule, players and analytics.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Current status</p>
              <p className="mt-1">Internal preview in progress. Your data is already live.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Try the beta</p>
              <p className="mt-1">
                Use the sidebar to explore Players, Schedule and Settings while we
                finish this home experience.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
