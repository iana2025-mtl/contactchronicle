'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const success = await register(name, email, password);
      if (success) {
        router.push('/timeline');
      } else {
        setError('An account with this email already exists.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 flex items-center justify-center">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-lg border border-purple-200 p-6 sm:p-8 bg-gradient-to-br from-white to-purple-50">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-purple-700 text-center">Create Account</h1>
            <p className="text-sm sm:text-base text-purple-500 text-center mb-6">Sign up to get started</p>

            {error && (
              <div className="bg-pink-100 border border-pink-200 text-pink-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-purple-600 mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 sm:py-2.5 text-base border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-purple-600 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 sm:py-2.5 text-base border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-purple-600 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 sm:py-2.5 text-base border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-600 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 sm:py-2.5 text-base border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3.5 sm:py-3 bg-gradient-to-r from-purple-300 to-pink-300 text-purple-800 rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-purple-500">
                Already have an account?{' '}
                <Link href="/login" className="text-purple-500 hover:text-pink-500 font-medium underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

