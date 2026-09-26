const express = require("express");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT || 3000);

app.disable("x-powered-by");

app.use(
  express.static(path.join(__dirname, "public"), {
    etag: true,
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html") || filePath.endsWith(".css")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Cluster Café frontend running on port ${PORT}`);
});
