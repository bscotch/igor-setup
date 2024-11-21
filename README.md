# igor-setup

This action allows you to set up the [Igor executable](https://manual.gamemaker.io/beta/en/#t=Settings%2FBuilding_via_Command_Line.htm) to build GameMaker projects with the [Igor-Build](https://github.com/bscotch/igor-build) GitHub Action.

### Caveats

- Only supports the following build targets:
  - Windows
  - Android
  - iOS

## Usage

### Inputs

```yaml
- uses: bscotch/igor-setup@v1
  with:
    # See the Access Key section of https://manual.gamemaker.io/beta/en/#t=Settings%2FBuilding_via_Command_Line.htm
    # Required
    access-key:

    # Version Spec of the GameMaker runtime to use. Will override the inferred version from `target-yyp` if provided.
    runtime-version:

    # Path to a yyp file to set the runtime version based on the IDE version.
    target-yyp:

    # Path to a file to overwrite the default local_settings.json that defines the platform preferences and SDK paths. See https://manual.gamemaker.io/beta/en/#t=Setting_Up_And_Version_Information%2FPlatform_Preferences.htm
    # Note that for the key "machine.Platform Settings.Android.Keystore.keystore_alias_password" and "machine.Platform Settings.Android.Keystore.keystore_password", they should be copied directly from the local_settings.json file instead of the IDE, as the file uses the encrypted string.
    # Optional. The default will set up against GitHub hosted runner environments https://github.com/actions/runner-images
    local-settings-override-file:

    # Path to a file to overwrite the default devices.json that defines the Device Manager. See https://manual.gamemaker.io/beta/en/#t=Setting_Up_And_Version_Information%2FThe_Device_Manager.htm
    # Optional. Default is no target devices.
    devices-settings-override-file:

    # A comma separated string for the modules to install
    # Optional. Default is 'windows' for windows runner, 'android' for Linux runner, and "ios" for MacOS runner
    modules:

    # Set to 'true' to cache the runtime for future workflow runs
    # Default: 'false'
    cache:

    #Aliased version of `modules`.
    module:
```

### Outputs

| Name               | Description                                                                                           | Example                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `runtime-dir`      | The directory containing the installed runtime.                                                       | `C:\ProgramData\GameMaker-Beta\Cache\runtimes\runtime-2024.200.0.516\` |
| `user-dir`         | The directory containing the `local_settings.json` and license file                                   | `C:\user_dir\`                                                         |
| `settings-dir`     | The path to the `local_settings.json` file                                                            | `C:\user_dir\local_settings.json`                                      |
| `cache-dir`        | The value for `machine.General Settings.Paths.IDE.AssetCacheFolder` in the `local_settings.json` file | `C:\cache`                                                             |
| `temp-dir`         | The value for `machine.General Settings.Paths.IDE.TempFolder` in the `local_settings.json` file       | `C:\temp`                                                              |
| `bootstrapper-dir` | The directory containing the Igor bootstrapper. Useful for caching.                                   | `C:\boostrapper`                                                       |

## Examples

See <https://github.com/bscotch/ganary/blob/main/.github/workflows/ci.yml>
