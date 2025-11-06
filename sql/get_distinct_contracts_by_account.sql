SELECT DISTINCT log_address
FROM trc20_transfer_agg
WHERE account = {account:String}