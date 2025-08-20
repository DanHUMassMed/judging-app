import * as React from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function SignIn() {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

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

        <Box component="form" noValidate sx={{ mt: 1, width: "100%" }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
          />

          {/* Right-aligned Forgot password */}
          <Box textAlign="right" mt={4}>
            <Link href="reset-password" variant="body2">
              Forgot password?
            </Link>
          </Box>

          {/* Password with show/hide toggle */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, py: 1.2, borderRadius: 2 }}
          >
            Sign In
          </Button>



          {/* Centered Sign Up link */}
          <Box textAlign="center" mt={2}>
          <Typography variant="body2" align="center">
            Don’t have an account?{" "}
            <Link href="/sign-up" underline="hover">
              Sign Up
            </Link>
          </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}