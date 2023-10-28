import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ProductService {
    async createProduct({name, price}) {
        const id = uuidv4();
        return prisma.product.create({
            data: {
                id,
                name,
                price,
                image: `https://picsum.photos/143/108?random=${id}`
            }
        })
    }

    async getProducts() {
        return prisma.product.findMany();
    }

    async getProductsByIds({products}) {
        return prisma.product.findMany({
            where: {
                id: {
                    in: products.map((product) => product.id)
                }
            }
        })
    }
}

export const productService = new ProductService();