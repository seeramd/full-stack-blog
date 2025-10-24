import "./globals.css";
import Navbar from './components/Navbar'

export const metadata = {
  title: "Div's Blog",
  description: "A tech/variety blog, powered by Next.js and PostgreSQL",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
