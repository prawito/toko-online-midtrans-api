import express from "express";
import { createTransaction, getTransactionById, getTransactions, updateTransactionStatus } from "../features/transactions/index.js";
import { validateTransaction, validateTransactionStatus } from "../features/transactions/transactions.validation.js";
import { createProduct, getProducts } from "../features/products/index.js";
import { validateProduct } from "../features/products/products.validation.js";
import { catchAsync } from "../utils/catch-async.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World!');
});

// transactions
router.post('/transactions', validateTransaction, catchAsync(createTransaction));
router.get('/transactions', catchAsync(getTransactions));
router.get('/transactions/:transaction_id', catchAsync(getTransactionById));
router.put('/transactions/:transaction_id', validateTransactionStatus, catchAsync(updateTransactionStatus));

// products
router.post('/products', validateProduct, catchAsync(createProduct));
router.get('/products', catchAsync(getProducts));

export default router;