"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertCircle, CheckCircle2, Info, Search, Trash2, PlusCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, SortAsc, SortDesc, FileText, CheckSquare, Clock, Filter, X, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    
    // Load essays from Supabase instead of localStorage
    const loadEssays = async () => {
      const { data, error } = await supabase
        .from('essays')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading essays:', error);
        return;
      }
      
      // Transform data to match our app's format
      const formattedData = data.map(item => ({
        id: item.id,
        date: item.created_at,
        essay: item.content,
        theme: item.theme,
        score: item.score,
        feedback: item.feedback,
        isDraft: item.is_draft
      }));
      
      setHistory(formattedData);
    };
    
    loadEssays();
  }, [user]);

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

      // Update in Supabase
      const { error: supabaseError } = await supabase
        .from('essays')
        .update({
          content: essay,
          score: data.score,
          feedback: data.feedback,
          is_draft: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEssay)
        .eq('user_id', user.id);

      if (supabaseError) throw supabaseError;

      // Update local state
      const updatedHistory = history.map(item => {
        if (item.id === selectedEssay) {
          return {
            ...item,
            essay: essay,
            score: data.score,
            feedback: data.feedback,
            isDraft: false
          };
        }
        return item;
      });

      setHistory(updatedHistory);
      setScore(data.score);
      setFeedback(data.feedback);
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
  };

  const handleNew = async () => {
    setSelectedEssay(null);
    setEssay("");
    setScore(null);
    setFeedback(null);
    setError(null);
    setTheme(null);
    
    // Automatically generate a new theme
    await generateTheme(true); // Pass true to indicate it's from "Nova" button
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
    // Skip the check when coming from New button
    if (!isFromNewButton && theme && !selectedEssay) {
      setError("Clique em 'Nova Redação' antes de gerar um novo tema");
      return;
    }
    
    setIsLoadingTheme(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-theme');
      const themeData = await response.json();

      if (!response.ok) {
        throw new Error(themeData.error || 'Falha ao gerar tema');
      }

      // Create new essay in Supabase
      const { data: newEssay, error: supabaseError } = await supabase
        .from('essays')
        .insert({
          user_id: user.id,
          content: "",
          theme: themeData,
          is_draft: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      // Format for our app
      const newEssayEntry = {
        id: newEssay.id,
        date: newEssay.created_at,
        essay: "",
        theme: themeData,
        score: null,
        feedback: null,
        isDraft: true
      };

      const updatedHistory = [newEssayEntry, ...history];
      setHistory(updatedHistory);

      // Select the new entry
      setSelectedEssay(newEssay.id);
      setTheme(themeData);
      setEssay("");
      setScore(null);
      setFeedback(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoadingTheme(false);
    }
  };

  // Update handleSaveDraft to save to Supabase
  const handleSaveDraft = async () => {
    if (!theme || !selectedEssay || !user) return;
    
    try {
      const { error: supabaseError } = await supabase
        .from('essays')
        .update({
          content: essay,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEssay)
        .eq('user_id', user.id);

      if (supabaseError) throw supabaseError;

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

  return (
    <div className="flex min-h-screen relative">
      {/* Collapsible History Sidebar */}
      <div 
        className={`${sidebarVisible ? 'w-80' : 'w-16'} border-r bg-gray-50 transition-all duration-300 flex flex-col`}
      >
        {sidebarVisible ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Histórico de Redações</h2>
              <Button
                onClick={handleNew}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Nova
              </Button>
            </div>

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
                        <span className="text-sm text-gray-500">
                          {format(new Date(savedEssay.date), "d 'de' MMMM', às 'HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
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
          </div>
        ) : (
          // Collapsed view with icons
          <div className="py-4 flex flex-col items-center h-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleNew}
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Nova Redação</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-10 h-[1px] bg-gray-200 my-4"></div>
            
            <ScrollArea className="flex-1 flex flex-col items-center gap-2 w-full">
              {processedHistory.map((savedEssay) => (
                <TooltipProvider key={savedEssay.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => loadEssay(savedEssay)}
                        className={`p-2 rounded-full ${
                          selectedEssay === savedEssay.id
                            ? 'bg-blue-100'
                            : 'hover:bg-gray-200'
                        }`}
                      >
                        {savedEssay.isDraft ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="w-80 p-3 max-h-[300px] overflow-y-auto">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">
                            {format(new Date(savedEssay.date), "d 'de' MMMM', às 'HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                          {!savedEssay.isDraft && (
                            <span className="font-semibold">{savedEssay.score}/1000</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-blue-600 break-words">
                          {savedEssay.theme?.título}
                        </p>
                        <p className="text-sm text-gray-600 break-words">
                          {savedEssay.essay 
                            ? (savedEssay.essay.length > 300 
                              ? savedEssay.essay.substring(0, 300) + "..." 
                              : savedEssay.essay)
                            : "Redação em branco"}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-gray-100 rounded-r-md p-1 z-10 hover:bg-gray-200 transition-colors shadow-md"
      >
        {sidebarVisible ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-center mt-24">10X Redação</h1>
            
            {/* User profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full h-10 w-10">
                  {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.user_metadata?.name || user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Theme Section with collapsible text motivador */}
          <div className="space-y-4 pt-8">
            <div className="flex flex-col">
              <h2 className="text-md font-semibold text-zinc-600">Tema da Redação</h2>
              {theme ? (
                <h3 className="text-xl font-semibold">{theme.título}</h3>
              ) : (
                <h3 className="text-xl font-semibold text-gray-500">Tema não disponível</h3>
              )}
            </div>

            {theme ? (
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
            ) : (
              <div className="bg-gray-50 rounded-lg border border-dashed p-8 text-center text-gray-500">
                Clique em "Nova" no painel lateral para começar uma redação
              </div>
            )}
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
                        // Allow editing the essay again
                        const updatedHistory = history.map(item => {
                          if (item.id === selectedEssay) {
                            return {
                              ...item,
                              isDraft: true // Mark as draft again
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
                      <h3 className="text-lg font-semibold">Notas por Competência</h3>
                      {Object.entries(feedback.competenciaScores).map(([comp, score]) => (
                        <div key={comp} className="bg-white rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Competência {comp.slice(-1)}</span>
                            <span className="font-semibold">{score}/200</span>
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
        </div>
      </div>
    </div>
  );
}
