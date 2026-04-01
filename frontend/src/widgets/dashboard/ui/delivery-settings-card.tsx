'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Settings2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { UserConfig } from '@/entities/topic/model/schema';

export function DeliverySettingsCard() {
  const { control, watch } = useFormContext<UserConfig>();
  const topicsLength = watch('topics')?.length || 0;

  return (
    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center text-lg">
           <Settings2 className="w-5 h-5 mr-2 text-primary" /> Delivery Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground max-w-[600px] leading-relaxed">
              Get an AI-curated summary of the latest papers matching your <strong className="text-foreground">{topicsLength} active filters</strong>. 
              Emails are processed and sent daily at <span className="font-semibold text-primary">9:00 AM (KST)</span>.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-1 bg-background px-4 py-2 rounded-lg border">
            <span className="text-sm font-medium whitespace-nowrap">
              {watch("receive_email") !== false ? 'Notifications On' : 'Notifications Off'}
            </span>
            <Controller
              control={control}
              name="receive_email"
              render={({ field }) => (
                <Switch
                  checked={field.value !== false}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
