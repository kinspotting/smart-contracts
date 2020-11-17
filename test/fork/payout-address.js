const fetch = require('node-fetch');
const { artifacts, run, web3, network } = require('hardhat');

const NXMaster = artifacts.require('NXMaster');
const MemberRoles = artifacts.require('MemberRoles');
const Governance = artifacts.require('Governance');
const NXMToken = artifacts.require('NXMToken');

describe('payout address update', function () {
  this.timeout(0);

  it('passes proposal', async function () {
    const masterAddress = '0x01bfd82675dbcc7762c84019ca518e701c0cd07e';
    const master = await NXMaster.at(masterAddress);

    const { contractsName, contractsAddress } = await master.getVersionData();
    console.log(contractsName);

    const nameToAddressMap = {
      NXMTOKEN: await master.dAppToken(),
    };

    for (let i = 0; i < contractsName.length; i++) {
      nameToAddressMap[web3.utils.toAscii(contractsName[i])] = contractsAddress[i];
    }

    const mr = await MemberRoles.at(nameToAddressMap['MR']);
    const tk = await NXMToken.at(nameToAddressMap['NXMTOKEN']);
    const gv = await Governance.at(nameToAddressMap['GV']);

    console.log('Fetch board members..');
    const members = await mr.members('1');
    const boardMembers = members.memberArray;

    console.log(boardMembers);

    console.log('Impersonating..');
    for (let i = 0; i < boardMembers.length; i++) {
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [boardMembers[i]]
      });
    }

    // TODO: complete fork test here

    const proposalId = 113;

    console.log('Submitting votes..');
    for (let i = 3; i < boardMembers.length; i++) {
      console.log(`Voting for Board member ${i} ${boardMembers[i]}...`);
      await gv.submitVote(proposalId, 1, { from: boardMembers[i] });
    }

    const isOwnerAMember = await mr.isMember(boardMembers[0]);
    console.log({
      isOwnerAMember
    });
  });
});
