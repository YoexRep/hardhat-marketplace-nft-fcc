//Script para guardar el abi y direccion de nuestros contratos desplegados

const { ethers, network } = require("hardhat")

require("dotenv").config()
const fs = require("fs")

const frontEndContractsFile = "../nextjs-nft-marketplace-thegraph-fcc/constants/networkMapping.json"
const fronEndContractRaffleFile =
    "../nextjs-nft-marketplace-thegraph-fcc/constants/networkMappingRaflle.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("updating front end...")
        await updateContractAddresses()
    }
}

async function updateContractAddresses() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")

    const chainId = network.config.chainId.toString()
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile), "utf8")

    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["NftMarketplace"].includes(nftMarketplace.address)) {
            contractAddresses[chainId]["NftMarketplace"].push(nftMarketplace.address)
        }
    } else {
        contractAddresses[chainId] = {
            NftMarketplace: [nftMarketplace.address],
        }
    }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))

    //Actualizar el raffle mapping

    const raffle = await ethers.getContract("RafflePersonalizado")
    const raffleAddresses = JSON.parse(fs.readFileSync(fronEndContractRaffleFile), "utf8")

    if (chainId in raffleAddresses) {
        if (!raffleAddresses[chainId]["RafflePersonalizado"].includes(raffle.address)) {
            raffleAddresses[chainId]["RafflePersonalizado"].push(raffle.address)
        }
    } else {
        raffleAddresses[chainId] = { RafflePersonalizado: [raffle.address] }
    }

    fs.writeFileSync(fronEndContractRaffleFile, JSON.stringify(raffleAddresses))
}

module.exports.tags = ["all", "frontend"]
