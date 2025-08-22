import * as React from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Stack,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";
import { useSignUpProcessor } from "../hooks/useSignUpProcessor";

export default function SignUp() {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    organization,
    setOrganization,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    handleClickShowPassword,
    handleSubmit,
    validationErrors,
    error,
  } = useSignUpProcessor();

  return (
    <Container component="main" sx={{ width: 600, maxWidth: "100%" }}>
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 3,
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        {/* Go back link */}
        <Link href="/sign-in" underline="none" sx={{ alignSelf: "flex-start", mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <ArrowBack sx={{ fontSize: 18 }} />
            <Typography variant="body2">Go Back</Typography>
          </Stack>
        </Link>

        <Typography component="h1" variant="h5" gutterBottom>
          Create Account
        </Typography>

        <Box component="form" noValidate sx={{ mt: 1, width: "100%" }} onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                id="firstName"
                label="First Name"
                required
                sx={{ flex: 1 }}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={!!validationErrors.firstName}
                helperText={validationErrors.firstName}
              />
              <TextField
                label="Last Name"
                required
                sx={{ flex: 1 }}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={!!validationErrors.lastName}
                helperText={validationErrors.lastName}
              />
            </Stack>

            <TextField
              label="Organization"
              required
              fullWidth
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              error={!!validationErrors.organization}
              helperText={validationErrors.organization}
            />

            <TextField
              label="Email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {error && (
            <Typography color="error" variant="body2" mt={1}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>

          <Typography variant="body2" align="center">
            Already have an account?{" "}
            <Link href="/sign-in" underline="hover">
              Sign In
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}