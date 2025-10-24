import Link from 'next/link'

async function getPosts() {
  try {
    const res = await fetch('http://localhost:3001/api/posts', {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.error(`Failed to fetch posts: ${res.status} ${res.statusText}`)
      return null
    }
    
    return res.json()
  } catch (error) {
    console.error('Issue communicating with the database', error)
    return null
  }
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
      <h1>Blog Posts</h1>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul className="post-list">
          {posts.map(post => (
            <li key={post.post_id} className="post-list-item">
              <Link href={`/blog/${post.slug}`} className="post-link">
                <h2>{post.title}</h2>
                <p className="post-preview">
                  {post.content.substring(0, 150)}...
                </p>
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
