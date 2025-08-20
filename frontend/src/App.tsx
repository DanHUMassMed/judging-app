import * as React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import ResetPassword from "./components/ResetPassword";
import Pricing from "./components/Pricing";

function Layout() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      sx={{ width: "100%" }}
    >
      <Header />

      <Box component="main" flex={1} p={2}>
        {/* 👇 This is where child routes will render */}
        <Outlet />
      </Box>

      <Footer />
    </Box>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Wrap all pages with Layout */}
        <Route path="/" element={<Layout />}>
          {/* Index route (homepage) */}
          <Route index element={<div>Welcome to Judging App!</div>} />

          <Route path="sign-in" element={<SignIn />} />
          <Route path="sign-up" element={<SignUp />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="pricing" element={<Pricing />} />

          {/* Example of redirect */}
          <Route path="home" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}