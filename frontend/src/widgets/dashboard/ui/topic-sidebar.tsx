'use client';

import { useFormContext } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserConfig } from '@/entities/topic/model/schema';
import { useTopicManager } from '@/features/topic-manager/model/use-topic-manager';

interface TopicSidebarProps {
  activeTopicIndex: number;
  setActiveTopicIndex: (index: number) => void;
}

export function TopicSidebar({ activeTopicIndex, setActiveTopicIndex }: TopicSidebarProps) {
  const { watch } = useFormContext<UserConfig>();
  const { topics, addTopic } = useTopicManager(activeTopicIndex, setActiveTopicIndex);

  return (
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
  );
}
