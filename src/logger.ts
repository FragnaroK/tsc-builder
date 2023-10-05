import chalk from 'chalk';

interface LoggerInterface {
    l: (message: string) => void;
    e: (message: string) => void;
    d: (message: string) => void;
    i: (message: string) => void;
}

export default class Logger implements LoggerInterface {
 
    private origin: string;
    private debugMode: boolean = false;

    constructor(origin: string, debugMode: boolean = false) {
        this.origin = origin;
        this.debugMode = debugMode;
    }

    private formatedMessage(message: string) {
        return chalk.gray(`[${this.origin}]`) + chalk.bold(' > ') + message;
    }

    setDebugMode(mode: boolean) {
        this.debugMode = mode;
    }

    l(message: string, ...args: any[]) {
        console.log(
            this.formatedMessage(
                chalk.gray(message)
            ),
            ...args
        );
    }

    e(message: string, ...args: any[]) {
        console.error(
            this.formatedMessage(
                chalk.redBright(message)
            ),
            ...args
        );
    }

    d(message: string, ...args: any[]) {
       if (this.debugMode) {
           console.debug(
            chalk.dim('(DEBUG)'),
                this.formatedMessage(
                    chalk.blueBright(message)
                ),
                ...args
           );
       }
    }

    i(message: string, ...args: any[]) {
        console.info(
            this.formatedMessage(
                chalk.cyanBright(message)
            ),
            ...args
        );
    }

    blank(lines: number = 1) {
        for (let i = 0; i < lines; i++) {
            console.log();
        }
    }
}