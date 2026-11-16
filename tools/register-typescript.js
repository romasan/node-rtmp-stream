// Some tools import server TypeScript directly and also run outside the CLI.
require('ts-node').register({
    transpileOnly: true,
    compilerOptions: { module: 'commonjs' },
});
