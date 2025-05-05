import React, { useState } from 'react';
import { 
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  FormHelperText,
  CircularProgress,
  Paper
} from '@mui/material';

function UploadForm({ onUpload, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    price: '',
    file: null
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const validateForm = () => {
    if (!formData.title || !formData.artist || !formData.price || !formData.file) {
      setError('Все поля обязательны для заполнения');
      return false;
    }

    if (isNaN(formData.price) || Number(formData.price) <= 0) {
      setError('Укажите корректную цену (число > 0)');
      return false;
    }

    if (formData.file.size > 15 * 1024 * 1024) {
      setError('Максимальный размер файла - 15MB');
      return false;
    }

    if (!formData.file.type.startsWith('audio/')) {
      setError('Поддерживаются только аудиофайлы');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onUpload(
        formData.title,
        formData.artist,
        formData.price,
        formData.file
      );
      // Сброс формы после успешной загрузки
      setFormData({
        title: '',
        artist: '',
        price: '',
        file: null
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Загрузить новое аудио
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Название трека"
          name="title"
          fullWidth
          required
          value={formData.title}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Исполнитель"
          name="artist"
          fullWidth
          required
          value={formData.artist}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Цена (ETH)"
          name="price"
          type="number"
          fullWidth
          required
          value={formData.price}
          onChange={handleChange}
          inputProps={{ min: "0", step: "0.001" }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            disabled={loading}
          >
            {formData.file ? formData.file.name : 'Выберите аудиофайл'}
            <input
              type="file"
              hidden
              accept="audio/*"
              onChange={handleFileChange}
            />
          </Button>
          <FormHelperText>
            Поддерживаемые форматы: MP3, WAV, OGG (макс. 15MB)
          </FormHelperText>
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading || !formData.file}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Публикация...' : 'Опубликовать'}
        </Button>
      </Box>
    </Paper>
  );
}

export default UploadForm;