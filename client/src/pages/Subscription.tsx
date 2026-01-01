import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Check, Crown, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Subscription() {
  const utils = trpc.useUtils();
  
  const { data: subscriptionData, isLoading: subLoading } = trpc.subscription.getCurrent.useQuery();
  const { data: plans, isLoading: plansLoading } = trpc.subscription.getPlans.useQuery();
  
  const startTrialMutation = trpc.subscription.startTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial started successfully!");
      utils.subscription.getCurrent.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStartTrial = (planId: number) => {
    startTrialMutation.mutate({ planId });
  };

  const hasActiveSubscription = subscriptionData?.subscription && 
    ['trial', 'active'].includes(subscriptionData.subscription.status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">
            Choose the plan that best fits your needs. Start with a 7-day free trial.
          </p>
        </div>

        {/* Current Subscription Status */}
        {hasActiveSubscription && subscriptionData && (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Subscription
                </CardTitle>
                <Badge variant={subscriptionData.subscription.status === 'trial' ? 'secondary' : 'default'}>
                  {subscriptionData.subscription.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold">{subscriptionData.plan?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{subscriptionData.subscription.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">
                    {new Date(subscriptionData.subscription.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-semibold">
                    {new Date(subscriptionData.subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {subscriptionData.subscription.status === 'trial' && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">
                    Your free trial ends on{' '}
                    <span className="font-semibold">
                      {new Date(subscriptionData.subscription.endDate).toLocaleDateString()}
                    </span>
                    . Upgrade to a paid plan to continue monitoring after the trial period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plansLoading ? (
            <p className="text-muted-foreground col-span-full">Loading plans...</p>
          ) : plans && plans.length > 0 ? (
            plans.map((plan) => {
              const features = plan.features ? JSON.parse(plan.features as string) : [];
              const channels = plan.notificationChannels ? JSON.parse(plan.notificationChannels as string) : [];
              const isTrial = plan.durationDays === 0 || plan.price === "0.00";
              
              return (
                <Card key={plan.id} className={isTrial ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {isTrial && <Badge variant="secondary">Free Trial</Badge>}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          {plan.currency === 'USD' ? '$' : plan.currency}
                          {plan.price}
                        </span>
                        {!isTrial && (
                          <span className="text-muted-foreground">
                            /{plan.durationDays === 30 ? 'month' : 'year'}
                          </span>
                        )}
                      </div>
                      {isTrial && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.durationDays} days free
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Up to {plan.maxRegions} regions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Up to {plan.maxProducts} products</span>
                      </div>
                      {channels.map((channel: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="capitalize">{channel} notifications</span>
                        </div>
                      ))}
                      {features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    {isTrial && !hasActiveSubscription ? (
                      <Button 
                        className="w-full" 
                        onClick={() => handleStartTrial(plan.id)}
                        disabled={startTrialMutation.isPending}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Start Free Trial
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={hasActiveSubscription ? "outline" : "default"}
                        disabled={hasActiveSubscription}
                      >
                        {hasActiveSubscription ? 'Current Plan' : 'Subscribe'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground col-span-full">No plans available.</p>
          )}
        </div>

        {/* FAQ or Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How does the free trial work?</h3>
              <p className="text-sm text-muted-foreground">
                Start monitoring immediately with a 7-day free trial. No credit card required. 
                You can upgrade to a paid plan at any time during or after the trial.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. Your monitoring will continue 
                until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards and PayPal. All payments are processed securely 
                through our payment provider.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
