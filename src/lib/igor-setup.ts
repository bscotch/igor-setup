import fs from "fs-extra";
import { platform, tmpdir } from "os";
import path from "path";
import { LocalSettings, ModuleAliases, RuntimeReceipt } from "$/lib/types.js";
import ps from "child_process";
import https from "https";
import admzip from "adm-zip";
import plist from "plist";
import * as core from "@actions/core";
import { fetchReleasesSummaryWithNotes } from "@bscotch/gamemaker-releases";

export class IgorSetup {
  igorExecutable = "";
  userName = "tempUser";
  bootstrapperDir = path.resolve("bootstrapper");
  runtimeDir = path.resolve("runtimes");
  workingDir = path.resolve("gm-sandbox");
  userDir = "";
  targetRuntimeDir = "";
  targetModules: ModuleAliases[] = [];

  constructor(
    private readonly accessKey: string,
    private readonly targetRuntime: string,
    private readonly localSettingsFile?: string,
    private readonly devicesSettingsFile?: string
  ) {
    fs.ensureDirSync(this.cacheDir);
    fs.ensureDirSync(this.tempDir);
    fs.ensureDirSync(this.workingDir);
    this.userDir = path.join(this.workingDir, "gm-user", this.userName);
    fs.ensureDirSync(this.userDir);
    this._populateUserDir();
  }

  get workingDirDevices() {
    return path.join(this.userDir, "devices.json");
  }

  get workingDirLocalSettings() {
    return path.join(this.userDir, "local_settings.json");
  }

  get cacheDir() {
    return path.join(this.workingDir, "gm-cache");
  }

  get tempDir() {
    return path.join(this.workingDir, "gm-temp");
  }

  static async getRuntimeBasedOnYyp(yypPath: string) {
    if (!fs.existsSync(yypPath)) {
      throw new Error(`YYP file does not exist: ${yypPath}`);
    }
    const yypContent = fs.readFileSync(yypPath).toString();
    const regex = /"IDEVersion":"(\d+\.\d+\.\d+\.\d+)"/;
    const match = yypContent.match(regex);
    let ideVersion;
    if (match) {
      ideVersion = match[1];
    } else {
      throw new Error("Could not find IDEVersion in the yyp file.");
    }
    const releases = await fetchReleasesSummaryWithNotes();
    const release = releases.find((r) => r.ide.version == ideVersion);
    const matchingRuntimeVersion = release?.runtime.version as string;
    return matchingRuntimeVersion;
  }

