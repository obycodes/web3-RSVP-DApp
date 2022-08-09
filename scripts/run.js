// =======================WRITING A TEST SCRIPT=======================
/**
 * Before we deploy our smart contract to a testnet and the mainnet eventually,
 * we can test our smart contract locally to ensure it works as intended.
 */

// Import hardhat 
const hre = require('hardhat');

// use hardhat to deploy the smart contract locally 
const main = async () => {
    const rsvpContractFactory = await hre.ethers.getContractFactory("Web3RSVP");
    const rsvpContract = await rsvpContractFactory.deploy();
    await rsvpContract.deployed();
    console.log("Contract deployed to:", rsvpContract.address);

// To get the deployer wallet address and other addresses interacting with our smart contract
// we use the `getSigners` method

    const [deployer, address1, address2] = await hre.ethers.getSigners();

    // test creating a new event with the mock data below

    let deposit = hre.ethers.utils.parseEther("1");
    let maxCapacity = 3;
    let timestamp = 1718926200;
    let eventDataCID = "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";

    let txn = await rsvpContract.createNewEvent(
        timestamp,
        deposit,
        maxCapacity,
        eventDataCID
    );
    let wait = await txn.wait();
    console.log("NEW EVENT CREATED:", wait.events[0].event, wait.events[0].args);

    let eventID = wait.events[0].args.eventID;
    console.log("EVENT ID:", eventID);

/**
 * By default, Hardhat will call our contract functions from the deployer wallet address. 
 * To call a contract function from another wallet, we can use the .connect(address) modifier.
 * To send our deposit, we can pass in an object as the last parameter with the value set to the deposit amount.
 */

    txn = await rsvpContract.createNewRSVP(eventID, {value: deposit});
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

    txn = await rsvpContract
      .connect(address1)
      .createNewRSVP(eventID, {value: deposit});
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

/**
 * Confirm all of th RSVPs with `confirmAllAttendees`, since we created the event from the
 * deployer address, we have to call this function from the deployer address too.
 */

    txn = await rsvpContract.confirmAllAttendees(eventID);
    wait = await txn.wait();
    wait.events.forEach((event) =>
      console.log("CONFIRMED:", event.args.attendeeAddress)
    );

/**
 * Because we require that the event owner must wait 7 days before withdrawing unclaimed deposits, 
 * it will fail if we try to call this function now.
 * To work around this, hardhat lets us simulate the passing of time. 
 * We can wait 10 years to make sure it's been enough time.
 */

// wait 10 years
    await hre.network.provider.send("evm_increaseTime", [15778800000000]);

    txn = await rsvpContract.withdrawUnclaimedDeposits(eventID);
    wait = await txn.wait();
    console.log("WITHDRAWN:", wait.events[0].event, wait.events[0].args);
};

const runMain = async () => {
    try{
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

runMain();