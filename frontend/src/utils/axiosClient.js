import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'https://leetcode-backend-app.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;
