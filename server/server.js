const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blog.posts WHERE published_at IS NOT NULL ORDER BY created_at DESC, post_id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get latest post
app.get('/api/latest-post', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blog.posts WHERE published_at IS NOT NULL ORDER BY created_at desc, post_id desc LIMIT 2');
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single post by slug
app.get('/api/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query(
            'SELECT * FROM blog.posts WHERE slug = $1',
            [slug]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching post:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
