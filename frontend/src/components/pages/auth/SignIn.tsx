import * as React from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useSignInProcessor } from "../../../hooks/useSignInProcessor";

export default function SignIn() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    handleClickShowPassword,
    handleMouseDownPassword,
    handleSignInSubmit,
    validationErrors,
    error,
  } = useSignInProcessor();

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={6}
        sx={{
          mt: 8,
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 3,
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Welcome back
        </Typography>

        <Box component="form" noValidate sx={{ mt: 1, width: "100%" }} onSubmit={handleSignInSubmit}>
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
            error={!!validationErrors.email}
            helperText={validationErrors.email}
          />

          <Box textAlign="right" mt={2}>
            <Typography variant="body2">
              <a href="/reset-password">Forgot password?</a>
            </Typography>
          </Box>

          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {error && (
            <Typography color="error" variant="body2" mt={1}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, py: 1.2, borderRadius: 2 }}
          >
            Sign In
          </Button>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2">
              Don’t have an account? <a href="/sign-up">Sign Up</a>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}