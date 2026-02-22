import { build as viteBuild } from "vite";

console.log("building client...");
await viteBuild();
console.log("done!");
