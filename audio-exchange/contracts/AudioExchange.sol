// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AudioExchange {
    struct Audio {
        address owner;
        string title;
        string artist;
        string ipfsHash;
        uint256 price;
        bool isForSale;
    }

    Audio[] public audios;
    mapping(uint256 => address) public audioToOwner;

    event AudioUploaded(
        uint256 indexed id, 
        address indexed owner, 
        string title,
        string ipfsHash,
        uint256 price
    );
    
    event AudioPurchased(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );

    // Проверка модификаторов
    modifier audioExists(uint256 _id) {
        require(_id < audios.length, "Audio does not exist");
        _;
    }

    function uploadAudio(
        string memory _title,
        string memory _artist,
        string memory _ipfsHash,
        uint256 _price
    ) public {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_artist).length > 0, "Artist cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(_price > 0, "Price must be greater than 0");

        uint256 id = audios.length;
        audios.push(Audio({
            owner: msg.sender,
            title: _title,
            artist: _artist,
            ipfsHash: _ipfsHash,
            price: _price,
            isForSale: true
        }));
        
        audioToOwner[id] = msg.sender;
        
        emit AudioUploaded(
            id,
            msg.sender,
            _title,
            _ipfsHash,
            _price
        );
    }

    function purchaseAudio(uint256 _id) 
        public 
        payable 
        audioExists(_id) 
    {
        Audio storage audio = audios[_id];
        
        require(audio.isForSale, "Audio is not for sale");
        require(msg.value >= audio.price, "Insufficient ETH");
        require(msg.sender != audio.owner, "Cannot buy your own audio");

        address seller = audio.owner;
        
        // Обновление данных перед отправкой ETH
        audio.owner = msg.sender;
        audio.isForSale = false;
        audioToOwner[_id] = msg.sender;

        // Отправка ETH
        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "Payment failed");

        emit AudioPurchased(
            _id,
            msg.sender,
            seller,
            msg.value
        );
    }

    function getAudioCount() public view returns (uint256) {
        return audios.length;
    }

    // функция для проверки владельца
    function getAudioDetails(uint256 _id) 
        public 
        view 
        audioExists(_id) 
        returns (
            address owner,
            string memory title,
            string memory artist,
            string memory ipfsHash,
            uint256 price,
            bool isForSale
        ) 
    {
        Audio memory audio = audios[_id];
        return (
            audio.owner,
            audio.title,
            audio.artist,
            audio.ipfsHash,
            audio.price,
            
            audio.isForSale
        );
    }
}