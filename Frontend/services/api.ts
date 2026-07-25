import axios from 'axios';

// Tạo một instance của axios với các thiết lập mặc định
const api = axios.create({
  // Dựa vào Swagger của bạn, port đang chạy là 5068
  baseURL: 'http://localhost:5068/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;