const fetch = require('node-fetch');
const { artifacts, run, web3 } = require('hardhat');

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

    // TODO: complete fork test here
  });
});
