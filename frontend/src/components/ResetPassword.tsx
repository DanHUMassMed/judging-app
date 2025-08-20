import * as React from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  IconButton,
  Stack,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Reset link requested for:", email);
    // TODO: integrate with backend reset password API
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
          Forgot your password?
        </Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          To reset your password, please enter the email address used while signing up.
        </Typography>

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