export type BuildType = 'dev' | 'prod';

export interface Settings {
    buildType?: BuildType;
    src?: string;
    dist?: string;
    files?: string[];
    settingsFilename?: string;
    npx?: boolean;
    explicitParams?: boolean;
}