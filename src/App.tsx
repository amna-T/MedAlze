import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./components/notifications/NotificationsProvider";
import AppRouter from "./routes";
// Removed useEffect and listAvailableGeminiModels import

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider> {/* AuthProvider now wraps NotificationsProvider */}
          <NotificationsProvider>
            <Toaster />
            <Sonner />
            <AppRouter />
          </NotificationsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;