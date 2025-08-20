import { useState } from "react";
import {
  Button,
  Menu,
  Grid,
  Box,
  Typography,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentIcon from "@mui/icons-material/Payment";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function FeatureDropdown() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const handleMenuMouseEnter = () => {
  };

  const handleMenuMouseLeave = () => {
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const features = [
    { icon: <EventIcon fontSize="small" color="primary" />, title: "Event Website", desc: "Publish a modern and mobile friendly event website." },
    { icon: <PaymentIcon fontSize="small" color="primary" />, title: "Registration & Payments", desc: "Collect registrations & online payments for your event." },
    { icon: <AssignmentIcon fontSize="small" color="primary" />, title: "Abstract Management", desc: "Collect and manage all your abstract submissions." },
    { icon: <RateReviewIcon fontSize="small" color="primary" />, title: "Peer Reviews", desc: "Easily distribute and manage your peer reviews." },
    { icon: <CalendarMonthIcon fontSize="small" color="primary" />, title: "Conference Program", desc: "Effortlessly build & publish your event program." },
    { icon: <SlideshowIcon fontSize="small" color="primary" />, title: "Virtual Poster Sessions", desc: "Host engaging virtual poster sessions." },
  ];
  
  return (
    <Box 
      onMouseLeave={handleMouseLeave}
      sx={{ display: 'inline-block', position: 'relative' }}
    >
      <Button
        color="inherit"
        onMouseEnter={handleMouseEnter}
        endIcon={<ExpandMoreIcon/>}
      >
        Features
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        MenuListProps={{
          onMouseEnter: handleMenuMouseEnter,
          onMouseLeave: handleMenuMouseLeave,
          sx: { pointerEvents: 'auto' }
        }}
        PaperProps={{
          onMouseEnter: handleMenuMouseEnter,
          onMouseLeave: handleMenuMouseLeave,
          sx: { pointerEvents: 'auto' }
        }}
        sx={{
          pointerEvents: 'none',
          '& .MuiPaper-root': {
            pointerEvents: 'auto'
          }
        }}
      >
        <Box sx={{ width: "400px", p: 2 }}>
          <Grid container spacing={2} columns={{ xs: 1, sm: 2 }}>
            {features.map((f, i) => (
              <Grid key={i}>
                <Box 
                  display="flex" 
                  gap={1.5} 
                  sx={{
                    p: 1, 
                    borderRadius: 1, 
                    "&:hover": {
                      bgcolor: "action.hover",
                      cursor: "pointer",
                    }
                  }}
                  onClick={handleClose}
                >
                  {f.icon}
                  <Box>
                    <Typography fontSize="0.85rem" fontWeight={600}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" fontSize="0.75rem" color="text.secondary">
                      {f.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Menu>
    </Box>
  );
}