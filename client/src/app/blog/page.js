import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

async function getPosts() {
  const res = await fetch('http://localhost:3001/api/posts', {
    cache: 'no-store'
  })
  
  if (!res.ok) {
    console.error(`Failed to fetch posts: ${res.status} ${res.statusText}`)
    return null
  }
  
  return res.json()
}

export default async function BlogList() {
  const posts = await getPosts()

  // Show error if posts is null
  if (!posts) {
    return (
      <div className="page-container">
        <h1>Error Loading Posts</h1>
        <p style={{ color: 'red' }}>Unable to load blog posts. Please contact the webmaster.</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1>Posts</h1>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul className="post-list">
          {posts.map(post => (
            <li key={post.post_id} className="post-list-item">
              <Link href={`/blog/${post.slug}`} className="post-link">
                <h2>{post.title}</h2>
                  {post.content.length > 150 ? (
                  <div className="post-preview">
                    <ReactMarkdown>
                      {String(post.content).substring(0, 150) + '...'}
                    </ReactMarkdown>
                  </div>
                  ) : (
                  <div className="post-preview">
                    <ReactMarkdown>
                      {String(post.content)}
                    </ReactMarkdown>
                  </div>
                  )}
                <span className="post-date">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
