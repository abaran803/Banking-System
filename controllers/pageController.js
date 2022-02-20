const ejs = require('ejs');
const path = require('path');
const { ObjectId } = require('mongodb');
const { services } = require('../services');
const nodemailer = require('nodemailer');
const navs = [{ name: 'Home', href: '/' }, { name: 'Our Customers', href: '/customers' }, { name: 'All Transactions', href: '/transactions' }, { name: 'Registers', href: '/register' }]
const { addCustomer, showTransactions, showCustomers, deleteTransaction, findCustomersById, addTransaction, transfer } = require('../mongo');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.PWD
    }
});

const sendReciptForTransfer = async (from, to, amount, res) => {
    const customerA = await findCustomersById(from);
    const customerB = await findCustomersById(to);
    ejs.renderFile(path.join(__dirname, '..', 'views') + '\\paymentMail.ejs', { customerA, customerB, amount }, function (err, data) {
        if (err) {
            console.log(err);
            res.send("Some error occured while generating template for mail");
        } else {
            let message = {
                from: process.env.EMAIL_ID,
                to: process.env.EMAIL_ID2,
                subject: "Transfer Information",
                html: data
            }
            transporter.sendMail(message, function (err, info) {
                if (err) {
                    console.log("Some error occured while sending mail");
                    res.send("<h1>Unable to send recipt now</h1>")
                } else {
                    console.log(info);
                    res.send("<h1>Transaction Successful</h1><p><a href='/'>Go to Homepage</a></p>")
                }
            })
        }
    });
}

const sendReciptForDonation = async (name, amount, email, res) => {
    const date = new Date();
    const currentDate = `${date.getDate()}/${date.getTime}/${date.getFullYear()}`;
    const currentTime = date.getTime();
    ejs.renderFile(path.join(__dirname, '..', 'views') + '\\donateMail.ejs', { name, amount, currentDate, currentTime, email }, function (err, data) {
        if (err) {
            console.log(err);
            res.send("Some error occured while creating template for email");
        } else {
            let message = {
                from: process.env.EMAIL_ID,
                to: process.env.EMAIL_ID2,
                subject: "Thanks for Supporting Us",
                html: data
            }
            transporter.sendMail(message, function (err, info) {
                if (err) {
                    console.log("Some error occured while sending mail");
                    res.send("<h1>Unable to send recipt now</h1>")
                } else {
                    console.log(info);
                    res.render('finalDonate', { name, amount });
                }
            })
        }
    });
}

exports.customers = async (req, res) => {
    let customers = await showCustomers();
    customers = customers.sort((a, b) => {
        if (a.date.getTime() > b.date.getTime()) {
            return -1;
        }
        if (a.date.getTime() < b.date.getTime()) {
            return 1;
        }
        return 0;
    })
    if (!customers) {
        return res.send('<h1>Unable to fetch data</h1>')
    }
    res.render('customers.ejs', { pageTitle: 'GRIP | CUSTOMERS', navs: navs, selectedNav: 'Our Customers', customers: customers })
}

exports.transactions = async (req, res) => {
    let transactions = await showTransactions()
    transactions = transactions.sort((a, b) => {
        if (a.date.getTime() > b.date.getTime()) {
            return -1;
        }
        if (a.date.getTime() < b.date.getTime()) {
            return 1;
        }
        return 0;
    })
    if (!transactions) {
        return res.send('<h1>Unable to fetch data</h1>')
    }
    res.render('transactions.ejs', { pageTitle: 'GRIP | TRANSACTIONS', navs: navs, selectedNav: 'All Transactions', transactions: transactions })
}

exports.register = (req, res) => {
    res.render('register.ejs', { pageTitle: 'GRIP | REGISTER', navs: navs, selectedNav: 'Registers' })
}

exports.home = (req, res) => {
    res.render('home.ejs', { pageTitle: 'GRIP | HOME', bannerTitle: 'GRIP BANK', bankIcon: true, services: services, navs: navs, selectedNav: 'Home' })
}

exports.donate = (req, res) => {
    res.render('donate.ejs', { pageTitle: 'GRIP | DONATE', navs: navs, selectedNav: 'Donate' })
}

exports.deleteTransactions = async (req, res) => {
    const id = req.params.id;
    const deletedData = await deleteTransaction(id);
    if (!deletedData) {
        res.send("<h1>Unable to delete transaction</h1>")
    }
    res.redirect('/transactions');
}

exports.addCustomers = async (req, res) => {
    const name = req.body.username;
    const email = req.body.email;
    const total = 1000;
    const result = await addCustomer(name, email, total);
    if (!result) {
        return res.send("<h1>Something went wrong</h1>")
    }
    res.redirect('/register')
}

exports.finalPayment = async (req, res) => {
    const customerA_ID = req.body.from;
    const customerB_ID = req.body.to;
    const amount = req.body.amount;
    const customerA = await findCustomersById(customerA_ID)
    const balance = customerA.totalBalance;
    if (balance < amount) {
        return res.send("<h1>Please enter amount less than or equal to " + balance + "</h1>")
    }
    res.render('payment', { customerA_ID, customerB_ID, customerA, amount, API_KEY: process.env.API_KEY_ROZERPAY })
}

exports.payment = async (req, res) => {
    const selectedCustomerId = req.body.id;
    let allCustomers = await showCustomers();
    const selectedCustomer = await findCustomersById(selectedCustomerId);
    allCustomers = allCustomers.filter(customer => String(customer._id) !== String(new ObjectId(selectedCustomerId)));
    if (!selectedCustomer || !allCustomers || !selectedCustomerId) {
        return res.send("<h1>Something went wrong!!!</h1>")
    }
    res.render('paymentPage', { pageTitle: 'GRIP | PAYMENT', navs: navs, selectedNav: '', selectedCustomer, allCustomers })
}

// Email Required here
exports.success = async (req, res) => {
    const from = req.body.from;
    const to = req.body.to;
    const amount = req.body.amount;
    const customer = await findCustomersById(from);
    const data = await addTransaction(customer.name, amount);
    const t = await transfer(from, to, amount);
    if (!data || !t || !customer) {
        return res.send("<h1>Transacion Failed</h1>")
    }
    await sendReciptForTransfer(from, to, amount, res);
}

exports.donatePost = (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const amount = req.body.amount;
    res.render('donateSuccess', { name, email, amount, API_KEY: process.env.API_KEY_ROZERPAY });
}

exports.error = (req, res) => {
    res.render('404', { pageTitle: 'ERROR', navs: navs, selectedNav: '' })
}

// Email Required Here
exports.donateSuccess = async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const amount = req.body.amount;
    await sendReciptForDonation(name, amount, email, res);
}