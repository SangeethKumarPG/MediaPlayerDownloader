const express = require("express");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const port = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://mediaplayerfrontend2.onrender.com");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/downloadVideo", async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) {
    return res.status(400).send("Video ID is required");
  }
  console.log(videoId);
  const videoOutput = `${videoId}videoOnly.mp4`;
  const audioOutput = `${videoId}.mp3`;
  const finalOutput = `${videoId}.mp4`;
  const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    ytdl(videoURL, { quality: "highestvideo" })
      .pipe(fs.createWriteStream(videoOutput))
      .on("finish", () => {
        console.log("Video download complete!");
        ytdl(videoURL, { quality: "highestaudio" })
          .pipe(fs.createWriteStream(audioOutput))
          .on("finish", () => {
            console.log("Audio download complete");
            exec(
              `ffmpeg -i ${videoOutput} -i ${audioOutput} -c copy ${finalOutput}`,
              (err, stdout, stderr) => {
                if (err) {
                  console.error("Error merging video and audio:", err);
                  return res
                    .status(500)
                    .send("Unable to merge audio and video");
                }
                console.log("Merge complete");
                const fileStream = fs.createReadStream(finalOutput);
                res.setHeader(
                  "Content-Disposition",
                  `attachment; filename=${path.basename(finalOutput)}`
                );
                res.setHeader("Content-Type", "video/mp4");

                fileStream
                  .pipe(res)
                  .on("finish", () => {
                    console.log("file sent successfully!!!");
                    fs.unlink(videoOutput, () => {});
                    fs.unlink(audioOutput, () => {});
                    fs.unlink(finalOutput, () => {});
                  })
                  .on("error", (err) => {
                    console.log(err);
                  });
              }
            );
          })
          .on("error", (error) => {
            console.log(error);
            return res.status(400).send("Unable to download audio");
          });
      })
      .on("error", (error) => {
        console.log(error);
        return res.status(400).send("Video download error");
      });
  } catch (error) {
    console.log(error);
    res.status(400).send("Error when downloading");
  }
});

app.get("/downloadAudio", async (req, res) => {
  
  console.log("Inside")
  const videoId = req.query.id;
  
  if (!videoId) {
    return res.status(400).send("Video ID is required");
  }
  const audioOutput = `${videoId}.mp3`;
  const videoURL = `https://www.youtube.com/watch?v=${videoId}`;


  try {
    
    ytdl(videoURL, { quality: "highestaudio" })
      .pipe(fs.createWriteStream(audioOutput))
      .on("finish", () => {
        console.log("Audio download completed");
        const fileStream = fs.createReadStream(audioOutput);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${path.basename(audioOutput)}`
        );
        res.setHeader("Content-Type", "audio/mpeg");
        fileStream
          .pipe(res)
          .on("finish", () => {
            console.log("file sent successfully!!!");

            fs.unlink(audioOutput, () => {});
          })
          .on("error", (err) => {
            console.log(err);
          });
      })
      .on("error", (error) => {
        console.log(error);
        return res.status(400).send("Unable to download audio");
      });
  } catch (error) {
    console.log(error);
  }
});
app.get("/getVideoDetails", async (req,res)=>{
  const videoId = req.query.id;
  
  if (!videoId) {
    return res.status(400).send("Video ID is required");
  }
  const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
  try{
    ytdl.getBasicInfo(videoURL).then((info)=>{
      console.log(info.videoDetails.title)
      //deprecation warning
      console.log(info.videoDetails.thumbnail.thumbnails[info.videoDetails.thumbnail.thumbnails.length-2]);
      const title = info.videoDetails.title;
      const thumbnail = info.videoDetails.thumbnail.thumbnails[info.videoDetails.thumbnail.thumbnails.length-2];
      res.json({
        title:title,
        thumbnail:thumbnail
      })
    });
  }catch(error){
    console.log(error)
  }
  
})

app.listen(port, () => {
  console.log(`http:localhost:${port}`);
});
