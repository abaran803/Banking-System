const express = require('express');
const routes = express.Router();
const pageController = require('../controllers/pageController');

routes.get('/customers', pageController.customers)

routes.get('/transactions', pageController.transactions)

routes.get('/register', pageController.register)

routes.get('/deleteTransaction/:id', pageController.deleteTransactions)

routes.post('/add-customer', pageController.addCustomers)

routes.post('/finalPayment', pageController.finalPayment)

routes.post('/payment', pageController.payment)

routes.post('/success', pageController.success)

routes.get('/donate', pageController.donate)

routes.post('/donate', pageController.donatePost)

routes.post('/donateSuccess', pageController.donateSuccess)

routes.get('/', pageController.home)

routes.get('*', pageController.error)

module.exports = routes;