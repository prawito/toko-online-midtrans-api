import { check } from "express-validator";
import { errorValidation } from "../../middleware/error-validation.js";

export const validateProduct = [
    check('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
    check('price').isNumeric().withMessage('Price must be a number'),
    errorValidation,
]