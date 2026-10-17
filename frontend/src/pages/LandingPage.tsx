import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkHealth, HealthData } from '../api/health.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Activity,
  Server,
  Database,
  Code,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const sampleChartData = [
  { month: 'May', enrollments: 35, completions: 28 },
  { month: 'Jun', enrollments: 48, completions: 42 },
  { month: 'Jul', enrollments: 62, completions: 55 },
  { month: 'Aug', enrollments: 80, completions: 72 },
  { month: 'Sep', enrollments: 95, completions: 88 },
  { month: 'Oct', enrollments: 120, completions: 104 },
];

export const LandingPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Backend connection unavailable');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="secondary" className="px-3.5 py-1 text-xs">
          Omishtu-Joy Platform Active
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Training Center Management Platform
        </h1>
        <p className="text-lg text-muted-foreground">
          Streamlining student registration, academic scheduling, attendance verification, cashiering, and core financial accounting in a unified purple &amp; white design.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link to="/login">
            <Button size="lg" className="shadow-sm">Access Staff Hub</Button>
          </Link>
          <Button variant="outline" size="lg" onClick={fetchHealth} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Probe API Health</span>
          </Button>
        </div>
      </div>

      {/* Backend Live Status Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2.5 text-foreground">
              <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              API Connectivity &amp; Status
            </CardTitle>
            <CardDescription>Live heartbeat to Express backend (/api/health)</CardDescription>
          </div>
          {loading ? (
            <Badge variant="subtle">Connecting...</Badge>
          ) : health?.status === 'ok' ? (
            <Badge variant="success" className="flex items-center gap-1.5 py-1 px-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Active Online
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-3">
              <AlertCircle className="h-3.5 w-3.5" /> Standby Mode
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Probing server status...</span>
            </div>
          ) : health ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-secondary/70 p-3.5 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground block font-medium">Service State</span>
                <span className="font-semibold uppercase text-primary text-base">{health.status}</span>
              </div>
              <div className="bg-secondary/70 p-3.5 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground block font-medium">Environment</span>
                <span className="font-semibold capitalize text-foreground text-base">{health.environment}</span>
              </div>
              <div className="bg-secondary/70 p-3.5 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground block font-medium">System Uptime</span>
                <span className="font-semibold text-foreground text-base">{health.uptime}s</span>
              </div>
              <div className="bg-secondary/70 p-3.5 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground block font-medium">Server Time</span>
                <span className="font-mono text-xs text-secondary-foreground font-semibold mt-1 block">
                  {new Date(health.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-secondary border border-border text-foreground text-sm flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-primary">Backend Service Unavailable</p>
                <p className="text-xs text-muted-foreground">
                  The API service on port 4000 is unreachable. Run `npm run dev:backend` to launch the API service. Details: {error}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Preview Using Purple Theme */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Training Center Analytics (Purple Theme System)
              </CardTitle>
              <CardDescription>Academic intake vs graduation metrics rendered using purple palette tokens</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-[#6D28D9]" />
                <span className="text-muted-foreground">Enrollments (#6D28D9)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-[#A78BFA]" />
                <span className="text-muted-foreground">Completions (#A78BFA)</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#6B647A" fontSize={12} tickLine={false} axisLine={{ stroke: '#E9E3F5' }} />
                <YAxis stroke="#6B647A" fontSize={12} tickLine={false} axisLine={{ stroke: '#E9E3F5' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E9E3F5',
                    borderRadius: '8px',
                    color: '#27213B',
                    boxShadow: '0 4px 12px rgba(109, 40, 217, 0.08)',
                  }}
                />
                <Bar dataKey="enrollments" fill="#6D28D9" radius={[4, 4, 0, 0]} name="New Enrollments" />
                <Bar dataKey="completions" fill="#A78BFA" radius={[4, 4, 0, 0]} name="Graduations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-2">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Modern Frontend</CardTitle>
            <CardDescription>React 19 &amp; Tailwind CSS 4</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>&bull; Pure purple &amp; white design system</p>
            <p>&bull; shadcn/ui accessible components</p>
            <p>&bull; Axios with automatic Bearer interceptor</p>
            <p>&bull; Recharts &amp; jsPDF integration ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-2">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Backend Service</CardTitle>
            <CardDescription>Express &amp; TypeScript</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>&bull; Strict TypeScript &amp; Zod validation</p>
            <p>&bull; Standardized JSON response envelope</p>
            <p>&bull; Centralized error &amp; 404 handlers</p>
            <p>&bull; JWT auth &amp; bcrypt password hashing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-2">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Database Tier</CardTitle>
            <CardDescription>MySQL 8.x with mysql2/promise</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>&bull; 10 pure SQL numbered migrations</p>
            <p>&bull; Zero ORMs &bull; Clean repositories</p>
            <p>&bull; Transaction management helpers</p>
            <p>&bull; Connection pooling &amp; health probe</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
