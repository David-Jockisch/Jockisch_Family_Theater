const { execFile } = require("child_process");
const path = require("path");

function runGit(projectRoot, args) {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      {
        cwd: projectRoot,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 4
      },
      (error, stdout, stderr) => {
        const result = {
          command: `git ${args.map(arg => /\s/.test(arg) ? `"${arg}"` : arg).join(" ")}`,
          stdout: String(stdout || "").trimEnd(),
          stderr: String(stderr || "").trimEnd(),
          code: error && Number.isInteger(error.code) ? error.code : 0
        };

        if (error) {
          const wrapped = new Error(result.stderr || result.stdout || error.message);
          wrapped.result = result;
          return reject(wrapped);
        }

        resolve(result);
      }
    );
  });
}

async function verifyGit(projectRoot) {
  try {
    await runGit(projectRoot, ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

async function getStatus(projectRoot) {
  if (!(await verifyGit(projectRoot))) {
    const error = new Error("This folder is not recognized as a Git repository.");
    error.status = 400;
    throw error;
  }

  const [branchResult, shortResult, branchStatusResult] = await Promise.all([
    runGit(projectRoot, ["branch", "--show-current"]),
    runGit(projectRoot, ["status", "--short"]),
    runGit(projectRoot, ["status", "-sb"])
  ]);

  const branch = branchResult.stdout || "Detached HEAD";
  const lines = shortResult.stdout ? shortResult.stdout.split(/\r?\n/).filter(Boolean) : [];

  return {
    branch,
    clean: lines.length === 0,
    changeCount: lines.length,
    changes: lines,
    branchStatus: branchStatusResult.stdout
  };
}

function sendGitError(res, error) {
  console.error("Git API error:", error);
  return res.status(error.status || 500).json({
    success: false,
    error: error.message || "Git command failed.",
    result: error.result || null
  });
}

function registerGitRoutes(app, options = {}) {
  const projectRoot = path.resolve(options.projectRoot || path.join(__dirname, ".."));

  app.get("/api/git/status", async (req, res) => {
    try {
      const status = await getStatus(projectRoot);
      return res.json({ success: true, ...status });
    } catch (error) {
      return sendGitError(res, error);
    }
  });

  app.post("/api/git/stage", async (req, res) => {
    try {
      const before = await getStatus(projectRoot);
      if (before.clean) {
        return res.status(400).json({ success: false, error: "No uncommitted changes were found." });
      }

      const add = await runGit(projectRoot, ["add", "-A"]);
      const staged = await runGit(projectRoot, ["diff", "--cached", "--name-status"]);

      return res.json({
        success: true,
        output: add,
        staged: staged.stdout ? staged.stdout.split(/\r?\n/).filter(Boolean) : []
      });
    } catch (error) {
      return sendGitError(res, error);
    }
  });

  app.post("/api/git/commit", async (req, res) => {
    try {
      const message = String(req.body?.message || "").trim() || "Update JFT collection";
      if (message.length > 180) {
        return res.status(400).json({ success: false, error: "Commit message must be 180 characters or fewer." });
      }

      const stagedCheck = await runGit(projectRoot, ["diff", "--cached", "--name-only"]);
      if (!stagedCheck.stdout.trim()) {
        return res.status(400).json({ success: false, error: "There are no staged files to commit." });
      }

      const commit = await runGit(projectRoot, ["commit", "-m", message]);
      return res.json({ success: true, output: commit });
    } catch (error) {
      return sendGitError(res, error);
    }
  });

  app.post("/api/git/push", async (req, res) => {
    try {
      const push = await runGit(projectRoot, ["push"]);
      const status = await getStatus(projectRoot);
      return res.json({ success: true, output: push, status });
    } catch (error) {
      return sendGitError(res, error);
    }
  });
}

module.exports = { registerGitRoutes };
