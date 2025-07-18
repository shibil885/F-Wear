const express = require('express')
const session = require('express-session')
require('dotenv').config()
const nocache = require('nocache')
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
const mongoose = require('mongoose')

const app = express()
//port
const port = process.env.PORT


//setting view engine
app.set('view engine', 'ejs')


//nocache
app.use(nocache())

//parsing data
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//setting paths 
app.use('/assets', express.static('public/assets'));
app.use(express.static('upload'))


// creating session
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}))


//to handle route
app.use('/', userRouter)
app.use('/', adminRouter)
app.use((req, res, next) => {
    res.status(404).render('error', {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        url: req.originalUrl,
    });
});


//connecting data base
mongoose.connect(process.env.MONGODB)
const db = mongoose.connection
db
    .on("error", (error) => {
        console.log(error);
    })
    .once('open', () => {
        console.log('Mongodb server is connected');
    })
// app.use((error,req,res,next)=>{
//     res.locals.message  = error.message
//     res.status(error.status || 500)
//     console.log(error);
//     res.render('error')
// })

app.listen(port, () => {
    console.log(`server on http://localhost:${port}`);
})