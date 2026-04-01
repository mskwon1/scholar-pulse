'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { LogOut, Plus, Save, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
  name: z.string(),
  keywords: z.array(z.string()),
  match_type: z.string(),
  filters: z.object({
    years_limit: z.number(),
    min_journal_rank: z.string(),
    min_citations: z.number(),
  }),
});

const userConfigSchema = z.object({
  topics: z.array(topicSchema),
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
        topics: [
          {
            name: 'Default Topic',
            keywords: [],
            match_type: 'AND',
            filters: {
              years_limit: 3,
              min_journal_rank: 'Q2',
              min_citations: 5,
            },
          },
        ],
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
    formState: { isDirty },
  } = useForm<UserConfig>({
    resolver: zodResolver(userConfigSchema),
  });

  // Sync Data
  useEffect(() => {
    if (queryData) {
      reset(queryData);
    }
  }, [queryData, reset]);

  const { fields: topics } = useFieldArray({
    control,
    name: 'topics',
  });

  // 4. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (configData: UserConfig) => {
      if (!user) throw new Error('Not logged in');
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
        const newKeys = data.keywords.filter(
          (k: string) => !currentKeywords.includes(k)
        );
        setValue(
          `topics.${topicIndex}.keywords`,
          [...currentKeywords, ...newKeys],
          {
            shouldDirty: true,
          }
        );
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
    if (!currentKeywords.includes(trimmed)) {
      setValue(`topics.${topicIndex}.keywords`, [...currentKeywords, trimmed], {
        shouldDirty: true,
      });
    }
  };

  const removeKeyword = (topicIndex: number, keywordIndex: number) => {
    const currentKeywords = getValues(`topics.${topicIndex}.keywords`) || [];
    const newKeywords = [...currentKeywords];
    newKeywords.splice(keywordIndex, 1);
    setValue(`topics.${topicIndex}.keywords`, newKeywords, {
      shouldDirty: true,
    });
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

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-32 dark">
      <div className="max-w-4xl mx-auto space-y-8">
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
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 md:flex-none"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Manage your daily research insights delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Receive Daily Reports
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get an AI-curated summary of the latest papers matching your
                    topics.
                    <br />
                    <span className="font-bold text-primary">
                      Emails are sent daily at 9:00 AM (KST).
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Controller
                    control={control}
                    name="receive_email"
                    render={({ field }) => (
                      <>
                        <Switch
                          checked={field.value !== false}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                        <span className="text-sm font-medium">
                          {field.value !== false ? 'On' : 'Off'}
                        </span>
                      </>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {topics.map((topic, tIdx) => {
            const currentKeywords = watch(`topics.${tIdx}.keywords`) || [];

            return (
              <Card key={topic.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Topic: {watch(`topics.${tIdx}.name`)}</span>
                  </CardTitle>
                  <CardDescription>
                    Configure search parameters for this research topic.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Keywords Section */}
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-lg">Keywords</Label>
                        {currentKeywords.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setValue(`topics.${tIdx}.keywords`, [], { shouldDirty: true })}
                            className="text-muted-foreground hover:text-destructive h-6 px-2 text-xs"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between w-full md:w-auto gap-2">
                        <Label className="text-sm text-muted-foreground shrink-0">
                          Search Mode:
                        </Label>
                        <Controller
                          control={control}
                          name={`topics.${tIdx}.match_type`}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-[160px] md:w-[200px] h-9">
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">
                                  All (AND) - Strict
                                </SelectItem>
                                <SelectItem value="OR">
                                  Any (OR) - Broad
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentKeywords.map((kw, kIdx) => (
                        <span
                          key={kw}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(tIdx, kIdx)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Hybrid UI: Manual Input */}
                    <div className="flex gap-2">
                      <Input
                        id={`kw-input-${tIdx}`}
                        placeholder="Type keyword and press Enter..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent implicit form submission
                            addKeyword(
                              tIdx,
                              (e.target as HTMLInputElement).value
                            );
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const input = document.getElementById(
                            `kw-input-${tIdx}`
                          ) as HTMLInputElement;
                          if (input) {
                            addKeyword(tIdx, input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Hybrid UI: AI Generator */}
                    <div className="flex flex-col md:flex-row gap-2 md:items-center bg-muted/50 p-3 rounded-md border border-dashed">
                      <Input
                        placeholder="Describe topic for AI to suggest keywords... (e.g. LLM in Healthcare)"
                        value={aiPrompts[tIdx] || ''}
                        onChange={(e) =>
                          setAiPrompts((prev) => ({
                            ...prev,
                            [tIdx]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        className="w-full grow"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleRecommendKeywords(tIdx)}
                        disabled={recommending[tIdx] || !aiPrompts[tIdx]}
                        className="w-full md:w-auto shrink-0"
                      >
                        <Sparkles className="w-4 h-4 mr-2 text-primary" />
                        {recommending[tIdx] ? 'Thinking...' : 'AI Recommend'}
                      </Button>
                    </div>

                    {/* Preset Badges UI */}
                    <div className="mt-4">
                      <Label className="text-xs text-muted-foreground block mb-2">
                        Preset Keywords (Click to add):
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_KEYWORDS.map((preset) => {
                          const isActive = currentKeywords.includes(preset);
                          return (
                            <button
                              type="button"
                              key={preset}
                              disabled={isActive}
                              onClick={() => addKeyword(tIdx, preset)}
                              className={`text-xs px-2 py-1 border rounded-md transition-colors ${
                                isActive
                                  ? 'bg-primary/20 border-primary/30 text-primary opacity-50 cursor-not-allowed'
                                  : 'bg-background hover:bg-muted text-muted-foreground'
                              }`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Filters Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Year Limit (Last X years)</Label>
                      <Input
                        type="number"
                        {...register(`topics.${tIdx}.filters.years_limit`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Journal Rank (SJR)</Label>
                      <Controller
                        control={control}
                        name={`topics.${tIdx}.filters.min_journal_rank`}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select standard" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Q1">Q1 (Premium)</SelectItem>
                              <SelectItem value="Q2">Q2 (Standard)</SelectItem>
                              <SelectItem value="Q3">Q3</SelectItem>
                              <SelectItem value="Q4">Q4</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Citations</Label>
                      <Input
                        type="number"
                        {...register(`topics.${tIdx}.filters.min_citations`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Fixed Footer Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-border/40 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] transition-all duration-300">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="hidden md:flex flex-col">
                <p
                  className={`font-semibold transition-colors duration-300 ${isDirty ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {isDirty ? 'You have unsaved changes' : 'All changes saved'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isDirty
                    ? 'Please save your configuration to apply.'
                    : 'Your settings are up to date.'}
                </p>
              </div>
              <div className="w-full md:w-auto flex justify-center md:justify-end">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending || !isDirty}
                  size="lg"
                  className={`w-full md:w-auto transition-all duration-500 relative overflow-hidden ${
                    isDirty
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(79,70,229,0.5)] ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
                      : 'bg-muted/50 text-muted-foreground border border-dashed border-muted-foreground/30'
                  }`}
                >
                  <Save className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10 font-bold">
                    {saveMutation.isPending
                      ? 'Saving...'
                      : isDirty
                        ? 'Save Changes!'
                        : 'Saved'}
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
