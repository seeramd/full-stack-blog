import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/posts/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Post not found');
        return res.json();
      })
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="page-container">Loading post...</div>;
  if (error) return <div className="page-container">Error: {error}</div>;
  if (!post) return <div className="page-container">Post not found</div>;

  return (
    <div className="page-container">
      <article className="blog-post">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <time>{new Date(post.created_at).toLocaleString()}</time>
        </div>
        <div className="post-content">
          <p>{post.content}</p>
        </div>
        <Link to="/blog" className="back-link">← Back to all posts</Link>
      </article>
    </div>
  )
}

export default BlogPost;
