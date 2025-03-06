const fs = require('fs');
const path = require('path');

const uploadDirs = [
    'public/uploads/products',
    'public/uploads/categories',
    'public/uploads/blog',
    'public/uploads/services',
    'public/uploads/users',
    'public/uploads/banners'
];

// Create upload directories if they don't exist
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created directory: ${fullPath}`);
    }
});

console.log('All upload directories prepared successfully');