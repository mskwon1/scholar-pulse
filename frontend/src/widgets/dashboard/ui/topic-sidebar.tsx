'use client';

import { useFormContext } from 'react-hook-form';
import { Plus, Star, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { UserConfig } from '@/entities/topic/model/schema';
import { useTopicManager } from '@/features/topic-manager/model/use-topic-manager';

interface TopicSidebarProps {
  activeTopicIndex: number;
  setActiveTopicIndex: (index: number) => void;
  topicManager: ReturnType<typeof useTopicManager>;
}

export function TopicSidebar({ activeTopicIndex, setActiveTopicIndex, topicManager }: TopicSidebarProps) {
  const { watch, formState: { errors } } = useFormContext<UserConfig>();
  const { fields, addTopic } = topicManager;

  return (
    <div className="w-full lg:w-72 shrink-0 space-y-4">
      {/* Mobile: Select active filter */}
      <div className="lg:hidden bg-card p-4 rounded-xl border shadow-sm">
        <Label className="mb-2 flex justify-between text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <span>Active Filter</span>
            <span>{fields.length}/5</span>
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
            {fields.map((field, i) => (
              <SelectItem key={field.id} value={i.toString()}>
                  {watch(`topics.${i}.name`) || `Filter ${i+1}`}
              </SelectItem>
            ))}
            {fields.length < 5 && (
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
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{fields.length}/5</span>
        </div>
        
        <div className="space-y-1">
            {fields.map((field, i) => {
              const isActive = activeTopicIndex === i;
              const name = watch(`topics.${i}.name`) || `Filter ${i+1}`;
              const keywordCount = (watch(`topics.${i}.keywords`) || []).length;
              return (
              <button 
                  type="button" 
                  key={field.id} 
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`relative w-full text-left p-3 rounded-lg border transition-all duration-200 group flex items-center justify-between ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-md' : 'bg-background border-border text-foreground hover:bg-muted hover:border-primary/40 shadow-sm'}`}
                  onClick={() => setActiveTopicIndex(i)}
              >
                  {watch('delivery_topic_index') === i && (
                     <div className={`absolute -top-1 -right-1 z-10 p-1 rounded-full ${isActive ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'} shadow-sm border border-border`}>
                       <Star className="w-3 h-3 fill-current" />
                     </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center">
                          <span className={`truncate text-sm font-semibold pr-2 ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>{name}</span>
                          {errors?.topics && Array.isArray(errors.topics) && errors.topics[i] && (
                            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                          )}
                      </div>
                      <span className={`text-[11px] mt-0.5 text-left ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{keywordCount} keyword{keywordCount !== 1 && 's'}</span>
                  </div>
              </button>
              )
            })}
            
        {fields.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground italic">No filters created yet.</div>
        )}
      </div>
        
      {/* Add button */}
      {fields.length < 5 && (
        <Button type="button" variant="outline" className="w-full mt-4 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50" onClick={addTopic}>
          <Plus className="w-4 h-4 mr-2" /> New Filter
        </Button>
      )}
    </div>
    </div>
  );
}
