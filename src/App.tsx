
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CollectionProvider } from "./contexts/CollectionContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import VoiceAssistant from "./components/voice/VoiceAssistant";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CollectionGallery from "./pages/collection/CollectionGallery";
import ItemDetail from "./pages/collection/ItemDetail";
import AddEditItem from "./pages/collection/AddEditItem";
import ScanItem from "./pages/collection/ScanItem";
import Judges from "./pages/Judges";
import VideoDemo from "./pages/VideoDemo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CollectionProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/judges" element={
              <ProtectedRoute>
                <Judges />
              </ProtectedRoute>
            } />
            <Route path="/video-demo" element={
              <ProtectedRoute>
                <VideoDemo />
              </ProtectedRoute>
            } />
            
            {/* Collection routes */}
            <Route path="/collection" element={
              <ProtectedRoute>
                <CollectionGallery />
              </ProtectedRoute>
            } />
            <Route path="/collection/:id" element={
              <ProtectedRoute>
                <ItemDetail />
              </ProtectedRoute>
            } />
            <Route path="/collection/:id/edit" element={
              <ProtectedRoute>
                <AddEditItem />
              </ProtectedRoute>
            } />
            <Route path="/add-item" element={
              <ProtectedRoute>
                <AddEditItem />
              </ProtectedRoute>
            } />
            <Route path="/scan" element={
              <ProtectedRoute>
                <ScanItem />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Voice Assistant */}
          <VoiceAssistant />
          
        </CollectionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
