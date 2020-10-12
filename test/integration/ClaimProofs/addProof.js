const { accounts, web3 } = require('@openzeppelin/test-environment');
const { ether } = require('@openzeppelin/test-helpers');
const { toBN } = web3.utils;

const { hex } = require('../utils').helpers;
const { expectThrowsAsync } = require('../utils').expectThrowsAsync;
const { buyCover } = require('../utils/buyCover');
const snapshot = require('../utils').snapshot;
const setup = require('../setup');

require('chai').should();

const [coverHolder] = accounts;

const UNLIMITED_ALLOWANCE = toBN('2')
  .pow(toBN('256'))
  .subn(1);
const initialMemberFunds = ether('2500');

async function initMembers () {
  const { mr, tk, tc } = this;

  const members = [coverHolder];

  for (const member of members) {
    await mr.payJoiningFee(member, { from: member, value: ether('0.002') });
    await mr.kycVerdict(member, true);
    await tk.approve(tc.address, UNLIMITED_ALLOWANCE, { from: member });
    await tk.transfer(member, initialMemberFunds);
  }

  this.allMembers = members;
}

describe('addProof', function () {
  this.timeout(0);
  this.slow(5000);

  before(setup);
  before(initMembers);

  beforeEach(async function () {
    this.snapshotId = await snapshot.takeSnapshot();
  });

  afterEach(async function () {
    await snapshot.revertToSnapshot(this.snapshotId);
  });

  it('should reject proof after a claim for a given cover is submitted', async function () {
    const { qd, cl, qt, p1, cp } = this;
    const rejectReason = 'Claim already submitted';
    const currency = hex('ETH');
    const cover = {
      amount: 1,
      price: '3362445813369838',
      priceNXM: '744892736679184',
      expireTime: '7972408607',
      generationTime: '7972408607001',
      currency,
      period: 61,
      contractAddress: '0xd0a6e6c54dbc68db5db3a091b171a77407ff7ccf',
    };
    await buyCover({ cover, coverHolder, qt, p1 });
    const coverID = await qd.getAllCoversOfUser(coverHolder);
    await cl.submitClaim(coverID[0], { from: coverHolder });
    await expectThrowsAsync(() => cp.addProof(coverID[0], ''));
    await expectThrowsAsync(() => cp.addProof(coverID[0], ''), rejectReason);
  });
});
