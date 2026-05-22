process.env.NODE_ENV = "production";
process.env.NEXT_TELEMETRY_DISABLED = "1";

const { spawn } = require("child_process");
const path = require("path");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.CIH_BIND_HOST || process.env.BIND_HOST || "0.0.0.0";

const nextBin = path.resolve(__dirname, "node_modules", "next", "dist", "bin", "next");

const server = spawn(process.execPath, [nextBin, "start", "--port", String(port), "--hostname", hostname], {
  stdio: "inherit",
  env: { ...process.env },
});

process.on("SIGTERM", () => server.kill("SIGTERM"));
process.on("SIGINT", () => server.kill("SIGINT"));

server.on("exit", (code) => process.exit(code));
