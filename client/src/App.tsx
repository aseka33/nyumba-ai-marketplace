import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AnalyzeRoom from "./pages/AnalyzeRoom";
import AnalysisResult from "./pages/AnalysisResult";
import Marketplace from "./pages/Marketplace";
import BecomeVendor from "./pages/BecomeVendor";
import VendorDashboard from "./pages/VendorDashboard";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import DemoPreferences from "./pages/DemoPreferences";
import DemoUpload from "./pages/DemoUpload";
import DemoResults from "./pages/DemoResults";
import ScheduleVisit from "./pages/ScheduleVisit";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analyze" component={AnalyzeRoom} />
      <Route path="/analysis/:id" component={AnalysisResult} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/become-vendor" component={BecomeVendor} />
      <Route path="/vendor/dashboard" component={VendorDashboard} />
      <Route path="/demo" component={DemoPreferences} />
      <Route path="/demo/upload" component={DemoUpload} />
      <Route path="/demo/results" component={DemoResults} />
      <Route path="/demo/schedule-visit/:productId" component={ScheduleVisit} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
