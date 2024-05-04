import Avatar from '@mui/material/Avatar';

import NetBuddyLogo from '../public/icons/netbuddylogo-128.png';
import {Button, CssBaseline, Grid, Typography} from "@mui/material";
import {ThemeProvider} from "@emotion/react";
import {darkTheme} from "./theme/Themes.ts";

function App() {

  async function handleClick(event: MouseEvent) {
    event.preventDefault();
    console.log('clicked');
    const tab = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    console.log(tab[0].url);
    await chrome.scripting.executeScript({
      target: {tabId: tab[0].id!, allFrames: true},
      files: ['xpath.js']
    });
  }

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
        <Grid item xs={12}>
          <Button variant="contained" onClick={e => handleClick(e.nativeEvent)}>
            <Typography fontSize="small">
              Select Element
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </ThemeProvider>
  )
}

export default App
