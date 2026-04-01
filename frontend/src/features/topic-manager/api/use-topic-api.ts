import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { queryKeys } from '@/shared/api/query-keys';
import { User } from '@supabase/auth-js';
import { UserConfig } from '@/entities/topic/model/schema';
import { toast } from 'sonner';

export function useConfigQuery(user: User | null) {
  return useQuery({
    queryKey: queryKeys.config.detail(user?.id || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_config')
        .select('*')
        .eq('user_id', user?.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.config) return data.config as UserConfig;
      
      // Default config
      return {
        topics: [],
        schedule: 'daily',
        delivery: 'email',
        receive_email: true,
      };
    },
    enabled: !!user,
  });
}

export function useSaveConfigMutation(user: User | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: UserConfig) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('user_config').upsert({
        user_id: user.id,
        config: config,
      }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.config.detail(user?.id || '') });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save configuration');
    },
  });
}
