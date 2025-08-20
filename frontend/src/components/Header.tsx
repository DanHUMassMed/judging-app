import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FeatureDropdown from './FeatureDropdown';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ pr: 2, flexGrow: 0 }}>
            Judging App 
          </Typography>
          <FeatureDropdown />
          <Button component={Link} to="/pricing" color="inherit">Pricing</Button>

          <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
            <Button component={Link} to="/sign-in" sx={{ color: "white" }}>
              Sign In
            </Button>
            <Button color="secondary" variant="contained">
              Your First Event
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>


    </Box>
  );
}