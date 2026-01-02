import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Globe, Filter, TrendingUp, Shield, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: subscription } = trpc.subscription.getCurrent.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Auto-redirect subscribed users to dashboard
  useEffect(() => {
    if (isAuthenticated && subscription) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, subscription, setLocation]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Hermes Sentinel</span>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => setLocation("/subscription")}>
                  Subscription
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => window.location.href = getLoginUrl()}>
                  Login
                </Button>
                <Button onClick={() => window.location.href = getLoginUrl()}>
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Never Miss a{" "}
            <span className="text-primary">Hermès Restock</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Monitor 33+ Hermès official websites 24/7. Get instant notifications when your dream bag becomes available. 
            Start your 7-day free trial today.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/subscription")}>
              View Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-Region Monitoring</CardTitle>
                <CardDescription>
                  Track inventory across 33+ Hermès country websites simultaneously
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Select which regions to monitor based on your location and preferences. 
                  Our system checks for updates every few seconds.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Filter className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Filtering</CardTitle>
                <CardDescription>
                  Set precise preferences for bag type, color, size, and price
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Only get notified about products that match your exact criteria. 
                  No spam, just the bags you want.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Instant Notifications</CardTitle>
                <CardDescription>
                  Receive real-time alerts via email and push notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get notified within seconds of a restock. Direct links take you 
                  straight to the checkout page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="container py-16 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold mb-12">Why Choose Hermes Sentinel?</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex gap-4">
              <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Historical Trends</h3>
                <p className="text-sm text-muted-foreground">
                  View restock history and patterns to predict when your desired items might become available.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced monitoring technology detects restocks faster than manual checking or other services.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Reliable & Secure</h3>
                <p className="text-sm text-muted-foreground">
                  99.9% uptime guarantee. Your data is encrypted and we never store payment information.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Global Coverage</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor US, UK, France, Japan, and 30+ other Hermès regional websites from one dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who never miss a Hermès restock. 
            Start your 7-day free trial with no credit card required.
          </p>
          <Button size="lg" onClick={handleGetStarted}>
            Start Free Trial Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Hermes Sentinel. Not affiliated with Hermès International.</p>
        </div>
      </footer>
    </div>
  );
}
