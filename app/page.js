"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { competencias } from '@/utils/evaluationCriteria';

export default function Home() {
  const [essay, setEssay] = useState("");
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setScore(null);
    setFeedback(null);

    try {
      const response = await fetch('/api/score-essay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ essay }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to score essay');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      setScore(data.score);
      setFeedback(data.feedback);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const minLength = 50;
  const isValidLength = essay.trim().length >= minLength;

  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-center mt-24">Avaliador de Redações ENEM</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Critérios de Avaliação</SheetTitle>
                <SheetDescription>
                  Como sua redação será avaliada
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {competencias.map((comp) => (
                  <div key={comp.id} className="space-y-2">
                    <h3 className="font-semibold">Competência {comp.numero}</h3>
                    <p className="text-sm text-gray-600">
                      {comp.descricao}
                    </p>
                    <div className="space-y-2">
                      {comp.criterios.map((criterio) => (
                        <div key={criterio.pontuacao} className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">{criterio.pontuacao} pontos</div>
                          <div className="text-gray-600">{criterio.descricao}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Write your essay here (minimum 50 characters)..."
            className="min-h-[300px] p-4"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
          />
          
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">
                {essay.length} characters
              </p>
              {!isValidLength && essay.length > 0 && (
                <p className="text-sm text-red-500">
                  Minimum {minLength} characters required
                </p>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isValidLength}
            >
              {isLoading ? (
                "Scoring..."
              ) : (
                <>
                  Submit <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {score !== null && (
            <div className="space-y-4">
              <div className="p-6 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-semibold">Nota Final</h2>
                <p className="text-4xl font-bold text-center mt-2">{score}/1000</p>
              </div>

              {feedback && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total de Palavras</p>
                      <p className="text-xl font-semibold">{feedback.wordCount}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Parágrafos</p>
                      <p className="text-xl font-semibold">{feedback.paragraphCount}</p>
                    </div>
                  </div>

                  {feedback.pontosPositivos && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-800">Pontos Positivos</h3>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-green-700">
                        {feedback.pontosPositivos.map((ponto, index) => (
                          <li key={index}>{ponto}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.pontosAMelhorar && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h3 className="font-semibold text-orange-800">Pontos a Melhorar</h3>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-orange-700">
                        {feedback.pontosAMelhorar.map((ponto, index) => (
                          <li key={index}>{ponto}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
