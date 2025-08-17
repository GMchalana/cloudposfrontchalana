'use client';

import { ReactNode } from 'react';
import { AuthProvider as Provider } from '@/context/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <Provider>{children}</Provider>;
}