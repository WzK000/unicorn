"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

export default function NewEssay() {
  const [essay, setEssay] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  
  // This would be replaced with your actual API call to save the essay
  const handleSubmit = async () => {
    // Implement essay submission logic
    alert("Funcionalidade em desenvolvimento");
    
    // Navigate back to essays list
    router.push('/essays');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/essays')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Nova Redação</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Tema</h2>
            <p className="text-gray-700">
              Os desafios para a valorização da cultura brasileira na era digital
            </p>
          </div>
          
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Sua Redação</h2>
            <Textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Escreva sua redação aqui..."
              className="min-h-[300px]"
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSubmit}>
              Salvar Redação
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
} 