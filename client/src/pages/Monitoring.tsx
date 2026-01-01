import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Globe, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Monitoring() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: subscriptionData } = trpc.subscription.getCurrent.useQuery();
  const { data: regions, isLoading: regionsLoading } = trpc.monitoring.getRegions.useQuery();
  const { data: monitoringConfigs, isLoading: configsLoading } = trpc.monitoring.getConfigs.useQuery();
  
  const addRegionMutation = trpc.monitoring.addRegion.useMutation({
    onSuccess: () => {
      toast.success("Region added to monitoring");
      utils.monitoring.getConfigs.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeRegionMutation = trpc.monitoring.removeRegion.useMutation({
    onSuccess: () => {
      toast.success("Region removed from monitoring");
      utils.monitoring.getConfigs.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddRegion = (regionId: number) => {
    addRegionMutation.mutate({ regionId });
  };

  const handleRemoveRegion = (configId: number) => {
    removeRegionMutation.mutate({ configId });
  };

  const isRegionMonitored = (regionId: number) => {
    return monitoringConfigs?.some(config => config.regionId === regionId);
  };

  const getConfigId = (regionId: number) => {
    return monitoringConfigs?.find(config => config.regionId === regionId)?.id;
  };

  const hasActiveSubscription = subscriptionData?.subscription && 
    ['trial', 'active'].includes(subscriptionData.subscription.status);

  const maxRegions = subscriptionData?.plan?.maxRegions || 0;
  const currentRegions = monitoringConfigs?.filter(c => c.isActive).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Region Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Select which Hermès regional websites to monitor for restocks.
          </p>
        </div>

        {!hasActiveSubscription && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need an active subscription to configure monitoring. Please start your free trial first.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Limits */}
        {hasActiveSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Capacity</CardTitle>
              <CardDescription>
                Your current plan allows monitoring up to {maxRegions} regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(currentRegions / maxRegions) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {currentRegions} / {maxRegions}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {regionsLoading ? (
            <p className="text-muted-foreground col-span-full">Loading regions...</p>
          ) : regions && regions.length > 0 ? (
            regions.map((region) => {
              const monitored = isRegionMonitored(region.id);
              const configId = getConfigId(region.id);
              
              return (
                <Card key={region.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{region.name}</CardTitle>
                      </div>
                      {monitored && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {region.code} • {region.currency}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {region.url}
                      </p>
                      {monitored ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => configId && handleRemoveRegion(configId)}
                          disabled={removeRegionMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleAddRegion(region.id)}
                          disabled={!hasActiveSubscription || addRegionMutation.isPending || currentRegions >= maxRegions}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Monitoring
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground col-span-full">No regions available.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
