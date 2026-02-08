import { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleMobileMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="bg-gradient-to-b from-midnight-950 to-midnight-900 backdrop-blur-md shadow-dark-elevation sticky top-0 z-50 border-b border-midnight-700">
      <div className="max-w-7xl mx-auto px-4 md:px-16">
        <div className="flex justify-between items-center py-4 md:py-8">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              onClick={closeMenu}
              className="text-xl md:text-2xl font-semibold text-white hover:text-gold transition-all duration-300"
            >
              DreamBid
            </Link>
          </div>

          {/* Desktop Navigation - Menu Dropdown */}
          <div className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button className="text-text-nav hover:text-gold transition-all duration-300 font-medium text-sm flex items-center gap-2">
                Menu
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-midnight-800 border border-midnight-700 rounded-lg shadow-dark-elevation opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <Link to="/properties" className="block px-4 py-3 text-text-nav hover:text-gold hover:bg-midnight-700 transition-colors first:rounded-t-lg">
                  Properties
                </Link>
                <a href="#how-it-works" className="block px-4 py-3 text-text-nav hover:text-gold hover:bg-midnight-700 transition-colors">
                  How it Works
                </a>
                <Link to="/" className="block px-4 py-3 text-text-nav hover:text-gold hover:bg-midnight-700 transition-colors last:rounded-b-lg">
                  Home
                </Link>
              </div>
            </div>
            
            <Link to="/admin/login" className="inline-flex items-center gap-2 bg-gold text-midnight-950 px-6 md:px-10 py-3 md:py-4 rounded-btn hover:bg-gold-hover transition-all duration-300 font-semibold text-xs md:text-sm">
              Entity Login
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-nav hover:text-gold hover:bg-midnight-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {menuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-midnight-700 pb-4">
            <div className="space-y-3">
              <Link
                to="/properties"
                onClick={() => setMenuOpen(false)}
                className="text-text-nav hover:text-gold hover:bg-midnight-800 block px-4 py-3 rounded-btn text-base font-medium transition-colors"
              >
                Properties
              </Link>
              <a
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
                className="text-text-nav hover:text-gold hover:bg-midnight-800 block px-4 py-3 rounded-btn text-base font-medium transition-colors"
              >
                How it Works
              </a>
              <Link
                to="/admin/login"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 bg-gold text-midnight-950 px-4 py-3 rounded-btn text-base font-semibold hover:bg-gold-hover transition-all duration-300 w-full justify-center"
              >
                Entity Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
