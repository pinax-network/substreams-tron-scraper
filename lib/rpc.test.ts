
/** -----------------------------------------------------------------------
 *  Decoders (optional helpers)
 *  ---------------------------------------------------------------------*/

import { callContract, decodeUint256 } from "./rpc";

(async () => {
  const log_address = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // TRC-20 USDT
  const account = "TXFBqBbqJommqZf7BV8NNYzePh97UmJodJ";                          // TRON base58 address

  // decimals() - no args (old 3-arg style still works)
  const decHex = await callContract(log_address, "decimals()", 3);
  const decimals = Number(decodeUint256(decHex));

  // balanceOf(address) - with args (new 4-arg style)
  const balHex = await callContract(log_address, "balanceOf(address)", [account], { retries: 4, timeoutMs: 12_000 });
  const bal = decodeUint256(balHex);

  console.log({ log_address, account, decimals, balance: bal.toString() });
})();
