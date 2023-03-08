// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//Errores
error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketplace();

contract NftMarketplace is ReentrancyGuard {
    //VARIABLES

    //Structuras
    struct Listing {
        uint256 price;
        address seller;
    }

    //Mapping de un mapping: mapearemos cada direccion de los nft con la estructura que guardar el precio y la direccio del vendedor
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    //Eventos
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    function listItem(address nftAddress, uint256 tokenId, uint256 price) external {
        if (price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }

        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketplace();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }
}
