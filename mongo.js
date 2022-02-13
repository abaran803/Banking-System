const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customer = new Schema({ name: String, email: String, totalBalance: Number, date: Date });
const transaction = new Schema({ member: String, amount: Number, date: Date });
const Customer = mongoose.model('Customer', customer);
const Transaction = mongoose.model('Transaction', transaction);

mongoose.connect(process.env.CONNECTION_STRING)
    .then(data => console.log('Database Connected'))
    .catch(err => console.log("Database not Connected"))



// Adding Customers
exports.addCustomer = async (name, email, total) => {
    try {
        Customer.create({ name: name, email: email, totalBalance: total, date: new Date() })
    }
    catch (err) {
        return false;
    }
    return true;
}

// Adding Transactions
exports.addTransaction = async (member, amount) => {
    try {
        Transaction.create({ member: member, amount: amount, date: new Date() })
    }
    catch (err) {
        return false;
    }
    return true;
}

// Showing Customers
exports.showCustomers = async () => {
    let data = [];
    try {
        data = await Customer.find();
    } catch (err) {
        return false;
    }
    return data;
}

// Showing Transactions
exports.showTransactions = async () => {
    let data = [];
    try {
        data = await Transaction.find();
    } catch (err) {
        return false;
    }
    return data;
}

// Deleting transaction
exports.deleteTransaction = async (id) => {
    const objectID = mongoose.Types.ObjectId(id);
    let data = [];
    try {
        data = await Transaction.deleteOne({ _id: objectID });
    } catch (err) {
        return false;
    }
    return data;
}

// Find customers by id
exports.findCustomersById = async (id) => {
    const objectID = mongoose.Types.ObjectId(id);
    let data = [];
    try {
        data = await Customer.findOne({ _id: objectID })
    } catch (err) {
        return false;
    }
    return data;
}

// Find transactions by id
exports.findTransactionsById = async (id) => {
    const objectID = mongoose.Types.ObjectId(id);
    let data = [];
    try {
        data = await Transaction.findOne({ _id: objectID })
    } catch (err) {
        return false;
    }
    return data;
}

exports.transfer = async (from, to, amount) => {
    const t1 = await Customer.updateOne({_id: mongoose.Types.ObjectId(from)},{$inc: {"totalBalance": -amount}})
    const t2 = await Customer.updateOne({_id: mongoose.Types.ObjectId(to)},{$inc: {"totalBalance": amount}})
    return (t1 && t2);
}