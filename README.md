TSC Builder
-----------

TSC Builder is a Node.js command-line utility that helps you build TypeScript projects. It provides functionality to build TypeScript code, copy files, and handle different build configurations using a settings file. This README will guide you on how to use TSC Builder and provide an overview of its features.

### Table of Contents

- [TSC Builder](#tsc-builder)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Configuration](#configuration)
  - [License](#license)

### Getting Started

Before you begin, make sure you have Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

### Installation

You can install TSC Builder globally using npm to access it from the command line:

```
    npm install -g @fragnarok/tsc-builder
```

### Usage

TSC Builder is a command-line tool, and it expects a build type as an argument. For example, to build your project for development, you can run:

`tsc-builder dev`

You can also enable debug mode using the `--debug` flag:

`tsc-builder dev --debug`

### Configuration

TSC Builder relies on a settings file to determine the build configuration. By default, it looks for a file named `odin.dev.json` in your project directory.

Here is an example of a settings file (`odin.dev.json`):

```json
{   
    "src": "src",   
    "dist": "dist",   
    "files": ["index.html", "static"],   
    "npx": false 
}
```

*   `src`: The source directory of your TypeScript files.
*   `dist`: The destination directory for the compiled JavaScript files.
*   `files`: An array of files or directories to be copied to the destination directory.
*   `npx`: Set to `true` if you want to use the TypeScript compiler installed locally using `npx` command. Default is `false`.

### License

TSC Builder is licensed under the ISC License. See the [LICENSE](LICENSE) file for more details.

Feel free to contribute to this project or report any issues on the [GitHub repository](https://github.com/fragnarok/tsc-builder).

Happy coding!