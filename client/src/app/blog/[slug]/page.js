import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { notFound } from 'next/navigation'

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
    return notFound()
  }

  return (
    <div className="page-container">
      <article className="blog-post">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <time>{new Date(post.created_at).toLocaleString()}</time>
        </div>
        <div className="post-content markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
          </ReactMarkdown>
        </div>
        <Link href="/blog" className="back-link">← Back to all posts</Link>
      </article>
    </div>
  )
}
