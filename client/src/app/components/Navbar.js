import Link from 'next/link'
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">Div&apos;s Blog</Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link href="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link href="/blog" className="nav-link">Blog</Link>
          </li>
          <li className="nav-item">
            <Link href="/contact" className="nav-link">Contact</Link>
          </li>
        </ul>
        <div className="nav-socials">
          <a 
            href="https://github.com/yourusername" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
            aria-label="GitHub"
          >
            <FaGithub size={24} />
          </a>
          <a 
            href="https://linkedin.com/in/divendra-seeram" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={24} />
          </a>
          <a 
            href="https://www.instagram.com/vinnyseeram/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
            aria-label="Instagram"
          >
            <FaInstagram size={24} />
          </a>
        </div>
      </div>
    </nav>
  )
}
