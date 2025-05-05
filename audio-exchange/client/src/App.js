import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
    Box, 
    Button, 
    Typography, 
    Snackbar, 
    Alert,
    CircularProgress 
  } from '@mui/material';
import AudioList from './components/AudioList';
import UploadForm from './components/UploadForm';
import { uploadToIPFS } from './utils/ipfs';

// Конфигурация контракта (вынесено в отдельный файл)
import { contractAddress, contractABI } from './config/config.js';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Подключение кошелька
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Установите MetaMask для продолжения");
      }

      setLoading(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const audioContract = new ethers.Contract(contractAddress, contractABI, signer);
      setAccount(accounts[0]);
      setContract(audioContract);
      await loadAudios(audioContract);
      
      showSnackbar('Кошелек успешно подключен', 'success');
    } catch (error) {
      console.error("Ошибка подключения:", error);
      showSnackbar(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка аудиофайлов
  const loadAudios = async (contract) => {
    try {
      const count = await contract.getAudioCount();
      const loadedAudios = await Promise.all(
        Array.from({ length: Number(count) }, async (_, i) => {
          const audio = await contract.audios(i);
          return {
            id: i,
            title: audio.title,
            artist: audio.artist,
            ipfsHash: audio.ipfsHash,
            price: ethers.formatEther(audio.price),
            owner: audio.owner,
            isForSale: audio.isForSale,
          };
        })
      );
      setAudios(loadedAudios);
    } catch (error) {
      console.error("Ошибка загрузки аудио:", error);
      showSnackbar("Не удалось загрузить аудиофайлы", 'error');
    }
  };

  // Обработка загрузки файла
  const handleUpload = async (title, artist, price, file) => {
    if (!contract || !account) {
      throw new Error("Требуется подключение кошелька");
    }

    try {
      setLoading(true);
      
      // 1. Загрузка в IPFS
      const ipfsHash = await uploadToIPFS(file);
      showSnackbar('Файл успешно загружен в IPFS', 'success');
      
      // 2. Запись в блокчейн
      const tx = await contract.uploadAudio(
        title,
        artist,
        ipfsHash,
        ethers.parseEther(price),
        { gasLimit: 500000 }
      );
      
      await tx.wait();
      await loadAudios(contract);
      showSnackbar('Аудио успешно опубликовано!', 'success');
      
      return true;
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      throw parseBlockchainError(error);
    } finally {
      setLoading(false);
    }
  };

  // Парсинг ошибок блокчейна
  const parseBlockchainError = (error) => {
    if (error.message.includes("user rejected transaction")) {
      return new Error("Транзакция отклонена пользователем");
    }
    if (error.message.includes("insufficient funds")) {
      return new Error("Недостаточно ETH для оплаты газа");
    }
    return error;
  };

  // Управление уведомлениями
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Инициализация
  useEffect(() => {
    const init = async () => {
      if (window.ethereum?.isConnected()) {
        await connectWallet();
      }
    };
    init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Децентрализованный аудиообменник
        </Typography>

        {!account ? (
          <Box textAlign="center" mt={4}>
            <Button
              onClick={connectWallet}
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading && <CircularProgress size={24} />}
            >
              {loading ? 'Подключение...' : 'Подключить MetaMask'}
            </Button>
          </Box>
        ) : (
          <>
            <Typography align="center" paragraph>
              Подключен: {`${account.slice(0, 6)}...${account.slice(-4)}`}
            </Typography>

            <UploadForm 
              onUpload={handleUpload} 
              loading={loading} 
            />

            <Box mt={4}>
              <AudioList 
                audios={audios} 
                contract={contract} 
                account={account}
                onPurchase={() => loadAudios(contract)}
              />
            </Box>
          </>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;