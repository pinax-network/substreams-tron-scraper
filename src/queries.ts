import bun from "bun";
import { query } from "../lib/clickhouse";

const sql = await bun.file("./sql/get_contracts.sql").text();

export async function get_contracts() {
    const result = await query<{ contract: string }>(sql, {});
    return result.data.map(row => row.contract);
}