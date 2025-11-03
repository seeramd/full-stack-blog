import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa'
import { CiMail } from "react-icons/ci";

export default function Contact() {
  return (
    <div className="page-container">
      <h1>Contact</h1>
      <p>You can find me in NYC, and at:</p>
      <p><CiMail /><span> </span>
        <a href="mailto:d.seeram98@gmail.com">d.seeram98@gmail.com</a>
      </p>
      <p><FaLinkedin /> 
        <span> </span><a href="https://www.linkedin.com/in/divendra-seeram/">LinkedIn</a>
      </p>
      <p><FaGithub /> 
        <span> </span><a href="https://github.com/seeramd">GitHub</a>
      </p>
    </div>
  )
}
