import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button.js';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="h-16 w-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6">
        <FileQuestion className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404 - Page Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        The page you are looking for does not exist in Omishtu-Joy or may have been relocated.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
