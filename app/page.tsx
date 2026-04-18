import Link from "next/link";
import { getSessions } from "@/lib/openf1";
import type { Session } from "@/types/openf1";

const AVAILABLE_YEARS = [2026, 2025, 2024, 2023];
const DEFAULT_YEAR = AVAILABLE_YEARS[0];

interface HomeProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { year: yearParam } = await searchParams;
  const yearCandidate = Number(yearParam);
  const year = AVAILABLE_YEARS.includes(yearCandidate)
    ? yearCandidate
    : DEFAULT_YEAR;

  const sessions = await getSessions({ year });

  const meetings = new Map<
    number,
    { country: string; location: string; firstDate: string; sessions: Session[] }
  >();
  for (const s of sessions) {
    const existing = meetings.get(s.meeting_key);
    if (existing) {
      existing.sessions.push(s);
      if (s.date_start < existing.firstDate) existing.firstDate = s.date_start;
    } else {
      meetings.set(s.meeting_key, {
        country: s.country_name,
        location: s.location,
        firstDate: s.date_start,
        sessions: [s],
      });
    }
  }

  const orderedMeetings = Array.from(meetings.values())
    .map((m) => ({
      ...m,
      sessions: [...m.sessions].sort((a, b) =>
        a.date_start.localeCompare(b.date_start),
      ),
    }))
    .sort((a, b) => b.firstDate.localeCompare(a.firstDate));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          F1 Race Performance Analyzer
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Pick a session to analyze lap times. Data from{" "}
          <a
            href="https://openf1.org/"
            className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            OpenF1
          </a>
          .
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2">
        {AVAILABLE_YEARS.map((y) => (
          <Link
            key={y}
            href={y === DEFAULT_YEAR ? "/" : `/?year=${y}`}
            className={
              y === year
                ? "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            }
          >
            {y}
          </Link>
        ))}
      </nav>

      {orderedMeetings.length === 0 ? (
        <p className="text-zinc-500">No sessions found for {year}.</p>
      ) : (
        <div className="space-y-6">
          {orderedMeetings.map((m) => (
            <section
              key={m.sessions[0].meeting_key}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <header className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-medium">
                  {m.country} · {m.location}
                </h2>
                <span className="text-xs text-zinc-500">
                  {new Date(m.firstDate).toLocaleDateString()}
                </span>
              </header>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {m.sessions.map((s) => (
                  <li key={s.session_key}>
                    <Link
                      href={`/sessions/${s.session_key}`}
                      className="flex items-center justify-between py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <span>
                        <span className="font-medium">{s.session_name}</span>
                        <span className="ml-2 text-zinc-500">
                          {s.session_type}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        {new Date(s.date_start).toLocaleString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
