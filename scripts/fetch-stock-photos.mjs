// Replaces the placeholder stock images in public/stock/general-contractor/
// with real photos (Unsplash License: free for commercial use, no
// attribution required). These are the photos used in concepts/.
//   npm run stock:fetch
// Then commit the downloaded files.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(import.meta.dirname, "..", "public", "stock", "general-contractor");
const PHOTOS = {
  hero: "1600585154526-990dced4db0d",
  about: "1600607687939-ce8a6c25118c",
  "work-1": "1556911220-bff31c812dba",
  "work-2": "1552321554-5fefe8c9ef14",
  "work-3": "1584622650111-993a426fbf0a",
  "work-4": "1600489000022-c2086d79f9d4",
};

await mkdir(DIR, { recursive: true });
for (const [slot, id] of Object.entries(PHOTOS)) {
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fm=jpg&fit=crop&w=1600&h=1067&q=72`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`${slot}: download failed (${res.status})`);
    process.exitCode = 1;
    continue;
  }
  await writeFile(path.join(DIR, `${slot}.jpg`), Buffer.from(await res.arrayBuffer()));
  console.log(`${slot}.jpg saved`);
}
