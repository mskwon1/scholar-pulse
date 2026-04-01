import { useFormContext, useFieldArray } from 'react-hook-form';
import { UserConfig } from '@/entities/topic/model/schema';
import { useAtom } from 'jotai';
import { aiPromptsAtom, recommendingAtom } from '@/lib/store';
import { toast } from 'sonner';

export function useTopicManager(
  activeTopicIndex: number,
  setActiveTopicIndex: (index: number) => void
) {
  const { control, getValues, setValue } = useFormContext<UserConfig>();
  const [aiPrompts, setAiPrompts] = useAtom(aiPromptsAtom);
  const [recommending, setRecommending] = useAtom(recommendingAtom);

  const { fields: topics, append, remove } = useFieldArray({
    control,
    name: 'topics',
  });

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
  
  return {
    topics,
    addKeyword,
    removeKeyword,
    handleRecommendKeywords,
    addTopic,
    confirmRemoveTopic,
    aiPrompts,
    setAiPrompts,
    recommending
  };
}
