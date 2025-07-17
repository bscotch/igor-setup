const defaultLocalSettings = {
  "machine.General Settings.Paths.Debug.PathToAssetCompiler":
    "${runtimeLocation}/bin/GMAssetCompiler.exe",
  "machine.General Settings.Paths.Debug.PathToDebugger":
    "${runtimeLocation}/debugger/GMDebug.exe",
  "machine.General Settings.Paths.Debug.PathToRunner":
    "${runtimeLocation}/windows/Runner.exe",
  "machine.General Settings.Paths.Debug.PathToHtml5Runner":
    "${runtimeLocation}/html5/scripts.html5.zip",
  "machine.General Settings.Paths.Debug.PathToWebServer":
    "${runtimeLocation}/bin/GMWebServer.exe",
  "machine.General Settings.Paths.Debug.PathToIgor":
    "${runtimeLocation}/bin/Igor.exe",
  "machine.General Settings.Help.WebServerPort": "51290",
  "machine.General Settings.Compiling.DebuggerPort": "6509",
  "machine.Platform Settings.Android.max_heap_size": 2,
  "machine.Platform Settings.Android.Paths.sdk_location": "c:/android-sdk",
  "machine.Platform Settings.Android.Paths.ndk_location": "c:/android-ndk",
  "machine.Platform Settings.Android.Paths.jdk_location":
    "c:/Program Files/Java/jdk1.8.0_05",
  "machine.Platform Settings.Android.Packaging.full_install": true,
  "machine.Platform Settings.Android.Packaging.package_install": true,
  "machine.Platform Settings.Android.debug.runner_path":
    "${runtimeLocation}/android/runner",
  "machine.Platform Settings.Android.Keystore.alias": "default_alias",
  "machine.Platform Settings.Android.Keystore.filename": "",
  "machine.Platform Settings.Android.Keystore.keystore_password": "",
  "machine.Platform Settings.Android.Keystore.keystore_alias_password": "",
  "machine.Platform Settings.Amazon Fire.max_heap_size": 2,
  "machine.Platform Settings.Amazon Fire.Paths.sdk_location": "c:/android-sdk",
  "machine.Platform Settings.Amazon Fire.Paths.ndk_location": "c:/android-ndk",
  "machine.Platform Settings.Amazon Fire.Paths.jdk_location":
    "c:/Program Files/Java/jdk1.8.0_05",
  "machine.Platform Settings.Amazon Fire.Packaging.full_install": true,
  "machine.Platform Settings.Amazon Fire.Packaging.package_install": true,
  "machine.Platform Settings.Amazon Fire.debug.runner_path":
    "${runtimeLocation}/amazonfire/runner",
  "machine.Platform Settings.Amazon Fire.Keystore.alias": "default_alias",
  "machine.Platform Settings.HTML5.debug.obfuscate": true,
  "machine.Platform Settings.HTML5.debug.pretty_print": false,
  "machine.Platform Settings.HTML5.debug.remove_unused_ff": true,
  "machine.Platform Settings.HTML5.debug.encode_strings": false,
  "machine.Platform Settings.HTML5.debug.verbose": true,
  "machine.Platform Settings.HTML5.choice": 2,
  "machine.Platform Settings.HTML5.default_webserver_port": 51264,
  "machine.Platform Settings.HTML5.default_web_address": "http://127.0.0.1",
  "machine.Platform Settings.HTML5.default_allowed_ips": "",
  "machine.Platform Settings.iOS.suppress_build": false,
  "machine.Platform Settings.iOS.remote_install_path": "~/GameMakerStudio/ios",
  "machine.Platform Settings.iOS.default_team_id": "",
  "machine.Platform Settings.tvOS.suppress_build": false,
  "machine.Platform Settings.tvOS.remote_install_path":
    "~/GameMakerStudio/tvos",
  "machine.Platform Settings.tvOS.default_team_id": "",
  "machine.Platform Settings.macOS.default_team_id": "",
  "machine.Platform Settings.macOS.suppress_build": false,
  "machine.Platform Settings.Windows.visual_studio_path":
    "c:/Program Files (x86)/Microsoft Visual Studio/2019/Professional/Common7/Tools/VsDevCmd.bat",
  "machine.Platform Settings.Windows.choice": 2,
  "machine.Platform Settings.Steam.steamsdk_path":
    "C:/Program Files (x86)/Microsoft Visual Studio/2019/Professional/Common7/Tools/VsDevCmd.bat",
  "cloud.General Settings.Compiling.ShowVerboseCommands": false,
  "machine.General Settings.Paths.IDE.TempFolder": "C:/temp",
  "machine.General Settings.Paths.IDE.AssetCacheFolder": "C:/cache",
  runtimeDir: "C:/runtimes",
  userDir: "C:/Users/user",
  "cloud.General Settings.Compiling.UseSubstForDrivePaths": false,
  targetRuntime: "2024.400.0.529",
  "machine.Platform Settings.Xbox Series XS.visual_studio_path":
    "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\Common7\\Tools\\VsDevCmd.bat",
};

export type LocalSettings = typeof defaultLocalSettings;
export type ModuleAliases =
  | "android"
  | "windows"
  | "mac"
  | "ios"
  | "linux"
  | "html5"
  | "main"
  | string;

const defaultRuntimeReceipt = {
  base: "base",
  android: "android",
  html5: "html5",
  ios: "ios",
  linux: "linux",
  linuxYYC: "linuxYYC",
  mac: "mac",
  macYYC: "macYYC",
  tvos: "tvos",
  windows: "windows",
  windowsuap: "windowsuap",
  windowsYYC: "windowsYYC",
  "base-module-windows-x64": "base-module-windows-x64",
  "base-module-osx-x64": "base-module-osx-x64",
  "base-module-osx-arm64": "base-module-osx-arm64",
  "base-module-linux-x64": "base-module-linux-x64",
  "base-module-linux-arm64": "base-module-linux-arm64",
  "base-module-linux-arm": "base-module-linux-arm",
};

export type RuntimeReceipt = typeof defaultRuntimeReceipt;
