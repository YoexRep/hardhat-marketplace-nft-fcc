// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//Errores
error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketplace();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotOwner();
error NftMarketplace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error NftMarketplace__NoProceeds();
error NftMarketplace__TransferFailed();
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);

contract NftMarketplace is ReentrancyGuard {
    //VARIABLES

    //Structuras
    struct Listing {
        uint256 price;
        address seller;
    }

    //MAPPINGS
    //Mapping de un mapping: mapearemos cada direccion de los nft con la estructura que guardar el precio y la direccio del vendedor
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    mapping(address => uint256) private s_proceeds;

    //Eventos
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftaddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 tokenId);

    //MODIFIERS
    //Este modifiar me valida si el nft aun no esta en el marketplace, eso lo logro preguntado si tiene un precio mayor a 0.
    modifier notListed(
        address nftaddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftaddress][tokenId];

        if (listing.price > 0) {
            revert NftMarketplace__AlreadyListed(nftaddress, tokenId);
        }

        _; //PAra que primero se cumpla el modifier
    }

    //Este modifiera me valida si la persona que esta interactuando con su wallet es el dueño del nft, usando la direccion del nft, y el token id
    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);

        if (spender != owner) {
            revert NftMarketplace__NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    //FUNCIONES

    //Metodo para listar en el marketplace los nft
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress, tokenId, msg.sender) {
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

    //Metodo para comprar nft, solo necesito el address del nft y el tokenId, y hacerlo payable, para que cuando se ejecute, me salga la cantidad de dinero que quiero enviar
    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable isListed(nftAddress, tokenId) {
        //Ahora valido si el precio enviado es el mismo que el precio de venta
        Listing memory listedItem = s_listings[nftAddress][tokenId]; //--> obtengo el item que se quiere comprar, lo paso a una variable de memoria para ahorrar gas.

        if (msg.value < listedItem.price) {
            revert NftMarketplace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        s_proceeds[listedItem.seller] += msg.value; //Actualizamos este mapping, con las ganacias de cada persona
        delete (s_listings[nftAddress][tokenId]); // luego eliminamos del listado del marketplace el nft

        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId); //Luego de eliminar del listado el nft, lo envaimos a la direcion que lo acaba de comprar
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price); //Emitos un eventos cuando se produce la Compra
    }

    //Metodo para cancelar un nft del listado del marketplace.abi
    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    //Metodo para actualizar el precio del nft
    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    //Metodo para sacar las ganacias, ya que no es buena practica enviar el dinero al momento de vender un nft, porque el usuario puede pensar que no se le envio nada

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender]; //Primero guardamos los beneficios del usuario en una variable

        if (proceeds <= 0) {
            revert NftMarketplace__NoProceeds(); // En caso de que esos beneficios sean menor o igual a 0, simplemente revertimos con un error
        }

        s_proceeds[msg.sender] = 0; //En caso de seguir limpiamos nuestro array de s_procees, antes de enviar el dinero, recordar siempre el reentracy attack

        (bool success, ) = payable(msg.sender).call{value: proceeds}(""); // En esta parte simplemente hacemos uso de la funcion call de bajo nivel, para invocar una transaccion, y usar su atributo value, para enviar dinero.
        if (!success) {
            revert NftMarketplace__TransferFailed();
        }
    }

    //GETTERS

    //Metodo que me devuelve un objeto Listing el cual me contiene  el precio y el vendedor, pasandole el nftaddress y tokeid
    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    //Metodo para obtener las ganacias de un vendedor pasandole la direccion de wallet, y retornando un numero entero.
    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
