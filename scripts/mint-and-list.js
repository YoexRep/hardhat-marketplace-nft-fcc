const { ethers } = require("hardhat")

async function mintAndList() {
    const PRICE = ethers.utils.parseEther("0.1")

    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft") // Obtengo los contratos desplegados en el local blockchain
    console.log("Minting...")
    const mintTx = await basicNft.mintNft() //Minteamos el basic nft, osea lo creamos con el ID
    const mintTxReceipt = await mintTx.wait(1) //Obtenemos el recibo de la transaccion
    const tokenID = mintTxReceipt.events[0].args.tokenId // Con el objetivo de leer el evento emitido por minftNft y obtener el tokenID

    console.log("Approving NFT...")
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenID) // Ahora aprobamos el basicnft para el marketplace
    await approvalTx.wait(1)

    console.log("Listing NFT...")
    const tx = await nftMarketplace.listItem(basicNft.address, tokenID, PRICE) // y por ultimo lo listamo
    await tx.wait(1)
    console.log("Listed!")
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
