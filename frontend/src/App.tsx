import * as React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { AuthProvider, useAuth } from "./components/pages/auth/AuthContext";
import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";
import SignIn from "./components/pages/auth/SignIn";
import SignUp from "./components/pages/auth/SignUp";
import ResetPassword from "./components/pages/auth/ResetPassword";
import VerifyAccount from "./components/pages/auth/VerifyAccount";
import Pricing from "./components/pages/public/Pricing";
import PosterTable from "./components/pages/app/PosterTable";
import { Outlet } from "react-router-dom";
import VerificationSent from "./components/pages/auth/VerificationSent";


function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log("🔐 ProtectedRoute check:", { isAuthenticated, isLoading });

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
      >
        <CircularProgress />
        <Box ml={2}>Checking authentication...</Box>
      </Box>
    );
  }

  // Only redirect after we're done loading
  return isAuthenticated ? <Outlet /> : <Navigate to="/sign-in" replace />;
}

function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" sx={{ width: "100%" }}>
      <Header />
      <Box component="main" flex={1} p={2}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/"                  element={<Layout><div>Welcome to Judging App!</div></Layout>} />
        <Route path="/sign-in"           element={<Layout><SignIn /></Layout>} />
        <Route path="/sign-up"           element={<Layout><SignUp /></Layout>} />
        <Route path="/reset-password"    element={<Layout><ResetPassword /></Layout>} />
        <Route path="/verification-sent" element={<Layout><VerificationSent /></Layout>} />
        <Route path="/verify/:token"     element={<VerifyAccount />} />
        <Route path="/magic-link/:token" element={<VerifyAccount />} />
        <Route path="/pricing"           element={<Layout><Pricing /></Layout>} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/posters"
            element={<Layout><PosterTable /></Layout>}
          />
        </Route>
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}