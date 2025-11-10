SELECT DISTINCT account
FROM trc20_transfer_agg
WHERE account NOT IN (
    SELECT account
    FROM trc20_balances_rpc
)
LIMIT 1000000