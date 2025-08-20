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

export default function SignUp() {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

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

        <Box component="form" sx={{ mt: 1, width: "100%" }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField label="First Name" required sx={{ flex: 1 }}/>
              <TextField label="Last Name" required sx={{ flex: 1 }}/>
            </Stack>
            <TextField label="Organization" required fullWidth />
            <TextField label="Email" required fullWidth />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              fullWidth
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