  async ensureIgorBootStrapperBasedOnOs() {
    let igorExecutable = "Igor";
    let igorPlatform;
    switch (platform()) {
      case "win32":
        igorPlatform = "win";
        igorExecutable += ".exe";
        break;
      case "darwin":
        igorPlatform = "osx";
        break;
      case "linux":
        igorPlatform = "linux";
        break;
      default:
        throw new Error("Unsupported platform!");
    }

    let arch;
    switch (process.arch) {
      case "x64":
        arch = "x64";
        break;
      case "arm64":
        arch = "arm64";
        if (igorPlatform === "osx") {
          igorPlatform = "osx.11.0";
        }
        break;
      default:
        throw new Error("Unsupported architecture!");
    }

    const igorExecutableFullPath = path.resolve(
      path.join(this.bootstrapperDir, igorExecutable)
    );
    if (!fs.existsSync(igorExecutableFullPath)) {
      const bootstrapperDir = this.bootstrapperDir;
      const igorUrl = `https://gms.yoyogames.com/igor_${igorPlatform}-${arch}.zip`;
      const extraction = new Promise((resolve, reject) => {
        const tempDir = fs.mkdtempSync(path.join(tmpdir(), "gms2-"));
        const igorZipPath = path.join(tempDir, "igor.zip");
        const file = fs.createWriteStream(igorZipPath);
        https.get(igorUrl, function (response) {
          if (response.statusCode === 200) {
            response.pipe(file);
            file.on("finish", function () {
              const zip = new admzip(igorZipPath);
              zip.extractAllTo(bootstrapperDir, true);
              resolve(igorExecutableFullPath);
            });
          } else {
            reject(
              `GameMaker license server responded with ${response.statusCode}`
            );
          }
        });
      });
      await extraction;
    } else {
      core.info(
        `Igor bootstrapper already exists at: ${igorExecutableFullPath}`
      );
    }
    this.igorExecutable = igorExecutableFullPath;
    fs.chmodSync(this.igorExecutable, 0o777);

    // Get the license file
    const licenseFileDir = path.join(this.userDir, "licence.plist");
    if (!fs.existsSync(licenseFileDir)) {
      const fetchLicenseArgs = [
        "runtime",
        "FetchLicense",
        `-ak=${this.accessKey}`,
        `-of=${licenseFileDir}`,
      ];

      // console.log(this.igorExecutable);
      // console.log(fetchLicenseArgs.join("\n"));
      // console.log([this.igorExecutable, fetchLicenseArgs.join(" ")].join(" "));

      ps.spawnSync(this.igorExecutable, fetchLicenseArgs, {
        stdio: "inherit",
        cwd: path.dirname(this.igorExecutable),
      });
    } else {
      core.info(`License file already exists at: ${licenseFileDir}`);
    }

    const licenseFile = fs.readFileSync(licenseFileDir, "utf-8");
    const licenseFileContent = plist.parse(licenseFile) as any;
    const userName = licenseFileContent.name.split("@")[0];
    const id = licenseFileContent.id;
    this.userName = `${userName}_${id}`;
    const newUserDir = path.join(this.workingDir, "gm-user", this.userName);
    fs.ensureDirSync(newUserDir);
    fs.copySync(this.userDir, newUserDir);
    fs.removeSync(this.userDir);
    this.userDir = newUserDir;
  }

  installModules(modules?: ModuleAliases[]) {
    if (!modules || modules.length === 0) {
      switch (platform()) {
        case "win32":
          modules = ["windows"];
          break;
        case "darwin":
          modules = ["ios"];
          break;
        case "linux":
          modules = ["android"];
          break;
      }
    }

    if (this.modulesAreInstalled(modules)) {
      core.info("Modules already installed!");
    } else {
      if (!this.modulesAreInstalled(modules)) {
        const osModule = this._getRequiredOsModule();
        let targetAndOsModules = modules;
        if (osModule) {
          targetAndOsModules = modules.concat(osModule);
        }

        const args = [];
        args.push(
          `/rp=${this.runtimeDir}`,
          `/ru=${this._inferFeed()}`,
          `/uf=${this.userDir}`,
          `/m=${targetAndOsModules.join(",")}`,
          `--`,
          `Runtime`,
          `Install`,
          this.targetRuntime
        );

        core.info(this.igorExecutable);
        core.info(args.join("\n"));
        core.info([this.igorExecutable, args.join(" ")].join(" "));
        ps.spawnSync(this.igorExecutable, args, {
          stdio: "inherit",
          cwd: path.dirname(this.igorExecutable),
        });
        this.targetModules = targetAndOsModules;
      } else {
        core.info("Runtime is already installed!");
      }
    }
    this.checkFfmpeg();
    this.targetRuntimeDir = path.join(
      this.runtimeDir,
      `runtime-${this.targetRuntime}`
    );
    if (platform() !== "win32") {
      this.postInstall();
    }
  }

  modulesAreInstalled(modules: ModuleAliases[]) {
    const runtimeReceiptPath = path.join(
      this.runtimeDir,
      `runtime-${this.targetRuntime}`,
      "receipt.json"
    );
    if (!fs.existsSync(runtimeReceiptPath)) {
      return false;
    }

    for (const module of modules) {
      const requiredModules = this._getRequiredModules(module);
      const downloadedModules = Object.keys(
        fs.readJSONSync(runtimeReceiptPath)
      );
      if (!requiredModules.every((i) => downloadedModules.includes(i))) {
        return false;
      }
    }
    return true;
  }

