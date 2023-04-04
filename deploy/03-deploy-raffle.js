const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const VRFCoordinatorContract = networkConfig[80001].vrfCoordinatorV2
    const SuscriptionId = networkConfig[80001].subscriptionId
    const GasLane = networkConfig[80001].gasLane
    const Interval = networkConfig[80001].keepersUpdateInterval
    const EntranceFee = networkConfig[80001].entranceFee
    const callbackGasLimit = networkConfig[80001].callbackGasLimit

    const arguments = [
        VRFCoordinatorContract,
        SuscriptionId,
        GasLane,
        Interval,
        EntranceFee,
        callbackGasLimit,
    ]

    const nftMarketplace = await deploy("RafflePersonalizado", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmation || 1,
    })

    /* if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(nftMarketplace.address, arguments)
    }*/

    log("-----------------------------------------------------------------")
}

module.exports.tags = ["all", "rafflepersonalizado"]
