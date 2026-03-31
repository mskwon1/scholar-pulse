'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Save, LogOut, Sparkles } from 'lucide-react';

const PRESET_KEYWORDS = [
  "LLM", "Agent", "RAG", "Prompt Engineering", "Quantum Computing", 
  "Solid-State Battery", "Renewable Energy", "Autonomous Driving", 
  "Computer Vision", "Neuroscience", "Virology", "Fintech", "V2G", 
  "Edge Computing", "HCI", "Transformers", "NLP", "Robotics", 
  "Bioinformatics", "Microplastics"
];

interface Topic {
  name: string;
  keywords: string[];
  match_type: string;
  filters: {
    years_limit: number;
    min_journal_rank: string;
    min_citations: number;
  };
}

interface UserConfig {
  topics: Topic[];
  schedule: string;
  delivery: string;
  receive_email?: boolean;
}

export default function DashboardPage() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<{ [key: number]: string }>({});
  const [recommending, setRecommending] = useState<{ [key: number]: boolean }>({});
  
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        fetchConfig(user.id);
      }
    };
    checkUser();
  }, [router]);

  const fetchConfig = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching config:', error);
      } else if (data) {
        setConfig(data.config || { topics: [], schedule: 'daily', delivery: 'email', receive_email: true });
        setOriginalConfig(data.config || { topics: [], schedule: 'daily', delivery: 'email', receive_email: true });
      } else {
        // Default config if none exists
        const defaultCfg = {
          topics: [
            {
              name: "Default Topic",
              keywords: [],
              match_type: "AND",
              filters: { years_limit: 3, min_journal_rank: "Q2", min_citations: 5 }
            }
          ],
          schedule: "daily",
          delivery: "email",
          receive_email: true
        };
        setConfig(defaultCfg);
        setOriginalConfig(defaultCfg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !config) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_config')
      .upsert({ user_id: user.id, config: config }, { onConflict: 'user_id' });

    if (error) {
      alert('Failed to save configuration: ' + error.message);
    } else {
      setOriginalConfig(config);
      alert('Configuration saved successfully!');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRecommendKeywords = async (topicIndex: number) => {
    if (!config) return;
    const prompt = aiPrompts[topicIndex];
    if (!prompt) return;
    setRecommending(prev => ({ ...prev, [topicIndex]: true }));
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicDescription: prompt })
      });
      const data = await res.json();
      if (data.keywords && Array.isArray(data.keywords)) {
        const newConfig = { ...config };
        const existing = newConfig.topics[topicIndex].keywords || [];
        const newKeys = data.keywords.filter((k: string) => !existing.includes(k));
        newConfig.topics[topicIndex].keywords = [...existing, ...newKeys];
        setConfig(newConfig);
      } else {
        alert(data.error || 'Failed to fetch recommendations');
      }
    } catch (e: any) {
      alert('Error fetching recommendations');
    }
    setRecommending(prev => ({ ...prev, [topicIndex]: false }));
  };

  const updateTopicStringField = (topicIndex: number, field: keyof Topic, value: string) => {
    if (!config) return;
    const newConfig = { ...config };
    (newConfig.topics[topicIndex] as any)[field] = value;
    setConfig(newConfig);
  };

  const addKeyword = (topicIndex: number, keyword: string) => {
    if (!config || !keyword || !keyword.trim()) return;
    const trimmed = keyword.trim();
    const newConfig = { ...config };
    if (!newConfig.topics[topicIndex].keywords.includes(trimmed)) {
      newConfig.topics[topicIndex].keywords = [...newConfig.topics[topicIndex].keywords, trimmed];
      setConfig(newConfig);
    }
  };

  const removeKeyword = (topicIndex: number, keywordIndex: number) => {
    if (!config) return;
    const newConfig = { ...config };
    const newKeywords = [...newConfig.topics[topicIndex].keywords];
    newKeywords.splice(keywordIndex, 1);
    newConfig.topics[topicIndex].keywords = newKeywords;
    setConfig(newConfig);
  };

  const updateFilter = (topicIndex: number, field: string, value: any) => {
    if (!config) return;
    const newConfig = { ...config };
    // Handle numeric values
    let finalValue = value;
    if (field === 'years_limit' || field === 'min_citations') {
      finalValue = parseInt(value);
      if (isNaN(finalValue)) finalValue = 0;
    }
    (newConfig.topics[topicIndex].filters as any)[field] = finalValue;
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-background text-foreground dark">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-primary/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">
          Syncing your insights...
        </p>
      </div>
    );
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-32 dark">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Scholar Pulse Logo" width={32} height={32} className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-md shadow-sm shrink-0" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary truncate">Scholar Pulse</h1>
            <span className="text-xl md:text-2xl font-medium text-muted-foreground tracking-tight hidden sm:inline-block">Dashboard</span>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handleLogout} className="flex-1 md:flex-none">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {config && (
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Manage your daily research insights delivery.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Receive Daily Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Get an AI-curated summary of the latest papers matching your topics.
                    <br/>
                    <span className="font-bold text-primary">Emails are sent daily at 9:00 AM (KST).</span>
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Switch
                    checked={config.receive_email !== false}
                    onCheckedChange={(checked) => setConfig({ ...config, receive_email: checked })}
                  />
                  <span className="text-sm font-medium">{config.receive_email !== false ? 'On' : 'Off'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {config?.topics.map((topic, tIdx) => (
          <Card key={tIdx}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Topic: {topic.name}</span>
              </CardTitle>
              <CardDescription>Configure search parameters for this research topic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Keywords Section */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                  <Label className="text-lg">Keywords</Label>
                  <div className="flex items-center justify-between w-full md:w-auto gap-2">
                    <Label className="text-sm text-muted-foreground shrink-0">Search Mode:</Label>
                    <Select value={topic.match_type || 'AND'} onValueChange={(val) => updateTopicStringField(tIdx, 'match_type', val || '')}>
                      <SelectTrigger className="w-[160px] md:w-[200px] h-9">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">All (AND) - Strict</SelectItem>
                        <SelectItem value="OR">Any (OR) - Broad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {topic.keywords.map((kw, kIdx) => (
                    <span key={kIdx} className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
                      {kw}
                      <button onClick={() => removeKeyword(tIdx, kIdx)} className="ml-2 hover:text-destructive">
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
                        addKeyword(tIdx, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button variant="outline" size="icon" onClick={() => {
                    const input = document.getElementById(`kw-input-${tIdx}`) as HTMLInputElement;
                    if (input) {
                      addKeyword(tIdx, input.value);
                      input.value = '';
                    }
                  }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Hybrid UI: AI Generator */}
                <div className="flex flex-col md:flex-row gap-2 md:items-center bg-muted/50 p-3 rounded-md border border-dashed">
                  <Input 
                    placeholder="Describe topic for AI to suggest keywords... (e.g. LLM in Healthcare)" 
                    value={aiPrompts[tIdx] || ''}
                    onChange={(e) => setAiPrompts(prev => ({ ...prev, [tIdx]: e.target.value }))}
                    className="w-full grow"
                  />
                  <Button variant="secondary" onClick={() => handleRecommendKeywords(tIdx)} disabled={recommending[tIdx] || !aiPrompts[tIdx]} className="w-full md:w-auto shrink-0">
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    {recommending[tIdx] ? 'Thinking...' : 'AI Recommend'}
                  </Button>
                </div>

                {/* Preset Badges UI */}
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground block mb-2">Preset Keywords (Click to add):</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_KEYWORDS.map((preset, pIdx) => {
                      const isActive = topic.keywords.includes(preset);
                      return (
                        <button 
                          key={pIdx}
                          disabled={isActive}
                          onClick={() => addKeyword(tIdx, preset)}
                          className={`text-xs px-2 py-1 border rounded-md transition-colors ${isActive ? 'bg-primary/20 border-primary/30 text-primary opacity-50 cursor-not-allowed' : 'bg-background hover:bg-muted text-muted-foreground'}`}
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
                    value={topic.filters.years_limit}
                    onChange={(e) => updateFilter(tIdx, 'years_limit', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Journal Rank (SJR)</Label>
                  <Select value={topic.filters.min_journal_rank} onValueChange={(val) => updateFilter(tIdx, 'min_journal_rank', val || '')}>
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
                </div>
                <div className="space-y-2">
                  <Label>Min Citations</Label>
                  <Input 
                    type="number" 
                    value={topic.filters.min_citations}
                    onChange={(e) => updateFilter(tIdx, 'min_citations', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fixed Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-border/40 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] transition-all duration-300">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="hidden md:flex flex-col">
            <p className={`font-semibold transition-colors duration-300 ${hasChanges ? 'text-primary' : 'text-muted-foreground'}`}>
              {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasChanges ? 'Please save your configuration to apply.' : 'Your settings are up to date.'}
            </p>
          </div>
          <div className="w-full md:w-auto flex justify-center md:justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges} 
              size="lg" 
              className={`w-full md:w-auto transition-all duration-500 relative overflow-hidden ${
                hasChanges 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(79,70,229,0.5)] ring-2 ring-primary/50 ring-offset-2 ring-offset-background' 
                  : 'bg-muted/50 text-muted-foreground border border-dashed border-muted-foreground/30'
              }`}
            >
              <Save className="w-5 h-5 mr-2 relative z-10" />
              <span className="relative z-10 font-bold">{saving ? 'Saving...' : hasChanges ? 'Save Changes!' : 'Saved'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
