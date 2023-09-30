// Isolated reproduction of [moonfire-nvr#286](https://github.com/scottlamb/moonfire-nvr/issues/286)
// on Firefox; tested on 118.0.1.
//
// This is based on moonfire-nvr's [LiveCamera.tsx](https://github.com/scottlamb/moonfire-nvr/blob/2a8c1bb6321e5635ad346694f2c325b89b118798/ui/src/Live/LiveCamera.tsx).
// When `App` returns a new video element with a changed `src`, the console says the following:
// `Security Error: Content at http://localhost:3000/ may not load data from blob:http://localhost:3000/18a3f072-71c5-42d3-8141-755e9d85c6b4.`
// I don't understand why.

// Updating the video ref seems to work better (see commented-out code), but I don't understand why.
// I'm not confident I can reliably avoid this error until I understand the problem...

import { Box, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';

async function myfetch(url: string) {
  const req = await fetch(url);
  if (!req.ok) {
    throw Error(`fetch of ${url} failed: ${req.status}`);
  }
  return await req.arrayBuffer();
}

class Driver {
  constructor() {
    this.src.addEventListener('sourceopen', this.onMediaSourceOpen);
    this.src.addEventListener('abort', this.onMediaSourceAbort);
    this.src.addEventListener('error', this.onMediaSourceError);
  }

  onMediaSourceOpen = async () => {
    console.log('onMediaSourceOpen');
    const init = await myfetch('init-69.mp4')!;
    this.srcBuf = this.src.addSourceBuffer("video/mp4; codecs=\"avc1.64001e\"");
    this.srcBuf.appendBuffer(init);
    this.srcBuf.addEventListener("updateend", this.onBufUpdateEnd);
    this.srcBuf.addEventListener("abort", this.onBufAbort);
    this.srcBuf.addEventListener("error", this.onBufError);
  };
  
  onMediaSourceError = () => {
    console.log('media source error');
  }

  onMediaSourceAbort = () => {
    console.log('media source abort');
  }

  onBufError = () => {
    console.log('buf error');
  }

  onBufAbort = () => {
    console.log('buf abort');
  }

  onBufUpdateEnd = async () => {
    console.log(`onUpdateEnd, addedData=${this.addedData}`);
    if (!this.addedData) {
      const part = await myfetch('2830728.m4s');
      this.srcBuf!.appendBuffer(part);
      this.addedData = true;
    } else {
      this.src.endOfStream();
    }
  };

  src = new MediaSource();
  url = URL.createObjectURL(this.src);
  addedData = false;
  srcBuf?: SourceBuffer;
}

function App() {
  // const videoRef = React.useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = React.useState("(none)");

  const [driver, setDriver] = React.useState<null | Driver>(null);
  React.useEffect(() => {
    // const video = videoRef.current!;
    if (camera === "(none)") {
      console.log('no camera selected');
      return;
    }
    console.log('creating Driver; setting video.src');
    const driver = new Driver();
    // video.src = driver.url;
    setDriver(driver);
  }, [camera]);

  console.log(`App, camera=${camera}`);
  // const videoElement = <video ref={videoRef} autoPlay muted />;
  const videoElement = <video src={driver?.url} autoPlay muted />;

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        "& .controls": {
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: 1,
        },
      }}>
      <div className="controls">
        <Select
          value={camera}
          onChange={(event: SelectChangeEvent<string>) => {
            setCamera(event.target.value);
          }}
        >
          <MenuItem value="(none)">(none)</MenuItem>
          <MenuItem value="courtyard">courtyard</MenuItem>
        </Select>
      </div>
      {videoElement}
    </Box>
  );
}

export default App;
