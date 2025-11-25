import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getDetections = async () => {
  const response = await axios.get(`${API_URL}/detections`);
  return response.data;
};

export const saveDetection = async (detectionData) => {
  const response = await axios.post(`${API_URL}/detections`, detectionData);
  return response.data;
};

export const deleteDetection = async (id) => {
  const response = await axios.delete(`${API_URL}/detections/${id}`);
  return response.data;
};