import type { PluginContext } from "rollup";

const GithubRepoUrl = "https://www.github.com/JakeYallop/WasmSharp";

const emitPossibleBugWarning = (
  context: PluginContext,
  message: string,
  pluginCode: string,
  options?: { meta?: unknown; disableBugMessage: boolean },
) => {
  if (!options?.disableBugMessage) {
    context.warn({
      message: `${message} This is probably a bug.${message.endsWith("\n") ? "" : " "}Please report it at ${GithubRepoUrl}.`,
      pluginCode: pluginCode,
      ...(options?.meta ? { meta: options.meta } : {}),
    });
  } else {
    context.warn(message);
  }
};

export default emitPossibleBugWarning;
