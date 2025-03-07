/**
 * Utility for standardizing pagination across the application
 */
const paginate = async (model, options = {}) => {
    const {
        page = 1,
        limit = 10,
        where = {},
        include = [],
        order = [['created_at', 'DESC']],
        attributes = null,
        group = null,
        raw = false,
        nest = false,
        subQuery = false,
        distinct = false
    } = options;

    // Parse pagination parameters
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const offset = (pageNumber - 1) * pageSize;

    // Configure query options
    const queryOptions = {
        where,
        limit: pageSize,
        offset,
        order,
        include,
        subQuery,
        distinct
    };

    // Add optional parameters if provided
    if (attributes) queryOptions.attributes = attributes;
    if (group) queryOptions.group = group;
    if (raw) queryOptions.raw = raw;
    if (nest) queryOptions.nest = nest;

    // Execute the query
    const { count, rows } = await model.findAndCountAll(queryOptions);

    // Calculate pagination metadata
    const totalItems = count;
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNext = pageNumber < totalPages;
    const hasPrevious = pageNumber > 1;

    return {
        data: rows,
        pagination: {
            page: pageNumber,
            limit: pageSize,
            totalItems,
            totalPages,
            hasNext,
            hasPrevious,
            // Include URLs for previous and next pages if needed
            previousPage: hasPrevious ? pageNumber - 1 : null,
            nextPage: hasNext ? pageNumber + 1 : null
        }
    };
};

module.exports = paginate;