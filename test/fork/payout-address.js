const { artifacts, web3, network } = require('hardhat');
const { time } = require('@openzeppelin/test-helpers');
const { to } = require('../utils').helpers;

const NXMaster = artifacts.require('NXMaster');
const MemberRoles = artifacts.require('MemberRoles');
const Governance = artifacts.require('Governance');

describe('payout address update', function () {

  it('passes proposal', async function () {
    const masterAddress = '0x01bfd82675dbcc7762c84019ca518e701c0cd07e';
    const master = await NXMaster.at(masterAddress);

    const { contractsName, contractsAddress } = await master.getVersionData();
    const nameToAddressMap = { NXMTOKEN: await master.dAppToken() };

    for (let i = 0; i < contractsName.length; i++) {
      nameToAddressMap[web3.utils.toAscii(contractsName[i])] = contractsAddress[i];
    }

    const mr = await MemberRoles.at(nameToAddressMap['MR']);
    const gv = await Governance.at(nameToAddressMap['GV']);

    const upgradeMrProposal = 114;
    const upgradeCrProposal = 115;

    console.log('Fetch board members');
    const { memberArray: boardMembers } = await mr.members('1');
    console.log({ boardMembers });

    {
      const isOwnerAMember = await master.isMember(boardMembers[0]);
      assert(isOwnerAMember, 'Before: Owner should be a member');
    }

    const launchedOnBefore = await mr.launchedOn();

    for (const member of boardMembers) {
      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [member],
      });
    }

    console.log('Submitting votes');

    for (const proposalID of [upgradeMrProposal, upgradeCrProposal]) {
      for (let i = 3; i < boardMembers.length; i++) {

        console.log(`Voting for Board member ${i} ${boardMembers[i]}...`);
        const [, voteErr] = await to(gv.submitVote(proposalID, 1, { from: boardMembers[i] }));

        if (voteErr) {
          console.log(`Failed to vote with ${boardMembers[i]}`);
          continue;
        }

        console.log(`Voted succesfully with ${boardMembers[i]}`);
      }

      await time.increase(604800);
      await gv.closeProposal(proposalID, { from: boardMembers[0] });
    }

    {
      const isOwnerAMember = await master.isMember(boardMembers[0]);
      assert(isOwnerAMember, 'Before: Owner should be a member');
    }

    const launchedOnAfter = await mr.launchedOn();
    assert.strictEqual(launchedOnBefore.toString(), launchedOnAfter.toString(), 'launchedOn changed!!!');

    console.log({
      launchedOnBefore: launchedOnBefore.toString(),
      launchedOnAfter: launchedOnAfter.toString(),
    });

  });
});
