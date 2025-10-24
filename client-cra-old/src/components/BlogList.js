import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
      })
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container">Loading posts...</div>;
  if (error) return <div className="container">Error: {error}</div>;
  
  return (
    <div className="page-container">
      <h1>Posts</h1>
      {posts.length === 0 ? (<p>No posts yet.</p>) : (
        <ul className="post-list">
          {posts.map(post => (
            <li key={post.id} className="post-list-item">
              <Link to={`/blog/${post.slug}`} className="post-link">
                <h2>{post.title}</h2>
                <p className="post-preview">{post.content.substring(0, 150)}...</p>
                <span className="post-date">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

}

export default BlogList;
