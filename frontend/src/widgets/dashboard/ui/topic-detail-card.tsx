'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Trash2, Plus, Sparkles, X, Filter } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { UserConfig } from '@/entities/topic/model/schema';
import { CATEGORY_OPTIONS, PRESET_KEYWORDS } from '@/shared/config/constants';
import { useTopicManager } from '@/features/topic-manager/model/use-topic-manager';

interface TopicDetailCardProps {
  activeTopicIndex: number;
  setActiveTopicIndex: (index: number) => void;
  topicManager: ReturnType<typeof useTopicManager>;
}

export function TopicDetailCard({ activeTopicIndex, topicManager }: TopicDetailCardProps) {
  const { control, watch, register, setValue, formState: { errors } } = useFormContext<UserConfig>();
  
  const { 
    topics, 
    fields,
    addKeyword, 
    removeKeyword, 
    handleRecommendKeywords, 
    confirmRemoveTopic, 
    aiPrompts, 
    setAiPrompts, 
    recommending,
    addTopic
  } = topicManager;

  const currentTopicKeywords = activeTopicIndex >= 0 ? (watch(`topics.${activeTopicIndex}.keywords`) || []) : [];

  if (activeTopicIndex < 0 || activeTopicIndex >= topics.length) {
    return (
      <Card className="flex flex-col items-center justify-center py-32 bg-card border-dashed border-2 shadow-sm rounded-xl transition-all duration-300">
          <div className="bg-muted p-5 rounded-full mb-6 ring-8 ring-background">
            <Filter className="w-12 h-12 text-muted-foreground" />
          </div>
          <CardTitle className="mb-3 text-2xl font-bold tracking-tight">No Active Filter</CardTitle>
          <CardDescription className="mb-8 text-base max-w-md text-center leading-relaxed">
            You haven&apos;t selected a filter to view. Select an existing one from the menu or define a new research query to get tracking.
          </CardDescription>
          {fields.length < 5 && (
            <Button type="button" size="lg" onClick={addTopic} className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12 text-base font-semibold">
              <Plus className="w-5 h-5 mr-2" /> Create First Filter
            </Button>
          )}
      </Card>
    );
  }

  return (
    <Card key={fields[activeTopicIndex]?.id || 'empty_detail_card'} className="shadow-sm border-primary/20 bg-card overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 w-full" />
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Filter Settings</CardTitle>
            <CardDescription className="text-base mt-1">Configure focus domain and tracking keywords.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start w-full sm:w-auto">
            {watch('delivery_topic_index') !== activeTopicIndex ? (
               <Button 
                 type="button" 
                 variant="outline" 
                 size="sm"
                 className="text-muted-foreground border-dashed border-muted-foreground/40 flex-1 sm:flex-none hover:bg-primary/5 hover:text-primary hover:border-primary/50 flex items-center font-medium transition-all"
                 onClick={() => setValue('delivery_topic_index', activeTopicIndex, { shouldDirty: true })}
               >
                 <Sparkles className="w-4 h-4 mr-1.5" /> Set as Active Default
               </Button>
            ) : (
               <div className="flex items-center justify-center px-4 py-1.5 bg-primary text-primary-foreground rounded-md shadow-md border border-primary text-sm font-semibold flex-1 sm:flex-none">
                 <Sparkles className="w-4 h-4 mr-1.5 fill-current" /> Active Delivery Filter
               </div>
            )}
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
              onClick={() => confirmRemoveTopic(activeTopicIndex)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Filter
            </Button>
          </div>
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
  );
}
