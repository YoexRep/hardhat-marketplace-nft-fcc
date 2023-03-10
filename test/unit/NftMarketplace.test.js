const { inputToConfig } = require("@ethereum-waffle/compiler")
const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip // si es una testnet, hago el skip de mi pruebas unitarias
    : describe("Nft Marketplace Tests", function () {
          let nftMarketplace, basicNft, deployer, player

          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async function () {
              //deployer = (await getNamedAccounts()).deployer //obtengo la direccion del deployer
              //  player = (await getNamedAccounts()).player //Obtengo la direccion de la 2da wallet llamada player

              accounts = await ethers.getSigners()

              deployer = accounts[0]
              // Cambie el getNameAccount por getSigners, ya que esto es un objeto diferente, incluso me paso que cuando estaba buscando los procees
              //Si no indicaba deployer.address este me daba un error. osea en resumen, getNamedAccounts me devuelve el hash de mi cuenta, mientras que signer me devuelve un objeto de la cuenta.

              player = accounts[1]

              await deployments.fixture(["all"]) //Aqui espero que se ejecute todos los deplyos, que son el 01- deploy nft-marketplace.js y 02-deploy-basic-nft

              nftMarketplace = await ethers.getContract("NftMarketplace")
              basicNft = await ethers.getContract("BasicNft")

              await basicNft.mintNft()

              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })

          it("lists and can be bought", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

              const playerConnectedNftMarketplace = nftMarketplace.connect(player)
              await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                  value: PRICE,
              })

              const newOwner = await basicNft.ownerOf(TOKEN_ID)
              const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)

              assert(newOwner.toString() == player.address)
              assert(deployerProceeds.toString() == PRICE.toString())
          })

          //Pruebas unitarias para cada metodo

          describe("buyItem", function () {
              it("reverts if price isnt met", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const PRICE_bajo = ethers.utils.parseEther("0.05")

                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE_bajo,
                      })
                  ).to.be.revertedWith("NftMarketplace__PriceNotMet")
              })
          })

          //Solo poder cancelar si soy el dueño-- NftMarketplace__NotOwner
          describe("cancelListing", function () {
              it("cant cancel if i not the owner", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  nftMarketplace = nftMarketplace.connect(player)
                  await basicNft.approve(player.address, TOKEN_ID)

                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })
          })

          //Actualizado el precio luego listado

          describe("updateListing", function () {
              it("updates the price of the item", async function () {
                  const updatedPrice = ethers.utils.parseEther("0.2")
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(
                      await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, updatedPrice)
                  ).to.emit("ItemListed")
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == updatedPrice.toString())
              })
          })
      })
