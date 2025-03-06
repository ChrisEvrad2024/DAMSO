const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { ApiError } = require('./errorHandler');

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        'public/uploads/products',
        'public/uploads/categories',
        'public/uploads/blog',
        'public/uploads/services'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'public/uploads/';

        // Determine upload directory based on route or file type
        if (req.originalUrl.includes('/products')) {
            uploadPath += 'products';
        } else if (req.originalUrl.includes('/categories')) {
            uploadPath += 'categories';
        } else if (req.originalUrl.includes('/blog')) {
            uploadPath += 'blog';
        } else if (req.originalUrl.includes('/services')) {
            uploadPath += 'services';
        } else {
            uploadPath += 'misc';
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create unique filename
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return cb(new ApiError('Only image files are allowed', 400), false);
    }

    cb(null, true);
};

// Export multer instance
module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    }
});