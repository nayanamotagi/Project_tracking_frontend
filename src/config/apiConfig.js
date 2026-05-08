const API_BASE_URL = process.env.REACT_APP_API_URL;

export const getApiBaseUrl = () => {
  return API_BASE_URL;
};

const apiConfig = {
  API_BASE_URL
};

export default apiConfig;