import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/** Handle DB yang dipakai repo/service/command: Neon di produksi, PGlite di test, juga `tx` dari db.transaction. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
