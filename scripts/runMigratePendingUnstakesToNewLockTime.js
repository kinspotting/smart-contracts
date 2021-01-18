require('dotenv').config();

const { ether } = require('@openzeppelin/test-helpers');
const Web3 = require('web3');
const { getenv, hex, init } = require('../lib/helpers');
const { toBN } = Web3.utils;

async function run () {

  const { account: owner, loader, network, provider } = await init();
  const web3 = new Web3(provider);

  const POOLED_STAKING_ADDRESS = '';

  const ps = loader.fromArtifact('PooledStaking').at(POOLED_STAKING_ADDRESS);

  const gasPrice = 50e9;
  const gas = 6e6;
  const MAX_ITERATIONS = 200;

  let finished = false;
  let totalGasUsed = 0;
  let callCount = 0;

  while (!finished) {
    const tx = await ps.migratePendingUnstakesToNewLockTime(MAX_ITERATIONS, { gas, gasPrice });
    console.log('tx.receipt.gasUsed', tx.receipt.gasUsed);
    totalGasUsed += tx.receipt.gasUsed;
    const [lockTimeMigrationCompleted] = tx.logs.filter(log => log.event === 'LockTimeMigrationCompleted');
    finished = lockTimeMigrationCompleted.args.finished;
    console.log('startUnstakeIndex', lockTimeMigrationCompleted.args.startUnstakeIndex.toString());
    console.log('endUnstakeIndex', lockTimeMigrationCompleted.args.endUnstakeIndex.toString());
    console.log(`Processing migration finished: ${finished}`);
    callCount++;
    console.log({
      callCount,
      totalGasUsed,
      finished,
    });
  }

  console.log('Done');

  const UNSTAKE_LOCK_TIME = await ps.UNSTAKE_LOCK_TIME();
  console.log({
    UNSTAKE_LOCK_TIME: UNSTAKE_LOCK_TIME.toString(),
  });
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('An unexpected error encountered:', error);
    process.exit(1);
  });
