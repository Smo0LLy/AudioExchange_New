import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { ethers } from 'ethers'; // Добавляем импорт ethers

const AudioList = ({ audios, contract, account }) => {
    const handlePurchase = async (id, price) => {
        try {
          // 1. Проверяем подключение
          if (!account) throw new Error("Кошелёк не подключен");
          
          // 2. Конвертируем цену и проверяем баланс
          const priceWei = ethers.parseEther(price.toString());
          const balance = await provider.getBalance(account);
          if (balance < priceWei) throw new Error("Недостаточно ETH");
      
          // 3. Отправляем транзакцию с увеличенным газом
          const tx = await contract.purchaseAudio(id, {
            value: priceWei,
            gasLimit: 500000 // Увеличиваем лимит газа
          });
      
          // 4. Ждём подтверждения (3 блока)
          const receipt = await tx.wait(3); 
          console.log("Детали транзакции:", receipt);
      
          // 5. Проверяем событие покупки
          const event = receipt.events?.find(e => e.event === "AudioPurchased");
          if (!event) throw new Error("Событие покупки не обнаружено");
      
          alert(`Куплено! ID: ${id}\nTxHash: ${receipt.transactionHash}`);
          
          // 6. Обновляем список (добавьте эту функцию в props)
          if (typeof onPurchased === 'function') onPurchased(); 
      
        } catch (error) {
          console.error("Полная ошибка:", error);
          alert(`Ошибка: ${error.reason || error.message}`);
        }
      };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Доступные аудиозаписи
      </Typography>
      
      {audios.map((audio) => (
        <Paper key={audio.id} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">{audio.title}</Typography>
          <Typography>Исполнитель: {audio.artist}</Typography>
          <Typography>Цена: {audio.price} ETH</Typography>
          {audio.isForSale && (
            <Button
              variant="contained"
              onClick={() => handlePurchase(audio.id, audio.price)}
              sx={{ mt: 1 }}
              disabled={!account} // Блокируем кнопку если кошелек не подключен
            >
              Купить
            </Button>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default AudioList;