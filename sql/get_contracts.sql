WITH metadata_contracts AS (
    SELECT contract
    FROM metadata
),
transfers AS (
    SELECT
        log_address as contract,
        sum(transactions) as count
    FROM trc20_transfer_agg
    GROUP BY contract
)
SELECT contract, count
FROM transfers
WHERE contract NOT IN metadata_contracts AND count > 1000
ORDER BY count DESC;