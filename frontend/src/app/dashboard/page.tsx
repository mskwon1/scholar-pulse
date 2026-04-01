'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { LogOut, Plus, Save, Sparkles, X, Trash2, Filter, Settings2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/query-keys';
import { aiPromptsAtom, recommendingAtom, userAtom } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const CATEGORY_OPTIONS = [
  "All Fields",
  "Computer Science",
  "Medicine",
  "Chemistry",
  "Biology",
  "Materials Science",
  "Physics",
  "Geology",
  "Psychology",
  "Art",
  "History",
  "Geography",
  "Sociology",
  "Business",
  "Political Science",
  "Economics",
  "Philosophy",
  "Mathematics",
  "Engineering",
  "Environmental Science",
  "Agricultural and Food Sciences",
  "Education",
  "Law",
  "Linguistics"
];

const PRESET_KEYWORDS = [
  'LLM',
  'Agent',
  'RAG',
  'Prompt Engineering',
  'Quantum Computing',
  'Solid-State Battery',
  'Renewable Energy',
  'Autonomous Driving',
  'Computer Vision',
  'Neuroscience',
  'Virology',
  'Fintech',
  'V2G',
  'Edge Computing',
  'HCI',
  'Transformers',
  'NLP',
  'Robotics',
  'Bioinformatics',
  'Microplastics',
];

const topicSchema = z.object({
  name: z.string().min(1, "Name is required"),
  keywords: z.array(z.string()).max(10, { message: "Maximum 10 keywords allowed" }),
  match_type: z.string().optional(),
  category: z.string().optional(),
  filters: z.object({
    years_limit: z.number().min(1, "Must be at least 1 year"),
    min_journal_rank: z.string(),
    min_citations: z.number().min(0, "Citations cannot be negative"),
  }),
});

const userConfigSchema = z.object({
  topics: z.array(topicSchema).max(5, { message: "Maximum 5 filters allowed" }),
  schedule: z.string(),
  delivery: z.string(),
  receive_email: z.boolean(),
});

