const plimit = require("p-limit");
const { getTokenBalances } = require('../helper/chain/keeta');
const ADDRESSES = require('../helper/coreAssets.json');

const SUPPORTED_TOKENS = [
  ADDRESSES.keeta.KTA,
  ADDRESSES.keeta.USDC,
  ADDRESSES.keeta.EURC,
]

const POOLS = [
  // MURF liquidity pool
  'keeta_aqg2mcrdbifrpfw57ufyarexbesztnbqbey446mpykhmacjpskod6x44tvwkg',
  // Proxy Anchor liquidity pool
  'keeta_aabw6ptynqvk6vc76fdgzdozi72ytey2jnbrdvzdavl6643e5zydwams3visioy',
]

const limit = plimit(10);

async function tvl(api) {
  const results = await Promise.all(
    POOLS.map(pool => limit(() => getTokenBalances(pool, api.timestamp, SUPPORTED_TOKENS))),
  );

  const aggregatedBalances = new Map();
  for (const result of results) {
    for (const [token, balance] of result) {
      if (!aggregatedBalances.has(token)) {
        aggregatedBalances.set(token, 0n);
      }

      aggregatedBalances.set(
        token,
        aggregatedBalances.get(token) + balance,
      );
    }
  }

  for (const [token, balance] of aggregatedBalances) {
    api.add(token, balance);
  }
}

module.exports = {
  methodology: 'TVL is calculated as the sum of all KTA tokens held in liquidity pool accounts.',
  // Date of Murphy FX anchor release
  start: '2025-11-21',
  keeta: {
    tvl,
  }
}
