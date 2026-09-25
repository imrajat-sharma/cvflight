import { execFile, spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
let active = 0;
export class CompilerUnavailable extends Error {}
export function isLatexCompilerEnabled(options?: {
  dockerAvailable?: boolean;
}): boolean {
  const configured = process.env.LATEX_COMPILER_ENABLED;
  if (configured !== undefined)
    return configured.trim().toLowerCase() === "true";
  return (
    options?.dockerAvailable ??
    (() => {
      const result = spawnSync("docker", ["--version"], { stdio: "ignore" });
      return !result.error && result.status === 0;
    })()
  );
}
export async function compileLatex(tex: string): Promise<Uint8Array> {
  if (!isLatexCompilerEnabled())
    throw new CompilerUnavailable(
      "The isolated LaTeX compiler is not configured. You can still export a structured PDF, or download the .tex file. See README for Docker setup.",
    );
  if (Buffer.byteLength(tex) > 250000)
    throw new Error("LaTeX source exceeds the 250 KB limit.");
  if (active >= 2)
    throw new Error("The compiler is busy. Please try again in a moment.");
  const image = process.env.LATEX_DOCKER_IMAGE || "cvflight-latex:local";
  if (!/^[a-zA-Z0-9_./:@-]+$/.test(image))
    throw new Error("Invalid compiler image configuration.");
  const name = "cvflight-" + randomUUID();
  active++;
  try {
    return await new Promise<Uint8Array>((resolve, reject) => {
      const args = [
        "run",
        "--rm",
        "-i",
        "--name",
        name,
        "--network=none",
        "--read-only",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "--memory=256m",
        "--memory-swap=256m",
        "--cpus=1",
        "--pids-limit=48",
        "--ulimit",
        "fsize=16777216:16777216",
        "--user",
        "65534:65534",
        "--tmpfs",
        "/work:rw,noexec,nosuid,size=48m,mode=1777",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=16m,mode=1777",
        "--workdir",
        "/work",
        "--env",
        "HOME=/work",
        "--env",
        "openin_any=p",
        "--env",
        "openout_any=p",
        image,
        "sh",
        "-c",
        "cat > resume.tex; pdflatex -no-shell-escape -halt-on-error -interaction=nonstopmode -output-directory=/work resume.tex > /work/build.log 2>&1 && cat /work/resume.pdf || { tail -c 5000 /work/build.log >&2; exit 1; }",
      ];
      const child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
      let size = 0,
        error = "",
        settled = false;
      const output: Buffer[] = [];
      const cleanup = () => {
        execFile("docker", ["rm", "-f", name], { timeout: 5000 }, () => {});
      };
      const fail = (e: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        child.kill("SIGKILL");
        cleanup();
        reject(e);
      };
      const timer = setTimeout(
        () => fail(new Error("Compilation exceeded the 20-second time limit.")),
        20000,
      );
      child.stdout.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 10000000)
          fail(new Error("Compiler output exceeded the size limit."));
        else output.push(chunk);
      });
      child.stderr.on("data", (chunk: Buffer) => {
        error = (error + chunk.toString()).slice(-6000);
      });
      child.stdin.on("error", () => {});
      child.on("error", () =>
        fail(
          new CompilerUnavailable(
            "Docker is not available. Configure the isolated compiler before compiling LaTeX.",
          ),
        ),
      );
      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        if (code !== 0)
          return reject(new Error(error || "LaTeX compilation failed."));
        const pdf = Buffer.concat(output);
        if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")))
          return reject(new Error("Compiler did not return a valid PDF."));
        resolve(new Uint8Array(pdf));
      });
      child.stdin.end(tex);
    });
  } finally {
    active--;
  }
}
