import Avatar from '@mui/material/Avatar';

import NetBuddyLogo from '../public/icons/netbuddylogo-128.png';
import {CssBaseline, Grid, Typography} from "@mui/material";
import {ThemeProvider} from "@emotion/react";
import {darkTheme} from "./theme/Themes.ts";

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Grid container spacing={0} maxWidth="800px" maxHeight="600px" minWidth="200px" minHeight="200px">
        <Grid item xs={3}>
          <Avatar alt="NetBuddy" src={NetBuddyLogo} />
        </Grid>
        <Grid item xs={9}>
          <Typography fontSize="medium">NetBuddy</Typography>
        </Grid>
      </Grid>
    </ThemeProvider>
  )
}

export default App
