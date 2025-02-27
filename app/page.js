"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertCircle, CheckCircle2, Search, Trash2, PlusCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, SortAsc, SortDesc, FileText, CheckSquare, Clock, Filter, ArrowDownAZ, ArrowUpAZ, PenLine, BookOpen, ScrollText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const [essay, setEssay] = useState("");
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedEssay, setSelectedEssay] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState(null);
  const [isLoadingTheme, setIsLoadingTheme] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showMotivador, setShowMotivador] = useState(true);
  const [sortOption, setSortOption] = useState("date-desc");
  const [filterOption, setFilterOption] = useState("all");
  const [isClient, setIsClient] = useState(false);

  // Load essays from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const savedEssays = localStorage.getItem('essays');
    if (savedEssays) {
      setHistory(JSON.parse(savedEssays));
    }
  }, []);

  // Save essays to localStorage whenever history changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('essays', JSON.stringify(history));
    }
  }, [history, isClient]);

  const calculateTotalScore = (competenciaScores) => {
    if (!competenciaScores) return 0;
    return Object.values(competenciaScores).reduce((sum, score) => sum + score, 0);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/score-essay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          essay,
          theme: theme
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao avaliar redação');
      }

      // Ensure the total score matches the sum of competency scores
      const calculatedScore = calculateTotalScore(data.feedback.competenciaScores);
      
      // Update the data with the calculated score
      const finalData = {
        ...data,
        score: calculatedScore,
        feedback: {
          ...data.feedback,
          // Ensure each competency score is between 0 and 200
          competenciaScores: Object.entries(data.feedback.competenciaScores).reduce((acc, [comp, score]) => ({
            ...acc,
            [comp]: Math.min(Math.max(0, score), 200)
          }), {})
        }
      };

      // Update local state
      const updatedHistory = history.map(item => {
        if (item.id === selectedEssay) {
          return {
            ...item,
            essay: essay,
            score: finalData.score,
            feedback: finalData.feedback,
            isDraft: false
          };
        }
        return item;
      });

      setHistory(updatedHistory);
      setScore(finalData.score);
      setFeedback(finalData.feedback);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEssay = (savedEssay) => {
    setSelectedEssay(savedEssay.id);
    setEssay(savedEssay.essay || "");
    setScore(savedEssay.score);
    setFeedback(savedEssay.feedback);
    setTheme(savedEssay.theme);
  };

  const minLength = 50;
  const isValidLength = essay.trim().length >= minLength;

  const handleDelete = (essayId) => {
    const updatedHistory = history.filter((essay) => essay.id !== essayId);
    setHistory(updatedHistory);
    
    // Reset current essay if the deleted one was selected
    if (selectedEssay === essayId) {
      handleNew();
    }
  };

  const handleNew = async () => {
    setSelectedEssay(null);
    setEssay("");
    setScore(null);
    setFeedback(null);
    setError(null);
    setTheme(null);
    
    // Automatically generate a new theme
    await generateTheme(true);
  };

  // Sort and filter essays
  const processedHistory = history
    .filter(essay => {
      if (filterOption === "all") return true;
      if (filterOption === "drafts") return essay.isDraft;
      if (filterOption === "submitted") return !essay.isDraft;
      return true;
    })
    .filter(essay => 
      essay.essay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (essay.theme?.título.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "score-desc":
          return (b.score || 0) - (a.score || 0);
        case "score-asc":
          return (a.score || 0) - (b.score || 0);
        case "title-asc":
          return (a.theme?.título || "").localeCompare(b.theme?.título || "");
        case "title-desc":
          return (b.theme?.título || "").localeCompare(a.theme?.título || "");
        default:
          return 0;
      }
    });

  const generateTheme = async (isFromNewButton = false) => {
    if (!isFromNewButton && theme && !selectedEssay) {
      setError("Clique em 'Nova Redação' antes de gerar um novo tema");
      return;
    }
    
    setIsLoadingTheme(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-theme');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}: Falha ao gerar tema`);
      }
      
      const themeData = await response.json();

      // Create new essay in local state
      const newEssayEntry = {
        id: Date.now(), // Use timestamp as ID
        date: new Date().toISOString(),
        essay: "",
        theme: themeData,
        score: null,
        feedback: null,
        isDraft: true
      };

      const updatedHistory = [newEssayEntry, ...history];
      setHistory(updatedHistory);

      // Select the new entry
      setSelectedEssay(newEssayEntry.id);
      setTheme(themeData);
      setEssay("");
      setScore(null);
      setFeedback(null);
    } catch (error) {
      setError("Erro ao gerar tema: " + error.message);
      console.error("Theme generation error:", error);
    } finally {
      setIsLoadingTheme(false);
    }
  };

  const handleSaveDraft = () => {
    if (!theme || !selectedEssay) {
      setError("Não foi possível salvar: informações necessárias faltando");
      return;
    }
    
    try {
      // Update local state
      const updatedHistory = history.map(item => {
        if (item.id === selectedEssay) {
          return {
            ...item,
            essay: essay,
            date: new Date().toISOString()
          };
        }
        return item;
      });

      setHistory(updatedHistory);
      setError("Rascunho salvo com sucesso!");
      setTimeout(() => setError(null), 2000);
    } catch (error) {
      setError("Erro ao salvar rascunho: " + error.message);
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center space-y-6">
      <div className="relative">
        {/* <div className="absolute -left-6 -top-6 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <PenLine className="w-6 h-6 text-blue-600" />
        </div>
        <div className="absolute -right-4 -bottom-4 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-green-600" />
        </div> */}
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-purple-600" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Suas redações ficarão aqui</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Clique em "Criar Nova Redação" para criar sua primeira redação e receber feedback detalhado
        </p>
      </div>
      {/* <Button
        onClick={handleNew}
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Nova Redação
      </Button> */}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Collapsible History Sidebar */}
      <div 
        className={`${sidebarVisible ? 'w-80 border-r bg-gray-50' : 'w-16'} transition-all duration-300 flex flex-col`}
      >
        {sidebarVisible ? (
          <div className="p-4 space-y-4 h-full">
            <div className="flex flex-col items-left justify-between">
              <h2 className="text-lg font-semibold">Histórico de Redações</h2>
              <Button
                onClick={handleNew}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 mt-4"
              >
                <PlusCircle className="h-4 w-4" />
                Nova Redação
              </Button>
            </div>

            {history.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar redação..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1 flex-1">
                          <SortAsc className="h-3 w-3" />
                          Ordenar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSortOption("date-desc")} className={sortOption === "date-desc" ? "bg-gray-100" : ""}>
                          <Calendar className="h-4 w-4 mr-2" /> Mais recentes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption("date-asc")} className={sortOption === "date-asc" ? "bg-gray-100" : ""}>
                          <Calendar className="h-4 w-4 mr-2" /> Mais antigas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption("score-desc")} className={sortOption === "score-desc" ? "bg-gray-100" : ""}>
                          <SortDesc className="h-4 w-4 mr-2" /> Maior nota
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption("score-asc")} className={sortOption === "score-asc" ? "bg-gray-100" : ""}>
                          <SortAsc className="h-4 w-4 mr-2" /> Menor nota
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption("title-asc")} className={sortOption === "title-asc" ? "bg-gray-100" : ""}>
                          <ArrowDownAZ className="h-4 w-4 mr-2" /> Tema A-Z
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption("title-desc")} className={sortOption === "title-desc" ? "bg-gray-100" : ""}>
                          <ArrowUpAZ className="h-4 w-4 mr-2" /> Tema Z-A
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1 flex-1">
                          <Filter className="h-3 w-3" />
                          Filtrar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFilterOption("all")} className={filterOption === "all" ? "bg-gray-100" : ""}>
                          <FileText className="h-4 w-4 mr-2" /> Todas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterOption("drafts")} className={filterOption === "drafts" ? "bg-gray-100" : ""}>
                          <Clock className="h-4 w-4 mr-2" /> Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterOption("submitted")} className={filterOption === "submitted" ? "bg-gray-100" : ""}>
                          <CheckSquare className="h-4 w-4 mr-2" /> Avaliadas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-14rem)]">
                  <div className="space-y-4">
                    {processedHistory.map((savedEssay) => (
                      <div
                        key={savedEssay.id}
                        className={`relative group rounded-lg transition-colors ${
                          selectedEssay === savedEssay.id
                            ? 'bg-blue-100'
                            : 'bg-white'
                        }`}
                      >
                        <button
                          onClick={() => loadEssay(savedEssay)}
                          className="w-full text-left p-3"
                        >
                          <div className="flex justify-between items-center mb-2">
                            {isClient && (
                              <span className="text-sm text-gray-500">
                                {format(new Date(savedEssay.date), "d 'de' MMMM', às 'HH:mm", {
                                  locale: ptBR,
                                })}
                              </span>
                            )}
                            {savedEssay.isDraft ? (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Pendente</span>
                            ) : (
                              <span className="font-semibold">{savedEssay.score}/1000</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {savedEssay.theme && (
                              <p className="text-xs font-medium text-blue-600 break-words">
                                {savedEssay.theme.título}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 break-words">
                              {savedEssay.essay 
                                ? (savedEssay.essay.length > 120 
                                  ? savedEssay.essay.substring(0, 120) + "..." 
                                  : savedEssay.essay)
                                : "Redação em branco"}
                            </p>
                          </div>
                        </button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="absolute right-2 bottom-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-opacity z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Redação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta redação? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(savedEssay.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        ) : (
          // Collapsed view with only New button
          <div className="py-4 flex flex-col items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleNew}
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-gray-100"
                  >
                    <PlusCircle className="h-5 w-5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Nova Redação</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Update Toggle Sidebar Button to be more subtle */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className="fixed left-0 top-1/2 transform -translate-y-1/2 p-1 z-10 hover:bg-gray-100 transition-colors"
      >
        {sidebarVisible ? (
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto w-dvw">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-center mt-24">10X Redação</h1>
          </div>
          
          {!theme ? (
            <div className="flex flex-col items-center grow-0 justify-center min-h-[60vh] space-y-6">
              <div className="relative">
                <div className="absolute -left-8 -top-8 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <PenLine className="w-8 h-8 text-blue-600" />
                </div>
                <div className="absolute -right-6 -bottom-6 w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <ScrollText className="w-7 h-7 text-green-600" />
                </div>
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Bem-vindo ao 10X Redação
                </h2>
                <p className="text-gray-500 max-w-md">
                  Comece sua jornada criando uma nova redação. 
                  Você receberá feedback detalhado e poderá acompanhar seu progresso.
                </p>
                <Button
                  onClick={handleNew}
                  className="gap-2"
                  size="lg" 
                >
                  <PlusCircle className="h-5 w-5" />
                  Criar Nova Redação
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Theme Section with collapsible text motivador */}
              <div className="space-y-4 pt-8">
                <div className="flex flex-col">
                  <h2 className="text-md font-semibold text-zinc-600">Tema da Redação</h2>
                  <h3 className="text-xl font-semibold">{theme.título}</h3>
                </div>

                <div className="bg-white rounded-lg border p-6 space-y-4">
                  <button 
                    onClick={() => setShowMotivador(!showMotivador)}
                    className="flex justify-between items-center text-sm text-gray-500 w-full"
                  >
                    <span className='font-medium'>Textos motivadores</span>
                    <span>
                      {showMotivador ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  
                  {showMotivador && (
                    <div className="space-y-4 animate-in fade-in-50 duration-300">
                      {theme.textoMotivador.map((texto, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
                          {texto}
                        </div>
                      ))}
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-blue-700">
                          A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija um texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema "{theme.título}". Apresente proposta de intervenção que respeite os direitos humanos. Selecione, organize e relacione, de forma coerente e coesa, argumentos e fatos para defesa de seu ponto de vista.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Essay Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-semibold text-zinc-600 text-center mt-4">Insira sua redação</h3>
                </div>
                <Textarea
                  placeholder={theme ? "Escreva sua redação aqui..." : "Gere um tema primeiro para começar"}
                  className="min-h-[300px] p-4"
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  disabled={!theme}
                />
                
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      {essay.length} caracteres
                    </p>
                    {!isValidLength && essay.length > 0 && (
                      <p className="text-sm text-red-500">
                        Mínimo de {minLength} caracteres necessários
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveDraft}
                      variant="outline"
                      disabled={!theme || essay.trim().length === 0}
                    >
                      Salvar Rascunho
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !isValidLength}
                    >
                      {isLoading ? (
                        "Avaliando..."
                      ) : (
                        <>
                          Avaliar <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant={error.includes("sucesso") ? "default" : "destructive"}>
                    {error.includes("sucesso") ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>{error.includes("sucesso") ? "Sucesso" : "Erro"}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {score !== null && (
                  <div className="space-y-4">
                    <div className="p-6 bg-gray-100 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Nota Final</h2>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const updatedHistory = history.map(item => {
                              if (item.id === selectedEssay) {
                                return {
                                  ...item,
                                  isDraft: true
                                };
                              }
                              return item;
                            });
                            setHistory(updatedHistory);
                          }}
                        >
                          Editar Redação
                        </Button>
                      </div>
                      <p className="text-4xl font-bold text-center mt-2">{score}/1000</p>
                      
                      {feedback?.competenciaScores && (
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Notas por Competência</h3>
                            <span className="text-sm text-gray-500">
                              Total: {calculateTotalScore(feedback.competenciaScores)}/1000
                            </span>
                          </div>
                          {Object.entries(feedback.competenciaScores).map(([comp, score]) => (
                            <div key={comp} className="bg-white rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Competência {comp.slice(-1)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{score}/200</span>
                                  {score > 200 && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Nota ajustada para máximo de 200 pontos</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                              {feedback.suggestions[comp] && (
                                <p className="text-sm text-gray-600">
                                  {feedback.suggestions[comp]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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

                        {/* Theme adherence feedback */}
                        {feedback.aderenciaAoTema && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-800">Aderência ao Tema</h3>
                            <p className="mt-1 text-blue-700">
                              {feedback.aderenciaAoTema}
                            </p>
                          </div>
                        )}

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
