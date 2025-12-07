'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import LogoWithText from './components/LogoWithText';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect based on authentication status
    if (isAuthenticated) {
      router.push('/timeline');
    } else {
      router.push('/login');
    }
  }, [router, isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <LogoWithText showTagline={true} />
          </div>
          <p className="text-lg text-purple-600 mb-6">
            Redirecting to your timeline...
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
