
/** -----------------------------------------------------------------------
 *  Decoders (optional helpers)
 *  ---------------------------------------------------------------------*/

import { abi, callContract, decodeUint256 } from "./rpc";

(async () => {
  const log_address = "TCCA2WH8e1EJEUNkt1FNwmEjWWbgZm28vb"; // TRC-20 contract address
  const account = "TXFBqBbqJommqZf7BV8NNYzePh97UmJodJ"; // TRON address

  // decimals()
  const decHex = await callContract(log_address, "decimals()");
  const decimals = Number(decodeUint256(decHex));
  const nameHex = await callContract(log_address, "name()");
  const [name] = abi.decode(["string"], "0x" + nameHex.replace(/^0x/, ""));
  const symbolHex = await callContract(log_address, "symbol()");
  const [symbol] = abi.decode(["string"], "0x" + symbolHex.replace(/^0x/, ""));

  // balanceOf(address) - with args (new 4-arg style)
  const balHex = await callContract(log_address, "balanceOf(address)", [account], { retries: 4, timeoutMs: 12_000 });
  const bal = decodeUint256(balHex);

  console.log({ log_address, account, decimals, name, symbol, balance: bal.toString() });
})();