type UserConfig = z.infer<typeof userConfigSchema>;

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [user, setUser] = useAtom(userAtom);
  const [aiPrompts, setAiPrompts] = useAtom(aiPromptsAtom);
  const [recommending, setRecommending] = useAtom(recommendingAtom);
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);

  // 1. Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    };
    checkUser();
  }, [router, setUser]);

  // 2. Fetch Config
  const { data: queryData, isLoading: isLoadingConfig } = useQuery({
    queryKey: queryKeys.config.detail(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('No user id');
      const { data, error } = await supabase
        .from('user_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      const defaultCfg: UserConfig = {
        topics: [],
        schedule: 'daily',
        delivery: 'email',
        receive_email: true,
      };

      return (data?.config as UserConfig) || defaultCfg;
    },
    enabled: !!user?.id,
  });

  // 3. Form Setup
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    register,
    formState: { isDirty, errors },
  } = useForm<UserConfig>({
    resolver: zodResolver(userConfigSchema),
    mode: 'onChange',
  });

  // Sync Data
  useEffect(() => {
    if (queryData) {
      reset(queryData);
      if (queryData.topics && queryData.topics.length > 0) {
        setActiveTopicIndex(0);
      } else {
        setActiveTopicIndex(-1);
      }
    }
  }, [queryData, reset]);

  const { fields: topics, append, remove } = useFieldArray({
    control,
    name: 'topics',
  });

  // Ensure active index is valid when topics change
  useEffect(() => {
    if (topics.length === 0) {
      setActiveTopicIndex(-1);
    } else if (activeTopicIndex >= topics.length) {
      setActiveTopicIndex(topics.length - 1);
    }
  }, [topics.length, activeTopicIndex]);

  // 4. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (configData: UserConfig) => {
      if (!user) throw new Error('Not logged in');
      
      // Clean up keywords array (remove empty strings)
      configData.topics = configData.topics.map(t => ({
          ...t,
          keywords: t.keywords.filter(k => k.trim() !== ''),
          match_type: 'AND' // Hardcode to AND for backend simplicity
      }));

      const { error } = await supabase
        .from('user_config')
        .upsert(
          { user_id: user.id, config: configData },
          { onConflict: 'user_id' }
        );
      if (error) throw new Error(error.message);
      return configData;
    },
    onSuccess: (savedData) => {
      if (user) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.config.detail(user.id),
        });
      }
      reset(savedData);
      toast.success('Configuration saved successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to save configuration: ${err.message}`);
    },
  });

  const onSubmit = (data: UserConfig) => {
    saveMutation.mutate(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const handleRecommendKeywords = async (topicIndex: number) => {
    const prompt = aiPrompts[topicIndex];
    if (!prompt) return;
    setRecommending((prev) => ({ ...prev, [topicIndex]: true }));
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicDescription: prompt }),
      });
      const data = await res.json();
      if (data.keywords && Array.isArray(data.keywords)) {
        const currentKeywords =
          getValues(`topics.${topicIndex}.keywords`) || [];
          
        let newKeys = data.keywords.filter(
          (k: string) => !currentKeywords.includes(k)
        );
        
        // Enforce max 10 total limit
        const spaceLeft = 10 - currentKeywords.length;
        if (spaceLeft <= 0) {
           toast.error('Keyword limit reached (Max 10).');
           newKeys = [];
        } else if (newKeys.length > spaceLeft) {
           newKeys = newKeys.slice(0, spaceLeft);
           toast.info(`Added ${spaceLeft} keywords to match the max limit of 10.`);
        }

        if (newKeys.length > 0) {
          setValue(
            `topics.${topicIndex}.keywords`,
            [...currentKeywords, ...newKeys],
            { shouldDirty: true, shouldValidate: true }
          );
        }
      } else {
        toast.error(data.error || 'Failed to fetch recommendations');
      }
    } catch {
      toast.error('Error fetching recommendations');
    }
    setRecommending((prev) => ({ ...prev, [topicIndex]: false }));
  };

  const addKeyword = (topicIndex: number, keyword: string) => {
    if (!keyword?.trim()) return;
    const trimmed = keyword.trim();
    const currentKeywords = getValues(`topics.${topicIndex}.keywords`) || [];
    
    if (currentKeywords.length >= 10) {
      toast.error('Keyword limit reached (Max 10).');
      return;
    }
    
    if (!currentKeywords.includes(trimmed)) {
      setValue(`topics.${topicIndex}.keywords`, [...currentKeywords, trimmed], {
        shouldDirty: true,
        shouldValidate: true
      });
    }
  };

  const removeKeyword = (topicIndex: number, keywordIndex: number) => {
    const currentKeywords = getValues(`topics.${topicIndex}.keywords`) || [];
    const newKeywords = [...currentKeywords];
    newKeywords.splice(keywordIndex, 1);
    setValue(`topics.${topicIndex}.keywords`, newKeywords, {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  const addTopic = () => {
     if (topics.length >= 5) {
        toast.error('Maximum 5 filters allowed.');
        return;
     }
     append({
        name: `New Filter ${topics.length + 1}`,
        keywords: [],
        match_type: 'AND',
        category: 'All Fields',
        filters: { years_limit: 3, min_journal_rank: 'Q2', min_citations: 5 }
     });
     setActiveTopicIndex(topics.length);
  };

  const confirmRemoveTopic = (index: number) => {
      if (window.confirm("Are you sure you want to delete this filter?")) {
         remove(index);
         if (index > 0) setActiveTopicIndex(index - 1);
      }
  };

  if (isLoadingConfig || !queryData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-background text-foreground dark">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
          <div
            className="absolute inset-2 rounded-full border-r-2 border-l-2 border-primary/40 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1s' }}
          ></div>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">
          Syncing your insights...
        </p>
      </div>
    );
  }

  const currentTopicKeywords = activeTopicIndex >= 0 ? (watch(`topics.${activeTopicIndex}.keywords`) || []) : [];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-32 dark">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Scholar Pulse Logo"
              width={32}
              height={32}
              className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-md shadow-sm shrink-0"
            />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary truncate">
              Scholar Pulse
            </h1>
            <span className="text-xl md:text-2xl font-medium text-muted-foreground tracking-tight hidden sm:inline-block">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="hidden md:flex items-center bg-card shadow-sm border rounded-full px-4 py-1.5">
              <Sparkles className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm font-medium">Daily AI Report Active</span>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 md:flex-none border-dashed"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Email Settings Card */}
          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center text-lg">
                 <Settings2 className="w-5 h-5 mr-2 text-primary" /> Delivery Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground max-w-[600px] leading-relaxed">
                    Get an AI-curated summary of the latest papers matching your <strong className="text-foreground">{topics.length} active filters</strong>. 
                    Emails are processed and sent daily at <span className="font-semibold text-primary">9:00 AM (KST)</span>.
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-1 bg-background px-4 py-2 rounded-lg border">
                  <span className="text-sm font-medium whitespace-nowrap">
                    {watch("receive_email") !== false ? 'Notifications On' : 'Notifications Off'}
                  </span>
                  <Controller
                    control={control}
                    name="receive_email"
                    render={({ field }) => (
                      <Switch
                        checked={field.value !== false}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Master Detail Section */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Master List (Sidebar for Desktop, Dropdown for Mobile) */}
            <div className="w-full lg:w-72 shrink-0 space-y-4">
               {/* Mobile: Select active filter */}
               <div className="lg:hidden bg-card p-4 rounded-xl border shadow-sm">
                 <Label className="mb-2 flex justify-between text-sm font-medium text-muted-foreground uppercase tracking-wider">
                     <span>Active Filter</span>
                     <span>{topics.length}/5</span>
                 </Label>
                 <Select 
                    value={activeTopicIndex >= 0 ? activeTopicIndex.toString() : ""} 
                    onValueChange={(v) => {
                       if (v === 'new') {
                          addTopic();
                       } else {
                          setActiveTopicIndex(parseInt(v || '0'));
                       }
                    }}
                 >
                   <SelectTrigger className="w-full h-12 bg-background text-foreground border-primary/20 focus:ring-primary/50">
                     <SelectValue placeholder="Select a Filter" />
                   </SelectTrigger>
                   <SelectContent>
                     {topics.map((t, i) => (
                        <SelectItem key={t.id} value={i.toString()}>
                           {watch(`topics.${i}.name`) || `Filter ${i+1}`}
                        </SelectItem>
                     ))}
                     {topics.length < 5 && (
                        <SelectItem value="new" className="text-primary font-medium focus:text-primary">
                           <div className="flex items-center">
                              <Plus className="w-4 h-4 mr-2" /> Create New Filter
                           </div>
                        </SelectItem>
                     )}
                   </SelectContent>
                 </Select>
               </div>
               
               {/* Desktop: Sidebar list */}
               <div className="hidden lg:flex flex-col gap-2 bg-card rounded-xl p-4 border shadow-sm sticky top-4">
                 <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b">
                     <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">My Filters</h3>
                     <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{topics.length}/5</span>
                 </div>
                 
                 <div className="space-y-1">
                    {topics.map((t, i) => {
                        const isActive = activeTopicIndex === i;
                        const name = watch(`topics.${i}.name`) || `Filter ${i+1}`;
                        const keywordCount = (watch(`topics.${i}.keywords`) || []).length;
                        return (
                        <button 
                            type="button" 
                            key={t.id} 
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 group flex items-center justify-between ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'bg-transparent text-foreground hover:bg-muted'}`}
                            onClick={() => setActiveTopicIndex(i)}
                        >
                            <div className="flex flex-col overflow-hidden">
                                <span className={`truncate text-sm font-semibold ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>{name}</span>
                                <span className={`text-[11px] mt-0.5 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{keywordCount} keyword{keywordCount !== 1 && 's'}</span>
                            </div>
                        </button>
                        )
                    })}
                    
                    {topics.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground italic">No filters created yet.</div>
                    )}
                 </div>
                 
                 {/* Add button */}
                 {topics.length < 5 && (
                   <Button type="button" variant="outline" className="w-full mt-4 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50" onClick={addTopic}>
                     <Plus className="w-4 h-4 mr-2" /> New Filter
                   </Button>
                 )}
               </div>
            </div>
            
            {/* Detail View */}
            <div className="flex-1">
              {activeTopicIndex >= 0 && activeTopicIndex < topics.length ? (
                <Card className="shadow-sm border-primary/20 bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 w-full" />
                  <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b gap-4">
                     <div>
                       <CardTitle className="text-2xl font-bold tracking-tight">Filter Settings</CardTitle>
                       <CardDescription className="text-base mt-1">Configure focus domain and tracking keywords.</CardDescription>
                     </div>
                     <Button 
                       type="button" 
                       variant="ghost" 
                       size="sm"
                       className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-start w-full sm:w-auto"
                       onClick={() => confirmRemoveTopic(activeTopicIndex)}
                     >
                       <Trash2 className="w-4 h-4 mr-2" /> Delete Filter
                     </Button>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-8">
                     
                     {/* Name & Category Row */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                         <Label className="text-base font-semibold flex items-center">
                            Filter Alias <span className="text-destructive ml-1">*</span>
                         </Label>
                         <Input 
                            {...register(`topics.${activeTopicIndex}.name`)} 
                            placeholder="e.g., Tech Trends 2024" 
                            className="bg-background h-11"
                         />
                         {errors.topics?.[activeTopicIndex]?.name && (
                             <p className="text-xs text-destructive font-medium">{errors.topics[activeTopicIndex]?.name?.message}</p>
                         )}
                       </div>
                       
                       <div className="space-y-3">
                         <Label className="text-base font-semibold">Broad Domain <span className="text-muted-foreground font-normal text-xs ml-2">(Optional)</span></Label>
                         <Controller
                            control={control}
                            name={`topics.${activeTopicIndex}.category`}
                            render={({field}) => (
                               <Select value={field.value || "All Fields"} onValueChange={field.onChange}>
                                 <SelectTrigger className="w-full h-11 bg-background">
                                   <SelectValue placeholder="Select category" />
                                 </SelectTrigger>
                                 <SelectContent className="max-h-[300px]">
                                   {CATEGORY_OPTIONS.map(c => (
                                      <SelectItem key={c} value={c}>{c}</SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                            )}
                         />
                         <p className="text-[13px] text-muted-foreground">Narrows search scope to avoid ambiguous acronyms across disciplines.</p>
                       </div>
                     </div>
                     
                     {/* Keywords Section */}
                     <div className="space-y-5">
                        <div className="flex items-center justify-between border-b pb-2">
                           <Label className="text-lg font-bold tracking-tight">
                              Focus Keywords <span className={currentTopicKeywords.length >= 10 ? 'text-destructive' : 'text-primary'}>({currentTopicKeywords.length}/10)</span>
                           </Label>
                           {currentTopicKeywords.length > 0 && (
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               onClick={() => setValue(`topics.${activeTopicIndex}.keywords`, [], { shouldDirty: true, shouldValidate: true })}
                               className="text-muted-foreground hover:text-destructive h-8 px-3 text-sm font-medium"
                             >
                               Clear All
                             </Button>
                           )}
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
                           We use an <strong className="text-primary font-semibold">AND search algorithm</strong>. Papers must strongly relate to ALL of these keywords combined. Being concise yields higher-quality matches.
                        </p>

                        <div className="flex flex-wrap gap-2.5 p-5 bg-background border rounded-xl min-h-[80px] items-center shadow-inner">
                          {currentTopicKeywords.length === 0 && <span className="text-sm text-muted-foreground italic tracking-wide">Enter keywords below to begin curating.</span>}
                          {currentTopicKeywords.map((kw, kIdx) => (
                            <span
                              key={kIdx}
                              className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20 shadow-sm transition-all hover:border-primary/40"
                            >
                              {kw}
                              <button
                                type="button"
                                onClick={() => removeKeyword(activeTopicIndex, kIdx)}
                                className="ml-3 bg-background/60 rounded-full p-1 hover:bg-destructive hover:text-white transition-colors focus:ring-2 focus:ring-destructive focus:outline-none"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Keyword Input UI */}
                        <div className="flex sm:flex-row flex-col gap-3">
                          <Input
                            id={`kw-input-${activeTopicIndex}`}
                            placeholder={currentTopicKeywords.length >= 10 ? "Keyword limit reached (Max 10)" : "Type keyword and press Enter..."}
                            disabled={currentTopicKeywords.length >= 10}
                            className="h-12 bg-background border-primary/20 focus:border-primary focus:ring-primary/20 text-base"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addKeyword(activeTopicIndex, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={currentTopicKeywords.length >= 10}
                            className="h-12 px-6 font-semibold shrink-0"
                            onClick={() => {
                              const input = document.getElementById(`kw-input-${activeTopicIndex}`) as HTMLInputElement;
                              if (input) {
                                addKeyword(activeTopicIndex, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            <Plus className="w-5 h-5 mr-2" /> Add Keyword
                          </Button>
                        </div>

                        {/* AI Generator Box */}
                        <div className="mt-6 p-5 bg-muted/40 rounded-xl border border-dashed border-primary/20 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                              <Sparkles className="w-24 h-24" />
                          </div>
                          <Label className="text-sm font-semibold mb-3 flex items-center text-primary relative z-10">
                              <Sparkles className="w-4 h-4 mr-2" /> AI Assistant
                          </Label>
                          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                              <Input
                                placeholder="Describe your topic naturally (e.g. LLM adoption in Healthcare)..."
                                value={aiPrompts[activeTopicIndex] || ''}
                                disabled={currentTopicKeywords.length >= 10}
                                onChange={(e) =>
                                  setAiPrompts((prev) => ({
                                    ...prev,
                                    [activeTopicIndex]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { e.preventDefault(); handleRecommendKeywords(activeTopicIndex); }
                                }}
                                className="w-full h-11 bg-background"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleRecommendKeywords(activeTopicIndex)}
                                disabled={recommending[activeTopicIndex] || !aiPrompts[activeTopicIndex] || currentTopicKeywords.length >= 10}
                                className="h-11 shrink-0 bg-background hover:bg-primary hover:text-primary-foreground border-primary/30 transition-colors"
                              >
                                {recommending[activeTopicIndex] ? 'Generating...' : 'Suggest Keywords'}
                              </Button>
                          </div>
                        </div>
                     </div>
                     
                     {/* Preset Badges UI */}
                     <div className="pt-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-2 mb-3 font-semibold tracking-widest uppercase">
                          Popular Technologies
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_KEYWORDS.map((preset) => {
                            const isActive = currentTopicKeywords.includes(preset);
                            return (
                              <button
                                type="button"
                                key={preset}
                                disabled={isActive || currentTopicKeywords.length >= 10}
                                onClick={() => addKeyword(activeTopicIndex, preset)}
                                className={`text-[13px] font-medium px-4 py-1.5 border rounded-full transition-all duration-200 ${
                                  isActive
                                    ? 'bg-primary border-primary text-primary-foreground opacity-90 cursor-not-allowed shadow-inner'
                                    : 'bg-background hover:bg-muted text-foreground hover:border-foreground/30 shadow-sm'
                                }`}
                              >
                                {isActive ? '✓ ' : ''}{preset}
                              </button>
                            );
                          })}
                        </div>
                     </div>

                     {/* Filters Section */}
                     <div className="pt-8 mt-2 border-t">
                        <Label className="text-lg font-bold block mb-5 tracking-tight">Quality Thresholds</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-3 p-4 bg-background border rounded-lg shadow-sm">
                            <Label className="text-sm font-semibold">Recency (Years)</Label>
                            <Input
                              type="number"
                              min={1}
                              className="h-11"
                              {...register(`topics.${activeTopicIndex}.filters.years_limit`, { valueAsNumber: true })}
                            />
                            {errors.topics?.[activeTopicIndex]?.filters?.years_limit && (
                               <p className="text-xs text-destructive">{errors.topics[activeTopicIndex]?.filters?.years_limit?.message}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground">Papers published since {new Date().getFullYear() - (watch(`topics.${activeTopicIndex}.filters.years_limit`) || 3)}</p>
                          </div>
                          
                          <div className="space-y-3 p-4 bg-background border rounded-lg shadow-sm">
                            <Label className="text-sm font-semibold">Min SJR Rank</Label>
                            <Controller
                              control={control}
                              name={`topics.${activeTopicIndex}.filters.min_journal_rank`}
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="w-full h-11">
                                    <SelectValue placeholder="Select standard" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Q1">Q1 (Premium Journals)</SelectItem>
                                    <SelectItem value="Q2">Q2 (Standard Quality)</SelectItem>
                                    <SelectItem value="Q3">Q3 (Acceptable)</SelectItem>
                                    <SelectItem value="Q4">Q4 (All Indexed)</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            <p className="text-[11px] text-muted-foreground">Scimago Journal Rank quartile filter.</p>
                          </div>
                          
                          <div className="space-y-3 p-4 bg-background border rounded-lg shadow-sm">
                            <Label className="text-sm font-semibold">Min Citations</Label>
                            <Input
                              type="number"
                              min={0}
                              className="h-11"
                              {...register(`topics.${activeTopicIndex}.filters.min_citations`, { valueAsNumber: true })}
                            />
                             {errors.topics?.[activeTopicIndex]?.filters?.min_citations && (
                               <p className="text-xs text-destructive">{errors.topics[activeTopicIndex]?.filters?.min_citations?.message}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground">Exclude papers with less citations.</p>
                          </div>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex flex-col items-center justify-center py-32 bg-card border-dashed border-2 shadow-sm rounded-xl transition-all duration-300">
                   <div className="bg-muted p-5 rounded-full mb-6 ring-8 ring-background">
                      <Filter className="w-12 h-12 text-muted-foreground" />
                   </div>
                   <CardTitle className="mb-3 text-2xl font-bold tracking-tight">No Active Filter</CardTitle>
                   <CardDescription className="mb-8 text-base max-w-md text-center leading-relaxed">
                      You haven&apos;t selected a filter to view. Select an existing one from the menu or define a new research query to get tracking.
                   </CardDescription>
                   {topics.length < 5 && (
                     <Button type="button" size="lg" onClick={addTopic} className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12 text-base font-semibold">
                       <Plus className="w-5 h-5 mr-2" /> Create First Filter
                     </Button>
                   )}
                </Card>
              )}
            </div>
          </div>

          {/* Fixed Footer Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-border/40 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="hidden md:flex flex-col">
                <p className={`font-semibold transition-colors duration-300 ${isDirty ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isDirty ? 'You have updates to save' : 'Configuration is up to date'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isDirty ? 'Press save changes to apply your new keywords and topics.' : 'No modifications detected.'}
                </p>
              </div>
              
              {/* Validation Error Alert */}
              {Object.keys(errors).length > 0 && (
                 <div className="hidden md:flex items-center text-destructive text-sm font-semibold mr-4 px-4 py-2 bg-destructive/10 rounded-full border border-destructive/20 animate-in fade-in slide-in-from-bottom-2">
                    <X className="w-4 h-4 mr-2" /> Please fix validation errors before saving.
                 </div>
              )}
              
              <div className="w-full md:w-auto flex justify-center md:justify-end">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending || !isDirty || Object.keys(errors).length > 0}
                  size="lg"
                  className={`w-full md:w-auto h-12 px-8 rounded-full transition-all duration-500 relative overflow-hidden ${
                    isDirty && Object.keys(errors).length === 0
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(79,70,229,0.5)] ring-2 ring-primary/40 ring-offset-2 ring-offset-background hover:scale-[1.02]'
                      : 'bg-muted text-muted-foreground border border-dashed border-muted-foreground/30 hover:bg-muted'
                  }`}
                >
                  <Save className={`w-5 h-5 mr-2 relative z-10 ${saveMutation.isPending ? 'animate-pulse' : ''}`} />
                  <span className="relative z-10 font-bold text-base">
                    {saveMutation.isPending ? 'Saving...' : isDirty ? 'Save Profile' : 'Saved'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
