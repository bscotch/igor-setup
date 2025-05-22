import * as core from "@actions/core";
import { IgorSetup } from "$/lib/igor-setup";
import { restoreCache } from "@/cache-restore.js";
import { platform } from "os";

export async function run() {
  try {
    const accessKey = core.getInput("access-key");
    let targetRuntime = core.getInput("runtime-version");
    const targetYyp = core.getInput("target-yyp");
    if (targetRuntime && targetYyp) {
      core.info(
        "Both runtime-version and target-yyp are specified. Using runtime-version."
      );
    } else if (!targetRuntime && !targetYyp) {
      throw new Error("You must specify either runtime-version or target-yyp");
    } else if (targetYyp) {
      core.info(`Inferring runtime from target-yyp: ${targetYyp}`);
      targetRuntime = await IgorSetup.getRuntimeBasedOnYyp(targetYyp);
    }
    const localSettingsOverrideFile = core.getInput(
      "local-settings-override-file"
    );
    const devicesOverrideFile = core.getInput("devices-settings-override-file");
    const cache = core.getInput("cache");

    const targetModulesFromInputModule = core.getInput("module");
    const targetModulesFromInputModules = core.getInput("modules");
    if (targetModulesFromInputModule && targetModulesFromInputModules) {
      throw new Error(
        "Both `module` and `modules` are specified. You must specify only one."
      );
    }
    const targetModules =
      targetModulesFromInputModule || targetModulesFromInputModules;

    const igorSetup = new IgorSetup(
      accessKey,
      targetRuntime,
      localSettingsOverrideFile,
      devicesOverrideFile
    );
    const targetModulesSplitAsArray = targetModules
      ? targetModules.split(",")
      : igorSetup.getDefaultModulesIfNull(undefined);

    if (cache === "true") {
      const primaryKey = `${platform()}-${targetModulesSplitAsArray.join(",")}-${targetRuntime}`;
      await restoreCache(primaryKey, [
        igorSetup.runtimeDir,
        igorSetup.bootstrapperDir,
      ]);
    }

    await igorSetup.ensureIgorBootStrapperBasedOnOs();
    await igorSetup.getIgorLicense();
    igorSetup.installModules(targetModulesSplitAsArray);
    core.info(`Installed modules: ${igorSetup.targetModules.join(",")}`);
    core.info(`For runtime: ${targetRuntime}`);
    core.setOutput("cache-dir", igorSetup.cacheDir);
    core.setOutput("temp-dir", igorSetup.tempDir);
    core.setOutput("runtime-dir", igorSetup.targetRuntimeDir);
    core.setOutput("user-dir", igorSetup.userDir);
    core.setOutput("settings-dir", igorSetup.workingDirLocalSettings);
    core.setOutput("bootstrapper-dir", igorSetup.bootstrapperDir);
  } catch (err) {
    core.error(err as Error);
    core.setFailed(err as Error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
