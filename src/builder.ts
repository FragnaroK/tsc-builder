
import dotenv from 'dotenv';
import packageJson from '../package.json';
import ora, { Ora } from 'ora';
import { exec } from 'child_process';
import fs from 'fs/promises';
import Logger from 'node-logger-cli';
import { BuildType, Settings } from './types';
import path from 'path';

export default class BuildTool {
    constructor() {
        dotenv.config();
        this.settingsFilename = process.env.SETTINGS_FILENAME ?? 'odin';
        this.currPath = process.cwd();
        this.debug_mode = false;
        this.settings = null;
        this.spinner = ora({
            text: 'Doing something...',
            color: 'red',
            spinner: 'dots2',
            indent: 5,
        });
    }

    private settings: Settings | null;
    private settingsFilename: string;
    private currPath: string;
    private debug_mode: boolean;
    private spinner: Ora;

    // * Clear console based on the platform.
    private clearConsole() {
        if (process.platform === 'win32') {
            process.stdout.write('\x1Bc');
        } else {
            process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
        }
    }

    public setDebugMode(debug_mode: boolean) {
        this.debug_mode = debug_mode;
        const log = new Logger('DEBUGGER', this.debug_mode);
        log.i(`Debug mode ${this.debug_mode ? 'enabled' : 'disabled'}`);
    }

    // * Read settings file based on the build type. (e.g. odin.dev.json)
    private async getSettingsFile(buildType: BuildType = 'dev'): Promise<Settings | null> {
        const log = new Logger('SETUP', this.debug_mode);
        log.blank();
        log.i('Getting settings file...');
        log.d('Getting settings file -> ', buildType);
        try {
            this.spinner.start('Getting settings file...');
            const pathJoin = path.join(this.currPath, `${this.settingsFilename}.${buildType}.json`);
            const settingsFile = await fs.readFile(pathJoin, 'utf-8');
            this.spinner.succeed('Settings file found');
            log.d(settingsFile);
            return JSON.parse(settingsFile);
        } catch (error: any) {
            this.spinner.fail('Settings file not found');
            log.e(error.message);
            return null;
        }
    }

    // * Copy files from source to destination, based on the provided settings.
    private async copyFiles(files: string[], source: string, destination: string) {
        const log = new Logger('COPY', this.debug_mode);
        log.blank();
        if (files.length > 0) {
            log.d('Copying files: ', files);
            try {
                const src = path.join(this.currPath, source);
                const dist = path.join(this.currPath, destination);

                log.i(`Copying files from ${source} to ${destination}`);

                await Promise.all(
                    files.map(async (file) => {
                        this.spinner.start(`Copying ${file}...`);
                        const srcFile = path.join(src, file);
                        const distFile = path.join(dist, file);
                        await fs.copyFile(srcFile, distFile);
                        this.spinner.succeed(`${file} copied`);
                    })
                );
            } catch (error: any) {
                this.spinner.fail('Files copy failed');
                log.e(error.message);
            }
        } else {
            log.i('No files to copy');
        }
    }

    // * Delete the previous build in the destination directory. (if any)
    private async deletePreviousBuild(destination: string) {
        const log = new Logger('CLEAN', this.debug_mode);
        log.blank();
        log.i('Deleting previous build...');
        try {
            this.spinner.start('Deleting previous build...');
            const dist = path.join(this.currPath, destination);
            await fs.rm(dist, { recursive: true, force: true });
            this.spinner.succeed('Previous build deleted');
        } catch (error: any) {
            this.spinner.fail('Previous build delete failed');
            log.e(error.message);
        }
    }

    // * Build TypeScript code, optionally using npx. Default is false.
    private async buildTypescript(npx: boolean = false) {
        const log = new Logger('BUILD', this.debug_mode);
        log.blank();
        log.i('Building typescript...');
        try {
            const hasExplicitParams = this.settings?.explicitParams ?? false;
            const cmd = npx ? 'npx tsc' : 'tsc';
            const args = hasExplicitParams ? ` --project ${this.settings?.src}/tsconfig.json ` : '';
            const cliDebugArgs = this.debug_mode ? ' --diagnostics --listFiles --listEmittedFiles ' : '';
            this.spinner.start('Building typescript...');
            await new Promise((resolve, reject) => {
                exec(
                    `${cmd}${cliDebugArgs}${args}`,
                    (error, stdout, stderr) => {
                        if (error || stderr) {
                            this.spinner.fail('Typescript build failed');
                            log.e("Details:", error ?? stderr ?? "Unknown error");
                            reject(error);
                        } else {
                            this.spinner.succeed('Typescript built successfully');
                            log.d(stdout);
                            resolve(stdout);
                        }
                    }
                );
            });
        } catch (error: any) {
            log.e(error);
        }
    }

    // * Build the project based on provided settings. (if any)
    private async build(settings: Settings) {
        const log = new Logger('BUILD', this.debug_mode);
        log.d('Building...');
        try {
            const src = settings.src ?? 'src';
            const dist = settings.dist ?? 'dist';
            const files = settings.files ?? [];

            await this.deletePreviousBuild(dist);
            await this.buildTypescript(settings.npx ?? false).then(async () => {
                if (files) await this.copyFiles(files, src, dist);
            });
        } catch (error: any) {
            log.e(error.message);
        }
    }

    // * Main entry point of the CLI tool, run this to start the build. 
    public async run(args: string[] = process.argv) {
        const log = new Logger('TSC-BUILDER', this.debug_mode);
        log.i(`Starting ${packageJson.name} v${packageJson.version}...`);

        try {
            this.clearConsole();

            if (args.length < 3) {
                log.e('No build type provided');
                throw new Error('No build type provided');
            }

            if (args[3] === '--debug') {
                this.setDebugMode(true);
            }

            const buildType: BuildType = (args[2] || 'dev') as BuildType;

            this.settings = await this.getSettingsFile(buildType);

            if (this.settings) {
                await this.build(this.settings);
            } else {
                log.e('No settings file found', `(${this.settingsFilename}.${buildType}.json)`);
            }
        } catch (error: any) {
            log.e(error.message);
        }
    }
}