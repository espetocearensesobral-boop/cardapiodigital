import postgres from "postgres";

let client: postgres.Sql | undefined;

function getConnectionString() {
  const value = process.env["POSTGRES_URL"] ?? process.env["DATABASE_URL"];

  if (!value) {
    throw new Error(
      "Database is not configured. Add POSTGRES_URL (or DATABASE_URL) to the Vercel project environment.",
    );
  }

  return value;
}

export function getDb() {
  if (!client) {
    client = postgres(getConnectionString(), {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      onnotice: () => undefined,
    });
  }

  return client;
}
