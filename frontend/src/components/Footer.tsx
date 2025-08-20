import * as React from "react";
import { AppBar, Toolbar, Typography, Box, Container } from "@mui/material";

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "grey.200", py: 2, mt: "auto" }}>
      <Container>
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} My Company
        </Typography>
      </Container>
    </Box>
  );
}