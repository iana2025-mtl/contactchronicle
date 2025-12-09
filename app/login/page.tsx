'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/timeline');
      } else {
        setError('Invalid email or password. Please try again.');
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-purple-700 text-center">Welcome Back</h1>
            <p className="text-sm sm:text-base text-purple-500 text-center mb-6">Sign in to your account</p>

            {error && (
              <div className="bg-pink-100 border border-pink-200 text-pink-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
                  className="w-full px-4 py-3 sm:py-2.5 text-base border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3.5 sm:py-3 bg-gradient-to-r from-purple-300 to-pink-300 text-purple-800 rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-purple-500">
                Don't have an account?{' '}
                <Link href="/register" className="text-purple-500 hover:text-pink-500 font-medium underline">
                  Sign up here
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

