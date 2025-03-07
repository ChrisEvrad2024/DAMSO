const express = require('express');
const router = express.Router();
const { getBlogPosts, getBlogPostBySlug, getBlogCategories, createComment,
        createBlogPost, updateBlogPost, deleteBlogPost, getAllBlogPosts,
        updateCommentStatus, replyToComment } = require('../controllers/blogController');
const { protect, adminOnly } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const { validateCreateBlogPost, validateUpdateBlogPost, validateCreateComment,
        validateUpdateCommentStatus, validateReplyToComment } = require('../middleware/validators/blogValidator');

// Public routes
router.get('/', getBlogPosts);
router.get('/categories', getBlogCategories);
router.get('/:slug', getBlogPostBySlug);

// Protected routes
router.post('/:id/comments', protect, validateCreateComment, createComment);

// Admin routes
router.get('/admin', protect, adminOnly, getAllBlogPosts);
router.post('/admin', protect, adminOnly, uploadMiddleware.single('featured_image'), validateCreateBlogPost, createBlogPost);
router.put('/admin/:id', protect, adminOnly, uploadMiddleware.single('featured_image'), validateUpdateBlogPost, updateBlogPost);
router.delete('/admin/:id', protect, adminOnly, deleteBlogPost);
router.put('/admin/comments/:id', protect, adminOnly, validateUpdateCommentStatus, updateCommentStatus);
router.post('/admin/comments/:id/reply', protect, adminOnly, validateReplyToComment, replyToComment);

module.exports = router;