  private _runtimeExists(runtimeUrl: string) {
    const args = [];
    args.push(
      `/rp=${this.runtimeDir}`,
      `/ru=${runtimeUrl}`,
      `/uf=${this.userDir}`,
      `--`,
      `Runtime`,
      `Info`,
      this.targetRuntime
    );

    const cmd = this.igorExecutable;
    const res = ps.spawnSync(cmd, args, {
      cwd: path.dirname(cmd),
    });
    const output = res.output.toString();
    return output.includes(this.targetRuntime);
  }

  /**
   * @description Create a working dir where the local_settings is copied to. The local_settings file will also point to the temp and cache dir.
   */
  private _populateUserDir() {
    fs.writeJsonSync(this.workingDirLocalSettings, this._createLocalSettings());
    let devicesJsonContent = { mac: {} };
    if (this.devicesSettingsFile) {
      core.info(`Using devices settings file: ${this.devicesSettingsFile}`);
      const fileContent = fs.readJsonSync(this.devicesSettingsFile);
      devicesJsonContent = fileContent;
    }
    fs.writeJsonSync(this.workingDirDevices, devicesJsonContent);
  }

  private _createLocalSettings() {
    const defaultLocalSettings: Partial<LocalSettings> = {
      "machine.Platform Settings.Windows.visual_studio_path":
        "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\Common7\\Tools\\VsDevCmd.bat", //See https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md#visual-studio-enterprise-2022
      "machine.Platform Settings.Android.Paths.jdk_location":
        process.env.JAVA_HOME_11_X64,
      "machine.Platform Settings.Android.Paths.sdk_location":
        process.env.ANDROID_SDK_ROOT,
      "machine.Platform Settings.Android.Paths.ndk_location":
        process.env.ANDROID_NDK_ROOT,
      "machine.Platform Settings.Android.Packaging.full_install": false,
      "machine.Platform Settings.Android.Packaging.package_install": false,
      "machine.Platform Settings.iOS.suppress_build": true,
      "cloud.General Settings.Compiling.UseSubstForDrivePaths": false,
      "machine.Platform Settings.Android.max_heap_size": 16,
      "machine.General Settings.Paths.IDE.TempFolder": this.tempDir,
      "machine.General Settings.Paths.IDE.AssetCacheFolder": this.cacheDir,
      runtimeDir: this.runtimeDir,
      userDir: this.userDir,
      targetRuntime: this.targetRuntime,
    };

    const localSettings = defaultLocalSettings;
    if (this.localSettingsFile) {
      if (!fs.existsSync(this.localSettingsFile)) {
        core.warning(
          `Local settings file does not exist: ${this.localSettingsFile}`
        );
      } else {
        core.info(`Using local settings file: ${this.localSettingsFile}`);
        const fileContent = fs.readJsonSync(this.localSettingsFile);
        Object.assign(localSettings, fileContent);
      }
    }
    return localSettings;
  }

  private _getRequiredOsModule() {
    const versionParts = this._getVersionParts(this.targetRuntime);
    const major = parseInt(versionParts.major);
    if (major >= 2023) {
      let os;
      switch (platform()) {
        case "win32":
          os = "windows";
          break;
        case "darwin":
          os = "osx";
          break;
        case "linux":
          os = "linux";
          break;
      }
      const baseOsModule = `base-module-${os}-${process.arch}`;
      return baseOsModule;
    } else {
      return undefined;
    }
  }

  private _getRequiredModules(targetPlatform: ModuleAliases) {
    const platformLower = targetPlatform.toLocaleLowerCase();
    let requiredModules: (keyof RuntimeReceipt | string)[];
    switch (platformLower) {
      case "android":
        requiredModules = ["android"];
        break;
      case "windows":
        requiredModules = ["windows", "windowsYYC"];
        break;
      case "mac":
        requiredModules = ["mac", "macYYC"];
        break;
      case "ios":
        requiredModules = ["ios"];
        break;
      case "linux":
        requiredModules = ["linux", "linuxYYC"];
        break;
      default:
        throw new Error(`${targetPlatform} is not supported!`);
    }
    const requiredOsModule = this._getRequiredOsModule();
    if (requiredOsModule) {
      requiredModules.push(requiredOsModule);
    }
    requiredModules.push("base");
    return requiredModules;
  }

