import React from 'react';
import { Box, Container } from '@mui/material';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100vw',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout; 