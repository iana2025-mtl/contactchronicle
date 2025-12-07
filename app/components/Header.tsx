'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import LogoWithText from './LogoWithText';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const navLinks = [
    { href: '/timeline', label: 'My Timeline' },
    { href: '/upload', label: 'Upload Contacts' },
    { href: '/chronicle', label: 'View Chronicle' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="border-b border-pink-200 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <LogoWithText showTagline={false} />
        </Link>
        <div className="flex items-center gap-6">
          {isAuthenticated && (
            <nav className="flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    pathname === link.href
                      ? 'bg-purple-200 text-purple-800 font-medium shadow-sm'
                      : 'text-purple-700 hover:bg-pink-100 hover:text-pink-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-purple-700 hidden md:block">
                  Welcome, <span className="font-medium">{user?.name}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-pink-200 text-pink-700 rounded-lg hover:bg-pink-300 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-purple-700 hover:text-pink-700 transition-colors text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

