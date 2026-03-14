import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split("\n");
    console.log("Keys found in .env:");
    lines.forEach(line => {
        if (line.includes("=")) {
            console.log(line.split("=")[0].trim());
        }
    });
} else {
    console.log(".env file NOT FOUND");
}
