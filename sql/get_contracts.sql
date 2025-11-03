WITH metadata_contracts AS (
    SELECT contract
    FROM metadata
)
SELECT log_address as contract, count()
FROM trc20_transfer_agg
WHERE contract NOT IN metadata_contracts
GROUP BY contract
ORDER BY count() DESC
LIMIT 10000;