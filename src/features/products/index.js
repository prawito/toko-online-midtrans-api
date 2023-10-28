import { productService } from './products.service.js';

export const getProducts = async (req, res) => {
    const products = await productService.getProducts();

    res.json({
        status: 'success',
        data: products
    })
}

export const createProduct = async (req, res) => {
    const { name, price } = req.body;
    const product = await productService.createProduct({name, price});

    res.json({
        status: 'success',
        data: product
    })
};