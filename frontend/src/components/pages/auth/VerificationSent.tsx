import * as React from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Link,
  Paper,
  Stack,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerificationSent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get email and "from" info from navigation state
  const state = location.state as { from?: string; email?: string } | null;

  React.useEffect(() => {
    if (!state?.from) {
      // If someone typed the URL directly, redirect them
      navigate("/sign-in", { replace: true });
    }
  }, [state, navigate]);

  if (!state?.from) {
    // Render nothing while redirecting
    return null;
  }

  const userEmail = state.email || "your email address";

  const handleResend = () => {
    console.log("Resend verification email to:", userEmail);
    // TODO: integrate with backend resend verification API
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          p: 4,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Back button */}
        <Box mb={2} display="flex" alignItems="center">
          <Link href="/sign-in" underline="none" sx={{ ml: 1, fontWeight: 500 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ArrowBack sx={{ fontSize: 18 }} />
              <Typography variant="body2" gutterBottom>
                Go Back
              </Typography>
            </Stack>
          </Link>
        </Box>

        {/* Title and description */}
        <Typography component="h1" variant="h5" gutterBottom>
          Check Your Email
        </Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          We’ve sent a verification link to:
        </Typography>
        <Typography
          variant="body1"
          fontWeight={500}
          textAlign="center"
          mb={3}
        >
          {userEmail}
        </Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          Please click the link in your email to continue.
        </Typography>

        {/* Resend + Change Email */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 1, mb: 2, py: 1.2, borderRadius: 2 }}
          onClick={handleResend}
        >
          Resend Verification Email
        </Button>

        <Box textAlign="center">
          <Link href="/reset-password" variant="body2">
            Change Email Address
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}