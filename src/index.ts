#! /usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import packageJson from '../package.json';
import ora from 'ora';
import { exec } from 'child_process';
import fs from 'fs/promises';
import Logger from 'node-logger-cli';
import { BuildType, Settings } from './types';
import path from 'path';

// clear console
if (process.platform === 'win32') {
    process.stdout.write('\x1Bc');
} else {
    process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
}

const settingsFilename = process.env.SETTINGS_FILENAME ?? 'odin';
const currPath = process.cwd();
var debug_mode = false;

const spinner = ora({
    text: 'Doing something...',
    color: 'red',
    spinner: 'dots2',
    indent: 5
});

async function getSettingsFile(buildType: BuildType = 'dev'): Promise<Settings | null> {
    const log = new Logger('SETTINGS', debug_mode);
    log.blank();
    log.i("Getting settings file...");
    log.d("Getting settings file -> ", buildType)
    try {
        spinner.start('Getting settings file...');
        const pathJoin = path.join(currPath, `${settingsFilename}.${buildType}.json`);
        const settingsFile = await fs.readFile(pathJoin, 'utf-8');
        spinner.succeed('Settings file found');
        log.d(settingsFile);
        return JSON.parse(settingsFile);
    } catch (error: any) {
        spinner.fail('Settings file not found');
        log.e(error.message);
        return null;
    }
}

async function copyFiles(files: string[], source: string, destination: string) {
    const log = new Logger('COPY', debug_mode);
    log.blank();
   if (files.length > 0) {
    log.d("Copying files: ", files);
    try {
        const src = path.join(currPath, source);
        const dist = path.join(currPath, destination);

        log.i(`Copying files from ${source} to ${destination}`)

        await Promise.all(files.map(async (file) => {
            spinner.start(`Copying ${file}...`);
            const srcFile = path.join(src, file);
            const distFile = path.join(dist, file);
            await fs.copyFile(srcFile, distFile);
            spinner.succeed(`${file} copied`);
        }));

    } catch (error: any) {
        spinner.fail('Files copy failed');
        log.e(error.message);
    }
   } else {
    log.i("No files to copy")
   }
}

async function deletePreviousBuild(destination: string) {
    const log = new Logger('DELETE', debug_mode);
    log.blank();
    log.i("Deleting previous build...");
    try {
        spinner.start('Deleting previous build...');
        const dist = path.join(currPath, destination);
        await fs.rm(dist, { recursive: true, force: true });
        spinner.succeed('Previous build deleted');
    } catch (error: any) {
        spinner.fail('Previous build delete failed');
        log.e(error.message);
    }
}
 
async function buildTypescript(npx: boolean = false) {
    const log = new Logger('TYPESCRIPT', debug_mode);
    log.blank();
    log.i("Building typescript...");
    try {
        spinner.start('Building typescript...');
        await new Promise((resolve, reject) => {
            exec(`${npx ? 'npx' : ''} tsc`,
                (error, stdout) => {
                    if (error) {
                        log.e(error.message);
                        reject(error.message);
                    } else {
                        spinner.succeed('Typescript built successfully');
                        log.d(stdout);
                        resolve(stdout);
                    }
                });
        });
    } catch (error: any) {
        spinner.fail('Typescript build failed');
        log.e(error.message);
    }
} 

async function build(settings: Settings) {
    const log = new Logger('BUILD', debug_mode);
    log.d("Building...");
    try {
        const src = settings.src ?? 'src';
        const dist = settings.dist ?? 'dist';
        const files = settings.files ?? [];

        await deletePreviousBuild(dist);
        await buildTypescript(settings.npx ?? false)
        .then(async () => {
            await copyFiles(files, src, dist);
        });
        
    } catch (error: any) {
        log.e(error.message);
    }
}


async function main(args: string[] = process.argv) {
    const log = new Logger('MAIN');
    log.i(`Starting ${packageJson.name} v${packageJson.version}...`);

    try {


        if (args.length < 3) {
            log.e('No build type provided');
            throw new Error('No build type provided');
        }

        if (args[3] === '--debug') {
            debug_mode = true;
            log.setDebugMode(debug_mode);
        }

        const buildType: BuildType = (args[2] || 'dev') as BuildType;

        const settings: Settings | null = await getSettingsFile(buildType);

        if (settings) {
            await build(settings);
        } else {
            log.e('No settings file found', `(${settingsFilename}.${buildType}.json)`);
        }

    } catch (error: any) {
        log.e(error.message);
    }
}

main();