"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { signIn, user } = useAuth();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Check if user just registered - client-side only
    if (searchParams?.get('registered')) {
      setSuccess('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
    }
    
    // Let middleware handle the redirect for authenticated users
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (redirecting) return;
    
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Email e senha são obrigatórios');
      setLoading(false);
      return;
    }

    try {
      const { error, success } = await signIn(email, password);
      
      if (error) {
        console.error("Login error:", error);
        setError(error.message || 'Falha ao fazer login');
        setLoading(false);
      } else if (success) {
        // Prevent multiple redirects
        setRedirecting(true);
        
        // Navigate to the essays page
        setTimeout(() => {
          window.location.href = '/essays';
        }, 100);
      } else {
        setError('Ocorreu um erro durante o login');
        setLoading(false);
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setError('Ocorreu um erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  // Initial render for both server and client
  const renderForm = () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">10X Redação</h1>
          <h2 className="mt-6 text-2xl font-semibold">Entrar na sua conta</h2>
        </div>

        {isClient && (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="seu@email.com"
                disabled={!isClient}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="Sua senha"
                disabled={!isClient}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !isClient}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <div className="text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );

  return renderForm();
} 