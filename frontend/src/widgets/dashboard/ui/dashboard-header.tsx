'use client';

import Image from 'next/image';
import { Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { supabase } from '@/shared/api/supabase';
import { useAtom } from 'jotai';
import { userAtom } from '@/entities/user/model/store';
import { useRouter } from 'next/navigation';

export function DashboardHeader() {
  const [, setUser] = useAtom(userAtom);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Scholar Pulse Logo"
          width={32}
          height={32}
          className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-md shadow-sm shrink-0"
        />
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary truncate">
          Scholar Pulse
        </h1>
        <span className="text-xl md:text-2xl font-medium text-muted-foreground tracking-tight hidden sm:inline-block">
          Dashboard
        </span>
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="hidden md:flex items-center bg-card shadow-sm border rounded-full px-4 py-1.5">
          <Sparkles className="w-4 h-4 text-primary mr-2" />
          <span className="text-sm font-medium">Daily AI Report Active</span>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex-1 md:flex-none border-dashed"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
