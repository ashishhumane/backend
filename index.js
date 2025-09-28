const express = require('express')
const app = express()
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const analysisRoutes = require('./routes/analysisRoutes')
const db = require('./config/db')
require("dotenv").config();

app.use(
  cors({
    origin: [
      "https://frontend-two-silk-71.vercel.app",
      "http://localhost:8080"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // if you use cookies or auth headers
  })
);

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/api/auth', authRoutes)
app.use('/api/analyse', analysisRoutes)

app.get('/',(req, res) => {
    res.send('hello world')
})

app.listen(3000,() => {
    console.log('server runnning at port 3000');
})