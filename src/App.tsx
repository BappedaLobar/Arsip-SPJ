import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Import Login page
import SignUp from "./pages/SignUp"; // Import SignUp page
import { SessionContextProvider, useSession } from "./components/SessionContextProvider";
import React from "react";

const queryClient = new QueryClient();

// ProtectedRoute component to guard routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useSession();

  console.log("ProtectedRoute - isLoading:", isLoading, "session:", session);

  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a more sophisticated loading spinner
  }

  if (!session) {
    console.log("ProtectedRoute - No session, navigating to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute - Session found, rendering children.");
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} /> {/* New SignUp route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SessionContextProvider>
        <AppRoutes />
      </SessionContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;