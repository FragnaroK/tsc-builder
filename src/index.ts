#! /usr/bin/env node

import BuildTool from "./builder";

const main = () => {
    const buildTool = new BuildTool();
    buildTool.run();
}


main();