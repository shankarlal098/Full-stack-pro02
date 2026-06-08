import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'https://leetcode-backend-app.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;

// import.meta.env.VITE_API_URL || "http://localhost:8000"
