import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bell, Globe, Filter, TrendingUp, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: subscriptionData, isLoading: subLoading } = trpc.subscription.getCurrent.useQuery();
  const { data: monitoringConfigs, isLoading: configLoading } = trpc.monitoring.getConfigs.useQuery();
  const { data: filters, isLoading: filtersLoading } = trpc.filters.getFilters.useQuery();
  const { data: recentRestocks, isLoading: restocksLoading } = trpc.restock.getRecent.useQuery({ limit: 10 });

  if (authLoading || subLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const hasActiveSubscription = subscriptionData?.subscription && 
    ['trial', 'active'].includes(subscriptionData.subscription.status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.name || 'User'}! Monitor your Hermès restock alerts.
          </p>
        </div>

        {/* Subscription Status Alert */}
        {!hasActiveSubscription && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have an active subscription. 
              <Button 
                variant="link" 
                className="px-2" 
                onClick={() => setLocation("/subscription")}
              >
                Start your free trial
              </Button>
              to begin monitoring.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptionData?.subscription ? 
                  subscriptionData.subscription.status.charAt(0).toUpperCase() + 
                  subscriptionData.subscription.status.slice(1) 
                  : 'Inactive'}
              </div>
              <p className="text-xs text-muted-foreground">
                {subscriptionData?.plan?.name || 'No active plan'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored Regions</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monitoringConfigs?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active monitoring configurations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filters?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Product filter preferences
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Restocks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentRestocks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                In the last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Set up your monitoring preferences</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={() => setLocation("/monitoring")}>
              <Globe className="mr-2 h-4 w-4" />
              Configure Regions
            </Button>
            <Button variant="outline" onClick={() => setLocation("/filters")}>
              <Filter className="mr-2 h-4 w-4" />
              Set Product Filters
            </Button>
            <Button variant="outline" onClick={() => setLocation("/history")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              View Restock History
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Restock Activity</CardTitle>
            <CardDescription>Latest product availability updates</CardDescription>
          </CardHeader>
          <CardContent>
            {restocksLoading ? (
              <p className="text-sm text-muted-foreground">Loading recent restocks...</p>
            ) : recentRestocks && recentRestocks.length > 0 ? (
              <div className="space-y-4">
                {recentRestocks.slice(0, 5).map((restock) => (
                  <div key={restock.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium">Product #{restock.productId}</p>
                      <p className="text-sm text-muted-foreground">
                        Detected {new Date(restock.detectedAt).toLocaleString()}
                      </p>
                    </div>
                    {restock.price && (
                      <p className="font-semibold">${restock.price}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent restocks found. Check back later!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
