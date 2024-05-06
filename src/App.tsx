import Avatar from '@mui/material/Avatar';

import NetBuddyLogo from '../public/icons/netbuddylogo-128.png';
import {Button, CssBaseline, Grid, TextField, Typography} from "@mui/material";
import {ThemeProvider} from "@emotion/react";
import {darkTheme} from "./theme/Themes.ts";
import {useState} from "react";

function App() {
  const [xpath, setXpath] = useState<string>("");

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    return tab;
  }

  async function getElementXPath(event: MouseEvent) {
    event.preventDefault();
    const tab = await getActiveTab();
    await chrome.scripting.executeScript({
      target: {tabId: tab.id!, allFrames: true},
      files: ['GetElementXPath.js']
    });
  }

  async function getElementsByXPath(event: MouseEvent) {
    event.preventDefault();
    const tab = await getActiveTab();
    await chrome.scripting.executeScript({
      target: {tabId: tab.id!, allFrames: true},
      files: ['GetElementsFromXPath.js']
    });

    await chrome.runtime.sendMessage({
      command: CSCommandType.GetElementsByXPath,
      xpath_selector: xpath,
      is_result: false
    } as CSCommand);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message as Element[]) {
        console.log("Success");
        console.log(message);
      }
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
          <Button variant="contained" onClick={e => getElementXPath(e.nativeEvent)}>
            <Typography fontSize="small">
              Select Element
            </Typography>
          </Button>
        </Grid>
        <Grid item xs = {12}>
          <TextField label="XPath" onChange={e => {
            e.preventDefault();
            setXpath(e.target.value);
          }}/>
          <Button variant="contained" onClick={e => getElementsByXPath(e.nativeEvent)}/>
        </Grid>
      </Grid>
    </ThemeProvider>
  )
}

export default App
