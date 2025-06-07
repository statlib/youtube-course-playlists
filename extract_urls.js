/**
 * This script scrapes a YouTube playlist page for all video titles and URLs,
 * structures them into an object nested under the playlist's title,
 * and downloads the result as a JSON file.
 *
 * Structure: {"Playlist Title": {"Video Title": "Video URL", ...}}
 */
(function () {
  console.log("Starting playlist scrape...");

  // --- 1. Define Selectors ---
  const videoSelector =
    "ytd-playlist-video-renderer #video-title, ytd-playlist-panel-video-renderer #video-title";
  // UPDATED selector based on the new page structure.
  const playlistTitleSelector =
    "h1.dynamic-text-view-model-wiz__h1 span.yt-core-attributed-string";

  // --- 2. Find all video elements on the page ---
  const videoElements = document.querySelectorAll(videoSelector);

  if (videoElements.length === 0) {
    console.error("❌ No videos found!");
    alert(
      "No videos were found. Please make sure you are on a YouTube playlist page and have scrolled to the bottom to load all the videos."
    );
    return;
  }

  console.log(`Found ${videoElements.length} videos. Processing...`);

  // --- 3. Build the {title: url} object for videos ---
  const videoData = {};
  let duplicateCount = 0;

  Array.from(videoElements).forEach((el) => {
    const title = el.getAttribute("title").trim();

    // The 'href' property can sometimes be relative.
    // By providing a base URL (window.location.origin), the constructor
    // can correctly handle both full URLs and relative paths like '/watch?v=...'.
    const url = new URL(el.href, window.location.origin);

    const cleanUrl = `https://www.youtube.com/watch?v=${url.searchParams.get(
      "v"
    )}`;

    if (videoData.hasOwnProperty(title)) {
      duplicateCount++;
    }
    videoData[title] = cleanUrl;
  });

  if (duplicateCount > 0) {
    console.warn(
      `Warning: Found ${duplicateCount} video(s) with duplicate titles. Only the last instance of each was kept in the final data.`
    );
  }

  // --- 4. Get the playlist title and create the final export object ---
  let playlistTitle = "Untitled Playlist"; // Default title
  const titleElement = document.querySelector(playlistTitleSelector);
  if (titleElement) {
    playlistTitle = titleElement.textContent.trim();
  } else {
    console.warn("Could not find playlist title element. Using default name.");
  }

  // Create the final object with the playlist title as the top-level key
  const exportData = {
    [playlistTitle]: videoData,
  };

  // --- 5. Prepare and trigger the JSON file download ---
  function downloadObjectAsJson(exportObj, exportName) {
    try {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", exportName + ".json");
      document.body.appendChild(downloadAnchorNode); // Required for Firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      console.log(`✅ Success! Download started for ${exportName}.json`);
    } catch (error) {
      console.error("❌ Download failed.", error);
      alert("Could not trigger the download. See the console for details.");
    }
  }

  // --- 6. Sanitize the title for the filename and initiate download ---
  const sanitizedFilename =
    playlistTitle.replace(/[^a-z0-9_]/gi, "-").toLowerCase() || "playlist";
  downloadObjectAsJson(exportData, sanitizedFilename);
})();
