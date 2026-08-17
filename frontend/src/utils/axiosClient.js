import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'https://backcode-t4o3.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;
