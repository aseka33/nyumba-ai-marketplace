import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Store, CheckCircle2, TrendingUp, Shield, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function BecomeVendor() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessCategory: "",
    businessPhone: "",
    businessAddress: "",
    businessCity: "",
  });

  const becomeMutation = trpc.user.becomeVendor.useMutation({
    onSuccess: () => {
      toast.success("Vendor registration successful!");
      setTimeout(() => {
        setLocation("/vendor/dashboard");
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register as vendor");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.businessCategory || !formData.businessPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    becomeMutation.mutate(formData as any);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/5 to-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Store className="w-16 h-16 mx-auto text-accent" />
            <h2 className="text-2xl font-bold">Sign In Required</h2>
            <p className="text-muted-foreground">
              Please sign in to register as a vendor
            </p>
            <a href={getLoginUrl()}>
              <Button className="bg-accent text-accent-foreground">
                Sign In
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.isVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/5 to-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-accent" />
            <h2 className="text-2xl font-bold">You're Already a Vendor!</h2>
            <p className="text-muted-foreground">
              Access your vendor dashboard to manage products and orders
            </p>
            <Button onClick={() => setLocation("/vendor/dashboard")} className="bg-accent text-accent-foreground">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-background">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Store className="w-4 h-4" />
              Vendor Registration
            </div>
            <h1 className="text-4xl font-bold mb-4">Join NyumbaAI Marketplace</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Reach customers actively looking for interior products. No listing fees, only pay for premium positioning.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Grow Your Business</CardTitle>
                <CardDescription>
                  Connect with customers who are ready to buy through AI-powered recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-accent/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Secure Transactions</CardTitle>
                <CardDescription>
                  All payments processed securely through our platform with buyer protection
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-accent/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Easy Setup</CardTitle>
                <CardDescription>
                  Get started in minutes with our simple vendor dashboard and product management
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Tell us about your interior design business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="e.g., Nairobi Furniture Co."
                      value={formData.businessName}
                      onChange={(e) => handleChange("businessName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessCategory">
                      Primary Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.businessCategory}
                      onValueChange={(value) => handleChange("businessCategory", value)}
                    >
                      <SelectTrigger id="businessCategory">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="art">Art</SelectItem>
                        <SelectItem value="plants">Plants</SelectItem>
                        <SelectItem value="lighting">Lighting</SelectItem>
                        <SelectItem value="textiles">Textiles</SelectItem>
                        <SelectItem value="decor">Decor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="Tell customers about your business, products, and what makes you unique..."
                    value={formData.businessDescription}
                    onChange={(e) => handleChange("businessDescription", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">
                      Business Phone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      placeholder="+254 700 000 000"
                      value={formData.businessPhone}
                      onChange={(e) => handleChange("businessPhone", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessCity">City</Label>
                    <Input
                      id="businessCity"
                      placeholder="e.g., Nairobi"
                      value={formData.businessCity}
                      onChange={(e) => handleChange("businessCity", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    placeholder="Street address, building, area"
                    value={formData.businessAddress}
                    onChange={(e) => handleChange("businessAddress", e.target.value)}
                  />
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Note:</strong> Your contact information will only be shared with customers after they make a purchase through the platform. This protects your business and ensures fair commission tracking.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={becomeMutation.isPending}
                    className="bg-accent text-accent-foreground"
                    size="lg"
                  >
                    {becomeMutation.isPending ? "Registering..." : "Complete Registration"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
