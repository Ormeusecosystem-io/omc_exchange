
import axios from 'axios';

const host = process.env.ON_BOADRDING_URL;
const headers = {
  'Content-Type': 'application/json',
};

const instance = axios.create({
  baseURL: `${host}/`,
  headers,
  withCredentials: true,
});

export default instance;