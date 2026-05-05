// API Configuration for different environments
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const getApiBaseUrl = () => {
  return API_BASE_URL;
};

const apiConfig = {
  API_BASE_URL
};

export default apiConfig;
