import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
export type SignupFormData = z.infer<typeof signupSchema>;

export function useLoginMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw new Error(error.message);
      return authData;
    },
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to login');
    }
  });
}

export function useSignupMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (error) throw new Error(error.message);
      return authData;
    },
    onSuccess: () => {
      router.push('/login?message=Check your email to confirm your account.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sign up');
    }
  });
}
