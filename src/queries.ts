import bun from "bun";
import { query } from "../lib/clickhouse";


export async function get_contracts() {
    const sql = await bun.file("./sql/get_contracts.sql").text();
    const result = await query<{ contract: string }>(sql, {});
    return result.data.map(row => row.contract);
}

export async function get_distinct_accounts() {
    const sql = await bun.file("./sql/get_distinct_accounts.sql").text();
    const result = await query<{ account: string }>(sql, { });
    return result.data.map(row => row.account);
}

export async function get_distinct_contracts_by_account(account: string) {
    const sql = await bun.file("./sql/get_distinct_contracts_by_account.sql").text();
    const result = await query<{ log_address: string }>(sql, { account });
    return result.data.map(row => row.log_address);
}