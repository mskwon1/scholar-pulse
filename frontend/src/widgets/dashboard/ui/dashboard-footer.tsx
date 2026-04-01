'use client';

import { useFormContext, useFormState } from 'react-hook-form';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserConfig } from '@/entities/topic/model/schema';

interface DashboardFooterProps {
  isSaving: boolean;
  onSubmit: (data: UserConfig) => void;
}

export function DashboardFooter({ isSaving, onSubmit }: DashboardFooterProps) {
  const { handleSubmit } = useFormContext<UserConfig>();
  const { errors } = useFormState<UserConfig>();
  
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t shadow-2xl z-50 animate-in slide-in-from-bottom-8">
      <div className="max-w-5xl mx-auto flex sm:flex-row flex-col items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground flex items-center">
            {hasErrors ? (
              <span className="text-destructive font-semibold flex items-center bg-destructive/10 px-3 py-1.5 rounded-full">
                Please fix the validation errors above before saving.
              </span>
            ) : (
                "Unsaved changes will be lost if you leave this page."
            )}
        </p>
        <Button 
          type="button" 
          size="lg" 
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving || hasErrors} 
          className="w-full sm:w-auto min-w-[140px] shadow-lg hover:shadow-xl transition-all font-bold text-md rounded-full px-8 h-12 truncate"
        >
            <Save className={`w-5 h-5 mr-2 ${isSaving ? 'animate-pulse' : ''}`} /> 
            {isSaving ? 'Saving Pulse...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
