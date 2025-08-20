import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CheckIcon from '@mui/icons-material/Check';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

// Custom styled components to match the look and feel
const PricingHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '2.5rem', // Adjust as needed for the "Simple, straightforward" part
  color: theme.palette.grey[700],
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  },
}));

const PricingHighlight = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '2.5rem', // Adjust as needed for the "pricing" part
  color: '#8A2BE2', // Purple color
  textAlign: 'center',
  marginBottom: theme.spacing(6),
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  },
}));

const PricingCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(4),
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  borderRadius: '12px',
  height: '100%', // Ensure cards have the same height if needed, or let content dictate
}));

const PriceTypography = styled(Typography)(({ theme }) => ({
  fontSize: '2.8rem',
  fontWeight: 700,
  color: '#8A2BE2', // Purple color
  marginBottom: theme.spacing(0.5),
}));

const PerYearTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  fontSize: '0.9rem',
  marginBottom: theme.spacing(3),
}));


const FeatureTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.grey[700],
}));

const FeatureListItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
}));

const GetStartedButton = styled(Button)(({ theme }) => ({
  marginTop: 'auto', // Pushes the button to the bottom
  padding: theme.spacing(1.5, 4),
  borderRadius: '50px',
  fontWeight: 600,
  background: 'linear-gradient(45deg, #6A1B9A 30%, #8A2BE2 90%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(45deg, #8A2BE2 30%, #AB47BC 90%)',
  },
  boxShadow: '0 4px 12px rgba(138, 43, 226, 0.4)',
}));

const ContactUsTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  color: theme.palette.grey[700],
  textAlign: 'center',
  marginTop: theme.spacing(6),
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));

const ContactHighlightTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  color: '#8A2BE2', // Purple color
  fontWeight: 700,
  cursor: 'pointer',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));


export default function Pricing() {
  const pricingPlans = [
    {
      plan: 'Basic',
      base_price: 'Free', // No price for free tier
      features: [
        'Up to 25 Submissions',
        'Anonymous Judging',
        'Downloadable Results',
      ],
    },
    {
      plan: 'Standard',
      base_price: '$25',
      unit_price: '+$2.50/submission',
      features: [
        'All Basic features',
        'Up to 100 Submissions',
        'Assigned Judging',
        'Event Dashboard',
      ],
    },
    {
      plan: 'Advanced',
      base_price: '$100',
      unit_price: '+$2.50/submission',
      features: [
        'All Standard features',
        'Up to 200 submissions',
        'Email Support',
      ],
    },
    {
      plan: 'Premium',
      base_price: '$300',
      unit_price: '+$2.00/submission',
      features: [
        'All Advanced features',
        'Up to 400 submissions',
        'Premium Support',
      ],
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
      <Container maxWidth="100%" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <PricingHeader variant="h2">
          Simple,
        </PricingHeader>
        <PricingHighlight variant="h2">
          Right-sized pricing for every event
        </PricingHighlight>

        <Grid container spacing={2} justifyContent="center">
          {pricingPlans.map((plan, index) => (
            <Grid key={index}>
              <PricingCard>
                <CardContent sx={{ width: '100%' }}>
                  <Typography variant="h5" component="div" sx={{ fontSize: '2rem', fontWeight: 700, color: '#8A2BE2', mb: 1 }}>
                    {plan.plan}
                  </Typography>
                  

                  <PriceTypography>{plan.base_price}</PriceTypography>
                  <PriceTypography variant="h5" component="div" sx={{ fontSize: '1rem', fontWeight: 400, color: '#8A2BE2', mb: 1 }}>{plan.unit_price}</PriceTypography>

                    {plan.base_price !== "Free" ? (
                        <PerYearTypography>Per Event</PerYearTypography>
                    ) : (
                        <br />
                    )}

                  <Box sx={{ width: '100%', mt: 4 }}>
                    {plan.features.map((feature, featureIndex) => (
                      <FeatureListItem key={featureIndex}>
                        <CheckIcon sx={{ color: '#8A2BE2', mr: 1 }} />
                        <FeatureTypography>{feature}</FeatureTypography>
                      </FeatureListItem>
                    ))}
                  </Box>
                </CardContent>
                <CardContent sx={{ width: '100%', mt: 'auto', pb: 4 }}>
                  <GetStartedButton variant="contained" fullWidth>
                    Get Started
                  </GetStartedButton>
                </CardContent>
              </PricingCard>
            </Grid>
          ))}
        </Grid>


      </Container>
     <Box mt={15}>
        <ContactUsTypography >
          Contact us for an {' '}
          <ContactHighlightTypography component="span">
            Enterprise custom plan
          </ContactHighlightTypography>
        </ContactUsTypography>
      </Box>
    </Box>
  );
}