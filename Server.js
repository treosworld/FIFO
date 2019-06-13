const express = require('express')
const server = express();
const path = require('path');

server.use(express.json())
server.use(express.urlencoded({extended: true}))

server.use('/api', require('./routes/api').route)
server.use('/', express.static(path.join(__dirname, 'public')))

server.listen(7654)
{
    console.log("Server Started on http://localhost:7654/")
}