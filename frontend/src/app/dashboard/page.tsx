'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Save, LogOut } from 'lucide-react';

interface Topic {
  name: string;
  keywords: string[];
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
}

export default function DashboardPage() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
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
        setConfig(data.config || { topics: [], schedule: 'daily', delivery: 'email' });
      } else {
        // Default config if none exists
        setConfig({
          topics: [
            {
              name: "Default Topic",
              keywords: [],
              filters: { years_limit: 3, min_journal_rank: "Q2", min_citations: 5 }
            }
          ],
          schedule: "daily",
          delivery: "email"
        });
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
      alert('Configuration saved successfully!');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 dark">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Scholar Pulse Dashboard</h1>
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

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
                <Label>Keywords</Label>
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
                <div className="flex gap-2">
                  <Input 
                    id={`kw-input-${tIdx}`}
                    placeholder="Add keyword..." 
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
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={topic.filters.min_journal_rank}
                    onChange={(e) => updateFilter(tIdx, 'min_journal_rank', e.target.value)}
                  >
                    <option value="Q1">Q1 (Premium)</option>
                    <option value="Q2">Q2 (Standard)</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                  </select>
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
    </div>
  );
}
