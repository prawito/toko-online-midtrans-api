import { nanoid } from 'nanoid';
import { transactionService } from './transactions.service.js';
import { reformTransaction } from '../../utils/reform-transaction.js';
import { productService } from '../products/products.service.js';
import { FRONT_END_URL, MIDTRANS_APP_URL, MIDTRANS_SERVER_KEY, PENDING_PAYMENT } from '../../utils/constant.js';
import crypto from 'crypto';

export const createTransaction = async (req, res) => {
    const { products, customer_name, customer_email } = req.body;

    const productsFromDB = await productService.getProductsByIds({products});

    if (productsFromDB.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Products not found'
        })
    }

    productsFromDB.forEach((product) => {
        const productFromRequest = products.find((productFromRequest) => productFromRequest.id === product.id);
        product.quantity = productFromRequest.quantity;
    });
    
    const transaction_id = `TRX-${nanoid(4)}-${nanoid(8)}`;
    const gross_amount = productsFromDB.reduce((acc, product) => acc + (product.quantity * product.price), 0);

    const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);

    const payload = {
        transaction_details: {
            order_id: transaction_id,
            gross_amount
        },
        item_details: productsFromDB.map((product) => ({
            id: product.id,
            price: product.price,
            quantity: product.quantity,
            name: product.name,
        })),
        customer_details: {
            first_name: customer_name,
            email: customer_email
        },
        callbacks: {
            finish: `${FRONT_END_URL}/order-status?transaction_id=${transaction_id}`,
            error: `${FRONT_END_URL}/order-status?transaction_id=${transaction_id}`,
            pending: `${FRONT_END_URL}/order-status?transaction_id=${transaction_id}`
        }
    }

    const response = await fetch(`${MIDTRANS_APP_URL}/snap/v1/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${authString}`
        },
        body: JSON.stringify(payload)
    })

    const data = await response.json();

    if(response.status !== 201){
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create transaction'
        })
    }

    await Promise.all([
        transactionService.createTransaction({
            transaction_id,
            gross_amount,
            customer_name,
            customer_email,
            snap_token: data.token,
            snap_redirect_url: data.redirect_url
        }),
        transactionService.createTransactionItems({
            products: productsFromDB,
            transaction_id
        })
    ]);

    res.json({
        status: 'success',
        data: {
            id: transaction_id,
            status: PENDING_PAYMENT,
            customer_name,
            customer_email,
            products: productsFromDB,
            snap_token: data.token,
            snap_redirect_url: data.redirect_url,
        }
    })

};

export const getTransactions = async (req, res) => {
    const { status } = req.query;
    const transactions = await transactionService.getTransactions({status});

    res.json({
        status: 'success',
        data: transactions.map((transaction) => reformTransaction(transaction))
    })
};

export const getTransactionById = async (req, res) => {
    const { transaction_id } = req.params;
    const transaction = await transactionService.getTransactionById({transaction_id});

    if(!transaction) {
        return res.status(404).json({
            status: 'error',
            message: 'Transaction not found'
        })
    }

    res.json({
        status: 'success',
        data: reformTransaction(transaction),
    })
};

export const updateTransactionStatus = async (req, res) => {
    const { transaction_id } = req.params;
    const { status } = req.body;
    const transaction = await transactionService.updateTransactionStatus({transaction_id, status});

    res.json({
        status: 'success',
        data: transaction
    })
};

const updateStatusBasedOnMidtransResponse = async (transaction_id, data) => {
    const hash = crypto.createHash('sha512').update(`${transaction_id}${data.status_code}${data.gross_amount}${MIDTRANS_SERVER_KEY}`).digest('hex');
    if(data.signature_key !== hash){
        return {
            status: 'error',
            message: 'Invalid Signature key',
        }
    }

    let responseData = null;
    let transactionStatus = data.transaction_status;
    let fraudStatus = data.fraud_status;

    if (transactionStatus == 'capture'){
        if (fraudStatus == 'accept'){
            const transaction = await transactionService.updateTransactionStatus({transaction_id, status: PAID, payment_method: data.payment_type});
            responseData = transaction;
        }
    } else if (transactionStatus == 'settlement'){
        const transaction = await transactionService.updateTransactionStatus({transaction_id, status: PAID, payment_method: data.payment_type});
        responseData = transaction;
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire'){
        const transaction = await transactionService.updateTransactionStatus({transaction_id, status: CANCELED});
        responseData = transaction;
    } else if (transactionStatus == 'pending'){
        const transaction = await transactionService.updateTransactionStatus({transaction_id, status: PENDING_PAYMENT});
        responseData = transaction;
    }

    return {
        status: 'success',
        data: responseData
    }
}

export const trxNotif = async(req, res) => {
    const data = req.body;

    transactionService.getTransactionById({transaction_id: data.order_id}).then((transaction) => {
        if(transaction){
            updateStatusBasedOnMidtransResponse(transaction.id, data).then(result => {
                console.log('result', result)
            })
        }
    })

    res.status(200).json({
        status: 'success',
        message: 'OK'
    })
}