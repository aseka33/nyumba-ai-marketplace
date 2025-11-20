import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import { 
  Package, 
  Plus, 
  ShoppingCart, 
  TrendingUp,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function VendorDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "furniture" as any,
    priceKES: "",
    stockQuantity: "",
    imageUrls: "",
  });

  const utils = trpc.useUtils();

  const { data: products, isLoading: productsLoading } = trpc.product.getMyProducts.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.isVendor }
  );

  const { data: orders, isLoading: ordersLoading } = trpc.order.getVendorOrders.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.isVendor }
  );

  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      toast.success("Product added successfully!");
      setIsAddProductOpen(false);
      setNewProduct({
        name: "",
        description: "",
        category: "furniture",
        priceKES: "",
        stockQuantity: "",
        imageUrls: "",
      });
      utils.product.getMyProducts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add product");
    }
  });

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully!");
      utils.product.getMyProducts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete product");
    }
  });

  const updateStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated!");
      utils.order.getVendorOrders.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update order status");
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p>Please sign in to access vendor dashboard</p>
            <a href={getLoginUrl()}>
              <Button>Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user?.isVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p>You need to register as a vendor first</p>
            <Button onClick={() => setLocation("/become-vendor")}>
              Become a Vendor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddProduct = () => {
    const priceInCents = Math.round(parseFloat(newProduct.priceKES) * 100);
    const stock = parseInt(newProduct.stockQuantity);
    const imageUrls = newProduct.imageUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    createMutation.mutate({
      ...newProduct,
      priceKES: priceInCents,
      stockQuantity: stock,
      imageUrls,
    });
  };

  const totalRevenue = orders?.reduce((sum, order) => {
    if (order.paymentStatus === 'paid') {
      return sum + (order.subtotalKES - order.platformFeeKES);
    }
    return sum;
  }, 0) || 0;

  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
              <p className="text-muted-foreground">{user.businessName}</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {(totalRevenue / 100).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Products</h2>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Fill in the product details to list it on the marketplace
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="e.g., Modern Oak Coffee Table"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="Describe your product..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newProduct.category}
                          onValueChange={(value) => setNewProduct({ ...newProduct, category: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
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

                      <div className="space-y-2">
                        <Label htmlFor="price">Price (KES)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.priceKES}
                          onChange={(e) => setNewProduct({ ...newProduct, priceKES: e.target.value })}
                          placeholder="5000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newProduct.stockQuantity}
                        onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="images">Image URLs (one per line)</Label>
                      <Textarea
                        id="images"
                        value={newProduct.imageUrls}
                        onChange={(e) => setNewProduct({ ...newProduct, imageUrls: e.target.value })}
                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleAddProduct}
                      disabled={createMutation.isPending}
                      className="w-full"
                    >
                      {createMutation.isPending ? "Adding..." : "Add Product"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {productsLoading ? (
              <p>Loading products...</p>
            ) : products && products.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const images = product.imageUrls ? JSON.parse(product.imageUrls) : [];
                  return (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        {images[0] && (
                          <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                            <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <h3 className="font-semibold mb-2">{product.name}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{product.category}</Badge>
                          {!product.isActive && <Badge variant="destructive">Inactive</Badge>}
                        </div>
                        <p className="text-lg font-bold text-primary mb-3">
                          KES {(product.priceKES / 100).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Stock: {product.stockQuantity}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMutation.mutate({ productId: product.id })}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No products yet</p>
                  <Button onClick={() => setIsAddProductOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold">Orders</h2>
            {ordersLoading ? (
              <p>Loading orders...</p>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Order #{order.orderNumber}</CardTitle>
                          <CardDescription>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge>{order.status}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.paymentStatus}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>KES {(order.subtotalKES / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee (10%):</span>
                          <span>KES {(order.platformFeeKES / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Your Payout:</span>
                          <span className="text-accent">
                            KES {((order.subtotalKES - order.platformFeeKES) / 100).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: value as any,
                            })
                          }
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
