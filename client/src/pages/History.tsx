import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Calendar, Package } from "lucide-react";
import { useState } from "react";

export default function History() {
  const [limit, setLimit] = useState(50);
  
  const { data: restockHistory, isLoading } = trpc.restock.getRecent.useQuery({ limit });

  const loadMore = () => {
    setLimit(prev => prev + 50);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Restock History</h1>
          <p className="text-muted-foreground mt-2">
            View historical restock data and identify patterns to predict future availability.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Restocks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restockHistory?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Detected in monitoring period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Restocks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {restockHistory?.filter(r => {
                  const today = new Date();
                  const restockDate = new Date(r.detectedAt);
                  return restockDate.toDateString() === today.toDateString();
                }).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                New products available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {restockHistory?.reduce((sum, r) => sum + (r.notificationCount || 0), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Alerts delivered to users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Restock Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Restock Timeline</CardTitle>
            <CardDescription>
              Chronological list of detected product restocks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading restock history...</p>
            ) : restockHistory && restockHistory.length > 0 ? (
              <div className="space-y-4">
                {restockHistory.map((restock) => (
                  <div 
                    key={restock.id} 
                    className="flex items-start justify-between border-b border-border pb-4 last:border-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <p className="font-medium">Product ID: {restock.productId}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Detected: {new Date(restock.detectedAt).toLocaleString()}
                      </p>
                      {restock.wasNotified && (
                        <p className="text-xs text-green-500">
                          ✓ {restock.notificationCount} notification(s) sent
                        </p>
                      )}
                    </div>
                    {restock.price && (
                      <div className="text-right">
                        <p className="font-semibold text-lg">${restock.price}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {restockHistory.length >= limit && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={loadMore}
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No restock history available yet. Check back after monitoring begins!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend Analysis Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Restock Trends</CardTitle>
            <CardDescription>
              Analyze patterns to predict future availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4" />
              <p>Trend analysis coming soon!</p>
              <p className="text-sm mt-2">
                We're collecting data to provide insights on restock patterns, 
                popular times, and regional availability trends.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
