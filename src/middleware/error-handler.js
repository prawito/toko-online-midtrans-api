export const errorHandler = (err, req, res, next) => {
    console.log('error', err);
    res.status(500).json({
        status: 'error',
        message: err.message
    })
}