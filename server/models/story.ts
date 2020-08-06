const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
});

mongoose.model('products', productSchema);