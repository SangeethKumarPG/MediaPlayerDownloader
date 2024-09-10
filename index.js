const express = require("express");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const cors = require('cors');

const app = express();
const port = 3000;

const corsOptions = {
  origin: 'https://mediaplayerfrontend2.onrender.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));

app.get("/downloadVideo", async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) {
    return res.status(400).send("Video ID is required");
  }
  const videoOutput = `${videoId}videoOnly.mp4`;
  const audioOutput = `${videoId}.mp3`;
  const finalOutput = `${videoId}.mp4`;
  const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    ytdl(videoURL, { quality: "highestvideo" })
      .pipe(fs.createWriteStream(videoOutput))
      .on("finish", () => {
        ytdl(videoURL, { quality: "highestaudio" })
          .pipe(fs.createWriteStream(audioOutput))
          .on("finish", () => {
            exec(
              `ffmpeg -i ${videoOutput} -i ${audioOutput} -c copy ${finalOutput}`,
              (err) => {
                if (err) {
                  return res.status(500).send("Unable to merge audio and video");
                }
                const fileStream = fs.createReadStream(finalOutput);
                res.setHeader(
                  "Content-Disposition",
                  `attachment; filename=${path.basename(finalOutput)}`
                );
                res.setHeader("Content-Type", "video/mp4");
                fileStream
                  .pipe(res)
                  .on("finish", () => {
                    fs.unlink(videoOutput, () => {});
                    fs.unlink(audioOutput, () => {});
                    fs.unlink(finalOutput, () => {});
                  })
                  .on("error", (err) => {
                    console.error("Error sending file:", err);
                  });
              }
            );
          })
          .on("error", (error) => {
            res.status(400).send("Unable to download audio");
          });
      })
      .on("error", (error) => {
        res.status(400).send("Video download error");
      });
  } catch (error) {
    res.status(400).send("Error when downloading");
  }
});

app.get("/downloadAudio", async (req, res) => {
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
        const fileStream = fs.createReadStream(audioOutput);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${path.basename(audioOutput)}`
        );
        res.setHeader("Content-Type", "audio/mpeg");
        fileStream
          .pipe(res)
          .on("finish", () => {
            fs.unlink(audioOutput, () => {});
          })
          .on("error", (err) => {
            console.error("Error sending file:", err);
          });
      })
      .on("error", (error) => {
        res.status(400).send("Unable to download audio");
      });
  } catch (error) {
    res.status(400).send("Error when downloading");
  }
});

app.get("/getVideoDetails", async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) {
    return res.status(400).send("Video ID is required");
  }
  const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const info = await ytdl.getBasicInfo(videoURL);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnail.thumbnails[info.videoDetails.thumbnail.thumbnails.length-2];
    res.json({
      title: title,
      thumbnail: thumbnail
    });
  } catch (error) {
    res.status(400).send("Error fetching video details");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
