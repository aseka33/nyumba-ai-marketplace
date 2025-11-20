import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, AlertCircle, CheckCircle2, Phone, MapPin, User } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [, setLocation] = useLocation();

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: user?.businessAddress || "",
    city: user?.businessCity || "",
    notes: "",
  });

  const [paymentStep, setPaymentStep] = useState<"form" | "payment" | "confirmation">("form");
  const [orderId, setOrderId] = useState<number | null>(null);

  // Create order mutation
  const createOrderMutation = trpc.order.create.useMutation({
    onSuccess: (data: any) => {
      setOrderId(data.orderId);
      setPaymentStep("payment");
      toast.success("Order created! Initiating M-Pesa payment...");
    },
    onError: (error: any) => {
      toast.error((error as any).message || "Failed to create order");
    },
  });

  // For now, payment is handled through order creation
  // In production, this would call the M-Pesa payment API

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate phone number (Kenya format)
    const phoneRegex = /^(\+254|0)[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      toast.error("Please enter a valid Kenyan phone number");
      return;
    }

    // Create order
    createOrderMutation.mutate({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      deliveryAddress: formData.address,
      deliveryCity: formData.city,
      deliveryPhone: formData.phone,
      deliveryNotes: formData.notes || undefined,
    });
  };

  const handleInitiatePayment = () => {
    if (!orderId) return;

    // Simulate M-Pesa payment
    toast.success("M-Pesa prompt sent to your phone!");
    setPaymentStep("confirmation");
    setTimeout(() => {
      clearCart();
      setLocation(`/order-confirmation/${orderId}`);
    }, 2000);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <Button
            onClick={() => setLocation("/marketplace")}
            className="bg-orange-600 hover:bg-orange-700 mt-4"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const totalAmount = totalPrice + 500 + Math.round(totalPrice * 0.05);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            {paymentStep === "form" && (
              <Card>
                <CardHeader className="bg-orange-50">
                  <CardTitle className="text-orange-600">Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmitForm} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number (M-Pesa) *
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+254712345678 or 0712345678"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This number will receive the M-Pesa payment prompt
                      </p>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Delivery Address *
                      </label>
                      <Input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address"
                        required
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <Input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Nairobi"
                        required
                      />
                    </div>

                    {/* Delivery Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Special instructions for delivery..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                      />
                    </div>

                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 text-sm">
                        Free for users, vendors only pay when they want premium positioning
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="submit"
                      disabled={createOrderMutation.isPending}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg font-semibold"
                    >
                      {createOrderMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating Order...
                        </>
                      ) : (
                        "Continue to Payment"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {paymentStep === "payment" && (
              <Card>
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-600">M-Pesa Payment</CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center space-y-6">
                  <div className="py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Check Your Phone
                    </h3>
                    <p className="text-gray-600 mb-4">
                      An M-Pesa prompt has been sent to <strong>{formData.phone}</strong>
                    </p>
                    <p className="text-gray-600 mb-6">
                      Enter your M-Pesa PIN to complete the payment of{" "}
                      <strong className="text-orange-600">KES {totalAmount.toLocaleString()}</strong>
                    </p>

                    <Alert className="bg-yellow-50 border-yellow-200 mb-6">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 text-sm">
                        Do not share your M-Pesa PIN with anyone
                      </AlertDescription>
                    </Alert>
                  </div>

                  <Button
                    onClick={handleInitiatePayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
                  >
                    Confirm Payment
                  </Button>

                  <Button
                    onClick={() => setPaymentStep("form")}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Delivery Info
                  </Button>
                </CardContent>
              </Card>
            )}

            {paymentStep === "confirmation" && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Initiated!</h3>
                  <p className="text-gray-600 mb-6">
                    Your order is being processed. Redirecting to confirmation page...
                  </p>
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-4 border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-600">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto border-b pb-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        KES {(item.priceKES * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-b pb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>KES {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span>KES 500</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span>KES {Math.round(totalPrice * 0.05).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-orange-600">KES {totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
