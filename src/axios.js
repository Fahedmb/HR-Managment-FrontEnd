import axios from 'axios';


axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:9090';

export default axios;
