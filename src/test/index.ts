import { expect } from "chai";
import fs from "fs-extra";
import { join, resolve } from "path";
import { IgorSetup } from "../lib/igor-setup.js";
import { LocalSettings, ModuleAliases } from "../lib/types.js";
import dotenv from "dotenv";
dotenv.config();

const sandboxRoot = resolve("./sandbox");
const gmSandboxRoot = resolve("./gm-sandbox");
const bootstrapperRoot = resolve("./bootstrapper");
const accessKey = process.env.ACCESS_KEY as string;
const defaultTargetRuntime = "2024.1400.0.802";
const defaultIDEVersion = "2024.1400.0.795";
const targetRuntime = process.env.TARGET_RUNTIME || defaultTargetRuntime;
const localSettingsOverrideFile = join(
  sandboxRoot,
  "local_settings_override.json"
);
const tempFolderOverride = "somewhere/else";
const devicesOverrideFile = join(sandboxRoot, "devices_override.json");
const devicesOverride = { something: {} };
const runtimesRoot = resolve("./runtimes");
const modulesToDownload = process.env.TARGETPLATFORMS
  ? process.env.TARGETPLATFORMS.split(",")
  : ([] as ModuleAliases[]);
const compileLocalSettingsOverrideFile =
  process.env.COMPILE_LOCAL_SETTINGS_OVERRIDE_FILE;
const sampleYyp = join(sandboxRoot, "sample.yyp");

function resetSandbox() {
  fs.ensureDirSync(sandboxRoot);
  fs.emptyDirSync(sandboxRoot);
  fs.removeSync(gmSandboxRoot);
  fs.removeSync(bootstrapperRoot);
  fs.removeSync(runtimesRoot);
  fs.writeJsonSync(localSettingsOverrideFile, {
    "machine.General Settings.Paths.IDE.TempFolder": "somewhere/else",
  });
  fs.writeFileSync(devicesOverrideFile, JSON.stringify(devicesOverride));
  fs.writeFileSync(sampleYyp, `"IDEVersion": "${defaultIDEVersion}"`);
}

describe("Test Suite", function () {
  this.timeout(300000);
  before(function () {
    resetSandbox();
  });

  describe("Igor Setup", function () {
    it("Can create a local_setting.json file that expose cache and temp dir", function () {
      const igorSetup = new IgorSetup(accessKey, targetRuntime);
      expect(fs.existsSync(igorSetup.cacheDir)).to.be.true;
      expect(fs.existsSync(igorSetup.tempDir)).to.be.true;
      const localSettings = fs.readJsonSync(
        igorSetup.workingDirLocalSettings
      ) as Partial<LocalSettings>;
      expect(
        localSettings["machine.General Settings.Paths.IDE.TempFolder"]
      ).to.equal(igorSetup.tempDir);
      expect(
        localSettings["machine.General Settings.Paths.IDE.AssetCacheFolder"]
      ).to.equal(igorSetup.cacheDir);
    });
    it("Can create a local_setting.json file that uses the provided local_settings.json file for SDK config paths", function () {
      const igorSetup = new IgorSetup(
        accessKey,
        targetRuntime,
        localSettingsOverrideFile
      );
      const localSettings = fs.readJsonSync(
        igorSetup.workingDirLocalSettings
      ) as Partial<LocalSettings>;
      expect(
        localSettings["machine.General Settings.Paths.IDE.TempFolder"]
      ).to.equal(tempFolderOverride);
    });
    it("Can create a devices.json file that uses the provided devices.json file for target device configs", function () {
      const igorSetup = new IgorSetup(
        accessKey,
        targetRuntime,
        undefined,
        devicesOverrideFile
      );
      const devices = fs.readJsonSync(igorSetup.workingDirDevices);
      expect(devices).to.deep.equal(devicesOverride);
    });

    it("Can ensure Igor bootstrapper is installed", async function () {
      const testEnvs = [
        { PLATFORM: "win32", ARCH: "x64" },
        // { PLATFORM: "win32", ARCH: "arm64" }, //This one actually use `windows` instead of `win` for the platform name, but the downloading address is still `win`
        { PLATFORM: "linux", ARCH: "x64" },
        { PLATFORM: "linux", ARCH: "arm64" },
        { PLATFORM: "darwin", ARCH: "x64" },
        { PLATFORM: "darwin", ARCH: "arm64" },
      ];

      for (const testEnv of testEnvs) {
        resetSandbox();
        process.env.PLATFORM = testEnv.PLATFORM;
        process.env.ARCH = testEnv.ARCH;
        const igorSetup = new IgorSetup(accessKey, targetRuntime);
        const igorExecutable =
          await igorSetup.ensureIgorBootStrapperBasedOnOs();
        console.log("Igor executable path: ", igorExecutable);
      }

      process.env.PLATFORM = "";
      process.env.ARCH = "";
    });

    it("Can throw if the interested runtime is not available in the rss", async function () {
      const igorSetup = new IgorSetup(accessKey, "0.0.0.0");
      await igorSetup.ensureIgorBootStrapperBasedOnOs();
      await igorSetup.getIgorLicense();
      expect(() => {
        igorSetup.installModules(modulesToDownload);
      }).to.throw("Runtime does not exist in GameMaker's RSS feed!");
    });

    it("Can infer the runtime based on a yyp file", async function () {
      const targetRuntime = await IgorSetup.getRuntimeBasedOnYyp(sampleYyp);
      expect(targetRuntime).to.equal(defaultTargetRuntime);
    });

    it("Can throw if the interested runtime is not available in the rss", async function () {
      const igorSetup = new IgorSetup(accessKey, "0.0.0.0");
      await igorSetup.ensureIgorBootStrapperBasedOnOs();
      await igorSetup.getIgorLicense();
      expect(() => {
        igorSetup.installModules(modulesToDownload);
      }).to.throw("Runtime does not exist in GameMaker's RSS feed!");
    });

    it("Can download new runtime", async function () {
      const igorSetup = new IgorSetup(
        accessKey,
        targetRuntime,
        compileLocalSettingsOverrideFile
      );
      await igorSetup.ensureIgorBootStrapperBasedOnOs();
      await igorSetup.getIgorLicense();
      igorSetup.installModules(modulesToDownload);
      expect(igorSetup.modulesAreInstalled(modulesToDownload)).to.be.true;
    });
  });
});
