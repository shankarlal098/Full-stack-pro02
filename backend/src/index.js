const express = require('express')
const app = express();
require('dotenv').config();
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit")
const aiRouter = require("./routes/aiChatting")
const videoRouter = require("./routes/videoCreator");
const codeRouter = require("./routes/codeRouter")
const cors = require('cors')
const imageRouter = require("./routes/imageRouter");

// console.log("Hello")

app.use(cors({
    origin: "https://full-stack-pro02.vercel.app",
    credentials: true,                             
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));



app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);
app.use("/code",codeRouter);
app.use("/image",imageRouter);







const InitalizeConnection = async ()=> {
    try {

        await main();
        console.log("Mongo Connected");

        await redisClient.connect();
        console.log("Redis Connected");

        app.listen(process.env.PORT, ()=>{
            console.log("Server listening");
        });

    } catch(err){
        console.log(err);
    }
}


InitalizeConnection();

