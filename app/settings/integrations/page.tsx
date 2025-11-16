/**
 * Integrations Settings Page
 * 
 * Manage third-party integrations (Zotero, Mendeley, etc.)
 * Week 2-3: OAuth Flows
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  authUrl: string;
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'zotero',
      name: 'Zotero',
      description: 'Sync your citations and references with Zotero',
      icon: '📚',
      connected: false,
      authUrl: '/api/auth/zotero',
    },
    {
      id: 'mendeley',
      name: 'Mendeley',
      description: 'Sync your research library with Mendeley',
      icon: '🔬',
      connected: false,
      authUrl: '/api/auth/mendeley',
    },
  ]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    // Handle OAuth callback messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      // Use a microtask to defer state updates and avoid cascading renders
      Promise.resolve().then(() => {
        setSuccessMessage(`Successfully connected to ${success}`);
        // Mark as connected
        setIntegrations(prev =>
          prev.map(int =>
            int.id === success ? { ...int, connected: true } : int
          )
        );

        // Clear message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      });
    }

    if (error) {
      // Use a microtask to defer state updates and avoid cascading renders
      Promise.resolve().then(() => {
        const errorMessages: Record<string, string> = {
          'zotero_auth_failed': 'Failed to authenticate with Zotero',
          'zotero_connection_failed': 'Failed to connect to Zotero',
          'mendeley_auth_failed': 'Failed to authenticate with Mendeley',
          'mendeley_connection_failed': 'Failed to connect to Mendeley',
        };

        setErrorMessage(errorMessages[error] || 'Authentication failed');
        setTimeout(() => setErrorMessage(null), 5000);
      });
    }
  }, [searchParams]);

  const handleConnect = (integration: Integration) => {
    setConnecting(integration.id);
    // Redirect to OAuth flow using useEffect to avoid modifying location during render
    setTimeout(() => {
      window.location.href = integration.authUrl;
    }, 0);
  };

  const handleDisconnect = (integrationId: string) => {
    // TODO: Implement disconnect API call
    setIntegrations(prev =>
      prev.map(int =>
        int.id === integrationId ? { ...int, connected: false } : int
      )
    );
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect your reference managers and other services to sync your research library
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Integration Cards */}
        <div className="grid gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{integration.icon}</div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {integration.name}
                        {integration.connected && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Connected
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-3">
                  {integration.connected ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        Disconnect
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Sync Now
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(integration)}
                      disabled={connecting === integration.id}
                      className="gap-2"
                    >
                      {connecting === integration.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        `Connect ${integration.name}`
                      )}
                    </Button>
                  )}
                </div>

                {integration.connected && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Last synced: <span className="font-medium">Just now</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Having trouble connecting your reference manager?
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Make sure you have an account with the reference manager</li>
              <li>Check that pop-ups are not blocked in your browser</li>
              <li>Try disconnecting and reconnecting if you experience issues</li>
            </ul>
            <Button variant="link" className="px-0">
              View documentation →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
