import { ArgumentParser } from "argparse";
import { parse } from "node-html-parser";
import fs from "fs";
import path from "path";

interface Args {
  directory: string;
}

const parser = new ArgumentParser();
parser.add_argument("directory", {
  help: "Directory to process",
});

const parsed = parser.parse_args() as Args;

if (!fs.existsSync(parsed.directory)) {
  throw new Error(`Directory ${parsed.directory} does not exist.`);
}

const darkSuffix = "-dark";
const invertClass = ".invert{filter:invert(1)}";
const brightenClass = ".brighten{filter:brightness(1.4)}";

let svgFiles = fs
  .readdirSync(parsed.directory, { recursive: false, withFileTypes: true })
  .filter((x) => x.isFile())
  .filter((x) => path.extname(x.name) == ".svg")
  .filter((x) => !x.name.includes("-dark.svg"));

console.log(`Found ${svgFiles.length} svg files to process`);

const brightenableColors = ["yellow", "purple", "blue"];
const invertibleColors = ["white", "black", "defaultgrey"];

for (const file of svgFiles) {
  console.log(`Processing file ${file.name}`);
  const buffer = fs.readFileSync(path.join(file.path, file.name));
  const contents = buffer.toString("utf-8");

  const html = parse(contents);
  const style = html.querySelector("svg > defs > style");

  if (!style) {
    console.warn("Could not find style tag, skipping processing icon.");
    continue;
  }

  const gs = html.querySelectorAll("svg > g[id='level-1']");
  if (gs.length > 1) {
    console.warn("Mutiple matching groups found. Using the first group.");
  }
  const g = gs[0];

  const paths = g.querySelectorAll("path");
  const allBrightenable = paths
    .map((x) => Array.from(x.classList.values()))
    .flat()
    .every((x) => brightenableColors.some((c) => x.includes(c)));
  const allInvertible = paths
    .map((x) => Array.from(x.classList.values()))
    .flat()
    .every((x) => invertibleColors.some((c) => x.includes(c)));

  const addedClasses: string[] = [];
  if (allBrightenable || allInvertible) {
    if (allBrightenable) {
      g.classList.add("brighten");
      addedClasses.push(brightenClass);
    } else {
      g.classList.add("invert");
      addedClasses.push(invertClass);
    }
  } else {
    addedClasses.push(brightenClass);
    addedClasses.push(invertClass);

    for (const path of paths) {
      const classList = Array.from(path.classList.values());
      if (classList.includes("canvas")) {
        continue;
      }

      const colored = classList.some((x) => brightenableColors.some((c) => x.includes(c)));
      const greyscale = classList.some((x) => invertibleColors.some((c) => x.includes(c)));
      if ((colored && greyscale) || !(colored || greyscale)) {
        console.warn("Found no match. Skipping path modification. Output might not be correct.");
        continue;
      }

      if (colored) {
        path.classList.add("brighten");
      } else {
        path.classList.add("invert");
      }
    }
  }

  style.textContent = `${style.textContent}${addedClasses.reduce((s, c) => c + s, "")}`;

  const fileNameWithoutExtension = path.basename(file.name, ".svg");
  const finalName = `${fileNameWithoutExtension}${darkSuffix}.svg`;
  fs.writeFileSync(path.join(file.path, finalName), html.outerHTML);
}
