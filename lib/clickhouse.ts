import { createClient } from '@clickhouse/client';

export const clickhouseClient = createClient({
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DATABASE || 'default',
});

export interface TokenData {
    token: string;
    token_symbol: string;
    token_name: string;
    token_decimals: number;
    feed: string;
    is_stakable: boolean;
    is_active: boolean;
}

export interface QueryMetrics {
    httpRequestTimeMs: number;
    dataFetchTimeMs: number;
    totalTimeMs: number;
}

export interface TokenDataWithMetrics {
    data: TokenData[];
    metrics: QueryMetrics;
}

export async function getActiveTokens(): Promise<TokenDataWithMetrics> {
    const contractAddress = process.env.CONTRACT_ADDRESS || '0xdca00000067413240aeab357a3a89ea352d013e8';

    const query = `
    WITH latest_token_props AS (
      SELECT
        stp.token, stp.token_symbol, stp.token_name,
        stp.token_decimals, stp.feed, stp.is_stakable,
        ROW_NUMBER() OVER (PARTITION BY stp.token ORDER BY stp.block_num DESC) as rn
      FROM set_token_props stp
      JOIN blocks ON stp.block_hash = blocks.block_hash
      WHERE lower(stp.contract) = lower({contractAddress:String})
    ),
    latest_token_state AS (
      SELECT
        sts.token, sts.is_active,
        ROW_NUMBER() OVER (PARTITION BY sts.token ORDER BY sts.block_num DESC) as rn
      FROM set_token_state sts
      JOIN blocks ON sts.block_hash = blocks.block_hash
      WHERE lower(sts.contract) = lower({contractAddress:String})
    )
    SELECT
      ltp.token, ltp.token_symbol, ltp.token_name,
      ltp.token_decimals, ltp.feed, ltp.is_stakable,
      lts.is_active
    FROM latest_token_props ltp
    INNER JOIN latest_token_state lts ON ltp.token = lts.token
    WHERE ltp.rn = 1 AND lts.rn = 1 AND lts.is_active = true
    ORDER BY ltp.token_symbol ASC
  `;

    // Track total operation time
    const startTime = performance.now();

    try {
        // Track query execution time
        const queryStartTime = performance.now();
        const resultSet = await clickhouseClient.query({
            query,
            query_params: {
                contractAddress,
            },
            format: 'JSONEachRow',
        });
        const queryEndTime = performance.now();

        // Track data parsing time
        const parseStartTime = performance.now();
        const data = await resultSet.json();
        const parseEndTime = performance.now();

        const endTime = performance.now();

        // Calculate times
        const httpRequestTimeMs = Math.round((queryEndTime - queryStartTime) * 100) / 100;
        const dataFetchTimeMs = Math.round((parseEndTime - parseStartTime) * 100) / 100;
        const totalTimeMs = Math.round((endTime - startTime) * 100) / 100;

        return {
            data: data as TokenData[],
            metrics: {
                httpRequestTimeMs,
                dataFetchTimeMs,
                totalTimeMs,
            },
        };
    } catch (error: unknown) {
        // Enhanced error logging with connection details
        const url = process.env.CLICKHOUSE_URL || 'http://localhost:8123';
        const urlObj = new URL(url);
        const host = urlObj.hostname;

        const err = error as Error & { cause?: { code?: string; message?: string } };

        console.error('\n=== ClickHouse Connection Error ===');
        console.error('Connection URL:', url);
        console.error('Host:', host);
        console.error('Error Type:', err.constructor.name);
        console.error('Error Message:', err.message);

        if (err.cause) {
            console.error('Error Cause:', err.cause);
            if (err.cause.code) {
                console.error('Error Code:', err.cause.code);
            }
            if (err.cause.message) {
                console.error('Cause Message:', err.cause.message);
            }
        }

        // Log timeout information if available
        if (err.message && err.message.includes('timeout')) {
            console.error('Timeout Details: Connection timeout occurred');
            console.error('Attempted Address:', `${host}:${urlObj.port || (urlObj.protocol === 'https:' ? 443 : 8123)}`);
        }

        console.error('Stack Trace:', err.stack);
        console.error('===================================\n');

        // Re-throw with enhanced message
        throw new Error(`Failed to connect to ClickHouse at ${url}: ${err.message}`);
    }
}