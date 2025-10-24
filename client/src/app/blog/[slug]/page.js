import Link from 'next/link'

async function getPost(slug) {
  try {
    const res = await fetch(`http://localhost:3001/api/posts/${slug}`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.error(`Failed to fetch post: ${res.status} ${res.statusText}`)
      return null
    }
    
    return res.json()
  } catch (error) {
    console.error('Network error:', error)
    return null
  }
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getPost(slug)

  // Show error if post is null
  if (!post) {
    return (
      <div className="page-container">
        <h1>Post Not Found</h1>
        <p>The post you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
        <Link href="/blog" className="back-link">← Back to all posts</Link>
      </div>
    )
  }

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
        <Link href="/blog" className="back-link">← Back to all posts</Link>
      </article>
    </div>
  )
}
