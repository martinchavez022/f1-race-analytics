import Link from "next/link";
import { notFound } from "next/navigation";
import { getDrivers, getLaps, getSessions } from "@/lib/openf1";
import { LapTimesChart } from "@/components/charts/LapTimesChart";
import type { Driver, Lap } from "@/types/openf1";

interface PageProps {
  params: Promise<{ sessionKey: string }>;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(3);
  return m > 0 ? `${m}:${rest.padStart(6, "0")}` : `${rest}s`;
}

function fastestLap(laps: Lap[]): Lap | null {
  let best: Lap | null = null;
  for (const lap of laps) {
    if (lap.lap_duration == null) continue;
    if (best == null || lap.lap_duration < (best.lap_duration ?? Infinity)) {
      best = lap;
    }
  }
  return best;
}

function averageLap(laps: Lap[]): number | null {
  const valid = laps
    .map((l) => l.lap_duration)
    .filter((d): d is number => d != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export default async function SessionPage({ params }: PageProps) {
  const { sessionKey: rawKey } = await params;
  const sessionKey = Number(rawKey);
  if (!Number.isFinite(sessionKey)) notFound();

  const [sessions, drivers, laps] = await Promise.all([
    getSessions({ session_key: sessionKey }),
    getDrivers({ session_key: sessionKey }),
    getLaps({ session_key: sessionKey }),
  ]);

  const session = sessions[0];
  if (!session) notFound();

  const lapsByDriver = new Map<number, Lap[]>();
  for (const lap of laps) {
    const arr = lapsByDriver.get(lap.driver_number) ?? [];
    arr.push(lap);
    lapsByDriver.set(lap.driver_number, arr);
  }

  const rows = drivers
    .map((d: Driver) => {
      const driverLaps = lapsByDriver.get(d.driver_number) ?? [];
      const best = fastestLap(driverLaps);
      const avg = averageLap(driverLaps);
      return { driver: d, laps: driverLaps, best, avg };
    })
    .sort((a, b) => {
      const av = a.best?.lap_duration ?? Infinity;
      const bv = b.best?.lap_duration ?? Infinity;
      return av - bv;
    });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← All sessions
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {session.location} — {session.session_name}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {session.country_name} · {session.year} ·{" "}
          {new Date(session.date_start).toLocaleString()}
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-medium">Lap times</h2>

        <details
          className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          open
        >
          <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Cómo leer esta gráfica
          </summary>
          <div className="grid gap-3 border-t border-zinc-200 px-5 py-4 text-sm leading-relaxed text-zinc-700 sm:grid-cols-2 dark:border-zinc-800 dark:text-zinc-300">
            <p>
              <strong>Cada línea</strong> representa un piloto. El color viene
              de su equipo; los dos compañeros del mismo equipo se distinguen
              por línea <em>sólida</em> vs <em>punteada</em>.
            </p>
            <p>
              <strong>Eje X:</strong> número de vuelta.{" "}
              <strong>Eje Y:</strong> tiempo de vuelta (más abajo = más rápido).
            </p>
            <p>
              <strong>Huecos en la línea:</strong> vueltas sin tiempo válido —
              vuelta de salida de pits, invalidada o fuera.
            </p>
            <p>
              <strong>Línea amarilla punteada:</strong> la vuelta más rápida de
              toda la sesión — el benchmark absoluto.
            </p>
            <p>
              <strong>Cómo interactuar:</strong> click en un piloto de la
              leyenda para ocultarlo/mostrarlo. Usa el slider inferior o
              arrastra dentro del gráfico para hacer zoom. El tooltip ordena
              los pilotos por tiempo y muestra el delta contra la vuelta más
              rápida.
            </p>
            <p>
              <strong>Qué buscar según el tipo de sesión:</strong>
              <br />• <em>Practice</em>: vueltas de preparación +{" "}
              <em>long runs</em> (ritmo constante con tandas largas).
              <br />• <em>Qualifying</em>: picos bajos = vueltas lanzadas;
              picos altos = vueltas de preparación/cooldown.
              <br />• <em>Race</em>: ritmo que baja con el tanque vacío y sube
              con desgaste de neumáticos. Los saltos grandes son paradas en
              pits o safety car.
            </p>
          </div>
        </details>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <LapTimesChart drivers={drivers} laps={laps} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Driver summary</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2 font-medium">Pos</th>
                <th className="px-4 py-2 font-medium">Driver</th>
                <th className="px-4 py-2 font-medium">Team</th>
                <th className="px-4 py-2 font-medium">Laps</th>
                <th className="px-4 py-2 font-medium">Fastest</th>
                <th className="px-4 py-2 font-medium">On lap</th>
                <th className="px-4 py-2 font-medium">Avg (valid)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.driver.driver_number}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-4 py-2 font-mono">{i + 1}</td>
                  <td className="px-4 py-2">
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ backgroundColor: `#${r.driver.team_colour}` }}
                    />
                    {r.driver.full_name}{" "}
                    <span className="text-zinc-500">
                      ({r.driver.name_acronym})
                    </span>
                  </td>
                  <td className="px-4 py-2">{r.driver.team_name}</td>
                  <td className="px-4 py-2 font-mono">{r.laps.length}</td>
                  <td className="px-4 py-2 font-mono">
                    {r.best?.lap_duration != null
                      ? formatSeconds(r.best.lap_duration)
                      : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {r.best?.lap_number ?? "—"}
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {r.avg != null ? formatSeconds(r.avg) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
