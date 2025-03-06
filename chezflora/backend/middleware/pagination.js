/**
 * Middleware for handling pagination in API requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const paginationMiddleware = (req, res, next) => {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate pagination parameters
    if (page < 1) {
        req.pagination = { page: 1, limit, offset: 0 };
    } else if (limit < 1 || limit > 100) {
        req.pagination = { page, limit: 10, offset: (page - 1) * 10 };
    } else {
        req.pagination = { page, limit, offset: (page - 1) * limit };
    }

    // Add pagination metadata to response
    res.setPaginationHeaders = (totalItems) => {
        const totalPages = Math.ceil(totalItems / req.pagination.limit);
        const hasNextPage = req.pagination.page < totalPages;
        const hasPrevPage = req.pagination.page > 1;

        // Set pagination in response locals (will be used in API response)
        res.locals.pagination = {
            page: req.pagination.page,
            limit: req.pagination.limit,
            totalItems,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? req.pagination.page + 1 : null,
            prevPage: hasPrevPage ? req.pagination.page - 1 : null
        };
    };

    next();
};

module.exports = paginationMiddleware;