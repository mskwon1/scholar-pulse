'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom } from 'jotai';

import { userAtom } from '@/entities/user/model/store';
import { UserConfig, userConfigSchema } from '@/entities/topic/model/schema';
import { useConfigQuery, useSaveConfigMutation } from '@/features/topic-manager/api/use-topic-api';

import { DashboardHeader } from '@/widgets/dashboard/ui/dashboard-header';
import { DeliverySettingsCard } from '@/widgets/dashboard/ui/delivery-settings-card';
import { TopicSidebar } from '@/widgets/dashboard/ui/topic-sidebar';
import { TopicDetailCard } from '@/widgets/dashboard/ui/topic-detail-card';
import { DashboardFooter } from '@/widgets/dashboard/ui/dashboard-footer';

export function DashboardView() {
  const router = useRouter();
  const [user, setUser] = useAtom(userAtom);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  // Auth redirect effect
  useEffect(() => {
    if (!user) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        router.push('/login');
      }
    }
  }, [user, router, setUser]);

  const { data: config, isLoading } = useConfigQuery(user);
  const saveMutation = useSaveConfigMutation(user);

  const methods = useForm<UserConfig>({
    resolver: zodResolver(userConfigSchema),
    defaultValues: config || {
      topics: [],
      schedule: 'daily',
      delivery: 'email',
      receive_email: true,
    },
    mode: 'onChange',
  });

  const { reset } = methods;

  useEffect(() => {
    if (config) {
      reset(config);
    }
  }, [config, reset]);

  if (!user || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const onSubmit = (data: UserConfig) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-background pb-32">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <DashboardHeader />
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 mt-8">
            <DeliverySettingsCard />

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <TopicSidebar 
                activeTopicIndex={activeTopicIndex} 
                setActiveTopicIndex={setActiveTopicIndex} 
              />
              <div className="flex-1 w-full shrink min-w-0">
                <TopicDetailCard 
                  activeTopicIndex={activeTopicIndex} 
                  setActiveTopicIndex={setActiveTopicIndex} 
                />
              </div>
            </div>
          </main>

          <DashboardFooter 
            isSaving={saveMutation.isPending} 
            onSubmit={onSubmit} 
          />
        </form>
      </FormProvider>
    </div>
  );
}
