import { PinataSDK } from 'pinata';

// Инициализация клиента Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.REACT_APP_PINATA_JWT
});

export const uploadToIPFS = async (file) => {
  try {
    console.log('Начало загрузки файла в Pinata...');
    
    const result = await pinata.upload.public.file(file, {
      pinataMetadata: {
        name: file.name,
        keyvalues: {
          app: 'AudioExchange'
        }
      }
    });
    
    console.log('✅ Файл успешно загружен:', {
      cid: result.cid,
      size: result.size,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.cid}`
    });
    
    return result.cid;
    
  } catch (error) {
    console.error('❌ Ошибка загрузки:', {
      message: error.message,
      details: error.response?.data || 'Проверьте JWT и доступы'
    });
    throw new Error(`Ошибка загрузки: ${error.message}`);
  }
};