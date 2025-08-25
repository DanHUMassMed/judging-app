import * as React from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Stack,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState("");

  // Extract error from router state, if any
  const errorMessage = (location.state as any)?.error || "";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Reset link requested for:", email);
    // TODO: integrate with backend reset password API
    navigate("/verification-sent", { state: { from: "reset", email } });
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
        {errorMessage ? (
          <Typography component="h1" variant="h5" gutterBottom>
            Reset Password
          </Typography>
        ):(
          <>
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
          Forgot your password?
        </Typography>
          </>
        )}

        <Typography variant="body2" color="textSecondary" mb={3}>
          To reset your password, please enter the email address used while signing up.
        </Typography>

        {/* Error display */}
        {errorMessage && (
          <Typography color="error" variant="body2" mb={2}>
            ❌ {errorMessage}
          </Typography>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, py: 1.2, borderRadius: 2 }}
          >
            Send Reset Link
          </Button>

          {/* Footer link */}
          <Box textAlign="center">
            <Link href="#" variant="body2">
              Trouble signing in?
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}