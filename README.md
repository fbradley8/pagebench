# PageBench

PageBench is a webpage benchmarking tool built with Electron. It repeatedly loads a single page and returns an average load time. This type of testing gives a more accurate performance indicator since the page and all its requirements are rendered in a real web browser (Chromium).

## To Use and Test

To use PageBench you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)).

Once you have those installed run:

```bash
git clone https://github.com/fbradley8/pagebench
cd pagebench
npm install && npm start
```

Someday I'll package this into a fancy installer.

## To Build and Deploy

To create a portable 64-bit Windows executable run:

```bash
npm run build
```

The portable application will be created in pagebench\dist\PageBench-win32-x64. Everything in that folder is required for the exe to run. The exe itself is not portable.

## Compatibility

PageBench works on Mac, Windows, and Linux
