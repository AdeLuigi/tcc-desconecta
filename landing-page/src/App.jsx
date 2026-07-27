import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Stats from './components/Stats'
import Screenshots from './components/Screenshots'
import Download from './components/Download'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Screenshots />
        <Download />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
