require('dotenv').config()
const express = require('express');
const bodyparser = require('body-parser')
const app = express();
const routes = require('./routes/routes');
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())
app.use(routes);

app.listen(PORT, () => {
    console.log('Server started at', PORT);
})