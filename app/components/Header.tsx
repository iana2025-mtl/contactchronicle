'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import LogoWithText from './LogoWithText';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/timeline', label: 'My Timeline' },
    { href: '/upload', label: 'Upload Contacts' },
    { href: '/chronicle', label: 'View Chronicle' },
    { href: '/map', label: 'Location Map' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-pink-200 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <LogoWithText showTagline={false} />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {isAuthenticated && (
              <nav className="flex gap-4 xl:gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg transition-all text-sm xl:text-base ${
                      pathname === link.href
                        ? 'bg-purple-200 text-purple-700 font-medium shadow-sm'
                        : 'text-purple-600 hover:bg-pink-100 hover:text-pink-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
            <div className="flex items-center gap-3 xl:gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-xs xl:text-sm text-purple-600 hidden xl:block">
                    Welcome, <span className="font-medium">{user?.name}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 xl:px-4 py-2 bg-pink-200 text-pink-600 rounded-lg hover:bg-pink-300 transition-colors text-xs xl:text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 xl:px-4 py-2 text-purple-600 hover:text-pink-600 transition-colors text-xs xl:text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 xl:px-4 py-2 bg-gradient-to-r from-purple-300 to-pink-300 text-purple-800 rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all text-xs xl:text-sm font-medium shadow-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-purple-600 hover:bg-pink-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}

          {/* Mobile Auth Buttons (when not authenticated) */}
          {!isAuthenticated && (
            <div className="lg:hidden flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-2 text-purple-700 hover:text-pink-700 transition-colors text-sm font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

          {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && isAuthenticated && (
          <div className="lg:hidden mt-4 pb-4 border-t border-pink-200 pt-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-all ${
                    pathname === link.href
                      ? 'bg-purple-200 text-purple-700 font-medium shadow-sm'
                      : 'text-purple-600 hover:bg-pink-100 hover:text-pink-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-pink-200">
                <div className="px-4 py-2 text-xs text-purple-600">
                  Welcome, <span className="font-medium">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 bg-pink-200 text-pink-600 rounded-lg hover:bg-pink-300 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

