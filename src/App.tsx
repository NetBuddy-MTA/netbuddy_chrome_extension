import Avatar from '@mui/material/Avatar';

import NetBuddyLogo from '../public/icons/netbuddylogo-128.png';
import {Button, CssBaseline, Grid, TextField, Typography} from "@mui/material";
import {ThemeProvider} from "@emotion/react";
import {darkTheme} from "./theme/Themes.ts";

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Grid component="form" container spacing={0} maxWidth="800px" maxHeight="600px" minWidth="200px" minHeight="200px"
      onSubmit={
        async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const key = data.get('key') as string;
          const value = data.get('value') as string;
          await chrome.storage.local.set({[key]: value});
        }
      }>
        <Grid item xs={3}>
          <Avatar alt="NetBuddy" src={NetBuddyLogo} />
        </Grid>
        <Grid item xs={9}>
          <Typography fontSize="medium">NetBuddy</Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField id="key" label="Key" name="key" fullWidth={true}/>
        </Grid>
        <Grid item xs={12}>
          <TextField id="value" label="Value" name="value" fullWidth={true}/>
        </Grid>
        <Grid item xs={12}>
          <Button type="submit">Set Key to Value</Button>
        </Grid>
      </Grid>
    </ThemeProvider>
  )
}

export default App
