//import connectDB from './backend/config/db.js'



import api from './backend/routes/XummApi.js'

import express from 'express'
import dotenv  from 'dotenv'

import bodyParser from 'body-parser'



//connect database
//connectDB()

//dotenv config
dotenv.config()

const app = express()

app.use(bodyParser.json({limit: '50mb', type: 'application/json'}));


app.use(bodyParser.json())


//Creating API for user
app.use('/api', api)



const PORT = process.env.PORT

//Express js listen method to run project on http://localhost:5000
app.listen(PORT, console.log(`App is running in ${process.env.NODE_ENV} mode on port ${PORT}`))


