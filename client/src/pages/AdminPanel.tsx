import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Users, Activity, TrendingUp, AlertCircle, CheckCircle, XCircle, Play, Square, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery({ limit: 50 });
  const { data: monitoringLogs, isLoading: logsLoading, refetch: refetchMonitoringLogs } = trpc.admin.getMonitoringLogs.useQuery({ limit: 50 });
  const { data: scanLogs, isLoading: scanLogsLoading, refetch: refetchScanLogs } = (trpc.admin as any).getScanLogs.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  const { data: monitoringStatus, isLoading: statusLoading, refetch: refetchStatus } = (trpc.admin as any).getMonitoringStatus.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const startMonitoring = (trpc.admin as any).startMonitoring.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const stopMonitoring = (trpc.admin as any).stopMonitoring.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const sendTestNotification = (trpc.admin as any).sendTestNotification.useMutation();

  const manualScan = (trpc.admin as any).manualScan.useMutation({
    onSuccess: () => {
      refetchScanLogs();
      refetchStatus();
    },
  });

  const clearScanLogs = (trpc.admin as any).clearScanLogs.useMutation({
    onSuccess: () => {
      refetchMonitoringLogs();
      refetchScanLogs();
    },
  });

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    setLocation("/dashboard");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System overview and management controls
          </p>
        </div>

        {/* Monitoring Service Control */}
        <Card>
          <CardHeader>
            <CardTitle>Monitoring Service Control</CardTitle>
            <CardDescription>
              Control the Hermès website monitoring service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Service Status</p>
                <div className="flex items-center gap-2">
                  {statusLoading ? (
                    <Badge variant="outline">Loading...</Badge>
                  ) : monitoringStatus?.isRunning ? (
                    <>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Running
                      </Badge>
                      {monitoringStatus.uptime && (
                        <span className="text-xs text-muted-foreground">
                          Uptime: {Math.floor(monitoringStatus.uptime / 1000 / 60)} min
                        </span>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      <XCircle className="h-3 w-3 mr-1" />
                      Stopped
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={monitoringStatus?.isRunning || startMonitoring.isPending}
                  onClick={() => startMonitoring.mutate()}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!monitoringStatus?.isRunning || stopMonitoring.isPending}
                  onClick={() => stopMonitoring.mutate()}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => refetchStatus()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={manualScan.isPending}
                  onClick={() => manualScan.mutate()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Manual Scan
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Regions Monitored</p>
                <p className="text-2xl font-bold">{monitoringStatus?.totalRegionsMonitored || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Restocks Detected</p>
                <p className="text-2xl font-bold">{monitoringStatus?.totalRestocksDetected || 0}</p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The monitoring service runs every 30 seconds. You will receive Manus notifications when restocks are detected.
                <br />
                <span className="text-xs">Click "Manual Scan" to trigger an immediate scan of all monitored regions.</span>
              </AlertDescription>
            </Alert>

            {manualScan.isSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ {manualScan.data.message}
                </AlertDescription>
              </Alert>
            )}
            {manualScan.isError && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ Failed to start manual scan
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={sendTestNotification.isPending}
                onClick={() => sendTestNotification.mutate()}
              >
                {sendTestNotification.isPending ? 'Sending...' : '🧪 Send Test Notification'}
              </Button>
              {sendTestNotification.isSuccess && (
                <p className="text-xs text-green-600 mt-2">
                  ✅ {sendTestNotification.data.message}
                </p>
              )}
              {sendTestNotification.isError && (
                <p className="text-xs text-red-600 mt-2">
                  ❌ Failed to send test notification
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.userCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.activeSubscriptions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Restocks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.totalRestocks || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Detected all time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              Latest user registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : users && users.length > 0 ? (
              <div className="space-y-4">
                {users.slice(0, 10).map((u) => (
                  <div 
                    key={u.id} 
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{u.name || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No users found.</p>
            )}
          </CardContent>
        </Card>

        {/* Monitoring Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monitoring System Logs</CardTitle>
                <CardDescription>
                  Recent monitoring activity and status
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  clearScanLogs.mutate(undefined, {
                    onSuccess: () => {
                      refetchMonitoringLogs();
                    },
                    onError: (error: any) => {
                      console.error('[AdminPanel] clearScanLogs mutation failed:', error);
                    }
                  });
                }}
                disabled={clearScanLogs.isPending}
              >
                Clear History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <p className="text-sm text-muted-foreground">Loading logs...</p>
            ) : monitoringLogs && monitoringLogs.length > 0 ? (
              <div className="space-y-3">
                {monitoringLogs.slice(0, 15).map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 border-b border-border pb-3 last:border-0"
                  >
                    <div className="mt-1">
                      {log.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {log.status === 'failed' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {log.status === 'blocked' && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{log.regionName || `Region ID: ${log.regionId}`}</p>
                        <Badge 
                          variant={
                            log.status === 'success' ? 'default' : 
                            log.status === 'failed' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>Products: {log.productsFound} | New Restocks: {log.newRestocks}</p>
                        <p>Duration: {log.duration}ms | {new Date(log.createdAt).toLocaleString()}</p>
                        {log.errorMessage && (
                          <p className="text-red-500 mt-1">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No monitoring logs available.</p>
            )}
          </CardContent>
        </Card>

        {/* System Health Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Monitoring service status: <span className="font-semibold text-green-500">Operational</span>
            <br />
            <span className="text-xs">Last check: {new Date().toLocaleString()}</span>
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}