  private _inferFeed() {
    let feed = "http://gms.yoyogames.com/Zeus-Runtime-NuBeta.rss";
    if (!this._runtimeExists(feed)) {
      feed = "http://gms.yoyogames.com/Zeus-Runtime-NuBeta-I.rss";
      if (!this._runtimeExists(feed)) {
        feed = "https://gms.yoyogames.com/Zeus-Runtime.rss";
        if (!this._runtimeExists(feed)) {
          if (!this._runtimeExists(feed)) {
            feed = "https://gms.yoyogames.com/Zeus-Runtime-LTS.rss";
            if (!this._runtimeExists(feed)) {
              throw "Runtime does not exist!";
            }
          }
        }
      }
    }
    //Cache busting by adding day and hour to the feed url
    const date = new Date();
    const day = date.getDay();
    const hour = date.getHours();
    const cacheBustingPostfix = `?day=${day}&hour=${hour}`;
    return feed + cacheBustingPostfix;
  }

  private _getVersionParts(version: string) {
    const versionParts = version.split(".");
    return {
      major: versionParts[0],
      minor: versionParts[1],
      patch: versionParts[2],
      revision: versionParts[3],
    };
  }

  private checkFfmpeg() {
    const ffmpegPath = path.join(
      this.runtimeDir,
      `runtime-${this.targetRuntime}`,
      "bin",
      "ffmpeg"
    );
    if (!fs.existsSync(ffmpegPath)) {
      core.warning("Runtime is missing ffmpeg!");
    }
  }

  private postInstall() {
    const targetRuntimeBinDir = path.join(this.targetRuntimeDir, "bin");
    let postInstallScript = "linux-post-install.sh";
    if (platform() === "darwin") {
      postInstallScript = "mac-post-install.sh";
    }
    const postInstallSh = path.join(targetRuntimeBinDir, postInstallScript);

    if (fs.existsSync(postInstallSh)) {
      core.info("Running post install scripts.");
      fs.chmodSync(postInstallSh, 0o777);
      ps.spawnSync("sh", [postInstallSh], {
        stdio: "inherit",
        cwd: this.targetRuntimeDir,
      });
    }

    const versionParts = this._getVersionParts(this.targetRuntime);
    const major = parseInt(versionParts.major);
    const minor = parseInt(versionParts.minor);
    if (
      ((minor > 2 && minor < 100) || (minor >= 100 && minor < 300)) &&
      major < 2023 &&
      platform() === "linux"
    ) {
      //Linux is case sensitive, and the compiler uses Capital `Android` for some older runtimes.
      const androidPath = path.join(this.targetRuntimeDir, "android");
      if (fs.existsSync(androidPath)) {
        const androidNewPath = path.join(this.targetRuntimeDir, "Android");
        fs.renameSync(androidPath, androidNewPath);
      }
    }

    if (platform() === "darwin") {
      const optimizeSh = path.join(
        targetRuntimeBinDir,
        "mac-optimise-runtime.sh"
      );
      if (fs.existsSync(optimizeSh)) {
        core.info("Running mac optimize runtime scripts.");
        fs.chmodSync(optimizeSh, 0o777);
        ps.spawnSync("sh", [optimizeSh], {
          stdio: "inherit",
          cwd: this.targetRuntimeDir,
        });
      }
    }

    const png_crush_dir = path.join(targetRuntimeBinDir, "pngcrush");
    if (fs.existsSync(png_crush_dir)) {
      fs.chmodSync(png_crush_dir, 0o777);
    }
  }
}
