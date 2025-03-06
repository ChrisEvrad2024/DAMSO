/**
 * Utility class for standardizing API responses
 */
class ApiResponse {
    /**
     * Success response
     * @param {string} message - Success message
     * @param {object} data - Response data
     * @param {number} statusCode - HTTP status code (default: 200)
     * @returns {object} Response object
     */
    static success(message, data = null, statusCode = 200) {
        return {
            success: true,
            message,
            data,
            statusCode
        };
    }

    /**
     * Error response
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code (default: 500)
     * @returns {object} Response object
     */
    static error(message, statusCode = 500) {
        return {
            success: false,
            message,
            statusCode
        };
    }

    /**
     * Validation error response
     * @param {string} message - Error message
     * @param {array} errors - Validation errors
     * @returns {object} Response object
     */
    static validation(message, errors) {
        return {
            success: false,
            message,
            errors,
            statusCode: 400
        };
    }
}

module.exports = ApiResponse;