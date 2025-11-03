import { client } from "../lib/clickhouse";

interface Token {
    contract: string;
    symbol: string;
    name: string;
    decimals: number;
}

export async function insert_metadata(token: Token) {
    client.insert({
        table: 'metadata',
        format: 'JSONEachRow',
        values: [token],
    });
}