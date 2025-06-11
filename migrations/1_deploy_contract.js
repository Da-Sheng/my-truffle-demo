// const HappyBag = artifacts.require("HappyBag");
// const JJCoin = artifacts.require("JJCoin");
// const JJTicket = artifacts.require("JJTicket");
const dataToChain = artifacts.require("dataToChain");

module.exports = async function (deployer) {
  deployer.deploy(dataToChain);
  // 首先部署JJCoin
  // await deployer.deploy(JJCoin);
  // const jjCoinInstance = await JJCoin.deployed();

  // // 然后部署其他合约
  // // await deployer.deploy(HappyBag);

  // // 最后部署JJTicket，传入JJCoin地址和其他参数
  // const ticketPrice = web3.utils.toWei("10", "ether"); // 10 JJCoin (假设18位小数)
  // const totalTickets = 10000; // 总票数

  // await deployer.deploy(
  //   JJTicket,
  //   jjCoinInstance.address,  // JJCoin合约地址
  //   ticketPrice,             // 门票价格
  //   totalTickets             // 总票数
  // );

  // console.log("JJCoin deployed at:", jjCoinInstance.address);
  // console.log("JJTicket deployed with price:", web3.utils.fromWei(ticketPrice, "ether"), "JJCoin");
  // console.log("Total tickets available:", totalTickets);
};