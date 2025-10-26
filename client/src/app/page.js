import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

async function getLatestPosts() {
  const res = await fetch('http://localhost:3001/api/latest-post', {
    cache: 'no-store'
  })
  
  if (!res.ok) {
    console.error(`Failed to fetch posts: ${res.status} ${res.statusText}`)
    return null
  }
  
  return res.json()
}

export default async function Home() {
  const posts = await getLatestPosts()

  return (
    <div className="page-container">
      <h1>Welcome!</h1>
      <p>
        I&apos;m Divendra Seeram, aka Div, aka Vinny. I&apos;m a New York City based IT guy. I&apos;ve worked as a sysadmin and a DBA. I also moonlight as a stand-up comedian.
      </p>
      <figure className="welcome-figure">
        <img  src="https://i.postimg.cc/0Nnv6GWY/P1053760.jpg" alt="Divendra Seeram, the writer of this blog, performs stand-up comedy to crowd of people."/>
        <figcaption>This performance took place in Gypsum, CO. PC: Mark Masters</figcaption>
      </figure>
      <p>
      Right now this blog&apos;s looks and features are sparse, but it&apos;s always under construction. I&apos;ll document major or interesting upgrades in future articles. I&apos;ll also add articles about other subjects I find noteworthy, tech-related or otherwise
      </p>
      <h2>Latest Posts</h2>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul className="post-list">
          {posts.map(post => (
            <li key={post.post_id} className="post-list-item-latest">
              <Link href={`/blog/${post.slug}`} className="post-link">
                <h3>{post.title}</h3>
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
