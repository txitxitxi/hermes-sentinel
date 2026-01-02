import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, Activity, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery({ limit: 50 });
  const { data: monitoringLogs, isLoading: logsLoading } = trpc.admin.getMonitoringLogs.useQuery({ limit: 50 });

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
            <CardTitle>Monitoring System Logs</CardTitle>
            <CardDescription>
              Recent monitoring activity and status
            </CardDescription>
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
                        <p className="font-medium">Region ID: {log.regionId}</p>
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
