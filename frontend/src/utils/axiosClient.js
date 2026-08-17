import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'https://leetcode-backend-app.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;



//  http://localhost:5173

// 'https://leetcode-backend-app.onrender.com'

https://leetcode-backend-app.onrender.com