"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Import components from your main page that you'll need
// The dashboard will likely be similar to your current home page
// but focused only on the essay functionality
import { Button } from "@/components/ui/button";

export default function Essays() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  // Redirect if not authenticated (extra protection beyond middleware)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">10X Redação</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Olá, {user?.user_metadata?.name || user?.email}
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push('/essays/new')}>
              Nova Redação
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Suas Redações</h2>
          
          {/* Display user's essay history here */}
          <div className="space-y-4">
            <p className="text-center text-gray-500 py-8">
              Você ainda não tem redações. Clique em "Nova Redação" para começar.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 