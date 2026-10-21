import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle.js';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center bg-background p-4 text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 flex flex-col items-center">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold text-primary">
          <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center border border-border">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <span>Omishtu-Joy</span>
        </Link>
        <p className="text-sm text-muted-foreground mt-2">Training Center Management Portal</p>
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};
