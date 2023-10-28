export const reformTransaction = (transaction) => {
    return {
        id: transaction.id,
        total: transaction.total,
        status: transaction.status,
        customer_name: transaction.customer_name,
        customer_email: transaction.customer_email,
        snap_token: transaction.snap_token,
        snap_redirect_url: transaction.snap_redirect_url,
        payment_method: transaction.payment_method,
        products: transaction.transactions_items.map((transactionItem) => ({
            id: transactionItem.product_id,
            name: transactionItem.product_name,
            price: transactionItem.price,
            quantity: transactionItem.quantity,
            image: transactionItem.products.image
        }))
    }
}