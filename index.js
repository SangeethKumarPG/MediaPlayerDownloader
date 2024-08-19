const express = require("express");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const port = 3000;

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
        console.log("Video download complete!");
        ytdl(videoURL, { quality: "highestaudio" })
          .pipe(fs.createWriteStream(audioOutput))
          .on("finish", () => {
            console.log("Audio download complete");
            exec(
              `ffmpeg -i ${videoOutput} -i ${audioOutput} -c copy ${finalOutput}`,
              (err) => {
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
                    console.log("File sent successfully!");
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
            console.error("Error downloading audio:", error);
            res.status(400).send("Unable to download audio");
          });
      })
      .on("error", (error) => {
        console.error("Error downloading video:", error);
        res.status(400).send("Video download error");
      });
  } catch (error) {
    console.error("Error during download:", error);
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
            console.log("File sent successfully!");
            fs.unlink(audioOutput, () => {});
          })
          .on("error", (err) => {
            console.error("Error sending file:", err);
          });
      })
      .on("error", (error) => {
        console.error("Error downloading audio:", error);
        res.status(400).send("Unable to download audio");
      });
  } catch (error) {
    console.error("Error during download:", error);
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
    console.error("Error fetching video details:", error);
    res.status(400).send("Error fetching video details");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
