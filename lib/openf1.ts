import type { Driver, Lap, Session } from "@/types/openf1";

const BASE_URL = process.env.OPENF1_BASE_URL ?? "https://api.openf1.org/v1";

type QueryValue = string | number | boolean;

export async function fetchOpenF1<T>(
  endpoint: string,
  params?: Record<string, QueryValue>,
): Promise<T[]> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`OpenF1 ${res.status} ${res.statusText}: ${url.toString()}`);
  }
  return res.json() as Promise<T[]>;
}

export function getDrivers(params: {
  session_key?: number;
  driver_number?: number;
}): Promise<Driver[]> {
  return fetchOpenF1<Driver>("/drivers", params);
}

export function getSessions(params: {
  session_key?: number;
  year?: number;
  country_code?: string;
}): Promise<Session[]> {
  return fetchOpenF1<Session>("/sessions", params);
}

export function getLaps(params: {
  session_key: number;
  driver_number?: number;
  lap_number?: number;
}): Promise<Lap[]> {
  return fetchOpenF1<Lap>("/laps", params);
}
