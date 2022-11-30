// Minimal flag support for very basic key-value pairs.
// --name=value --name value --boolean
export default function(key) {
  let args = process.argv;
  for (let i = 2; i < args.length; i++) {
    let arg = args[i];
    if (arg.indexOf('=') !== -1) {
      let parts = arg.split('=');
      if (match(key, parts[0])) return parts[1];
    } else if (match(key, arg)) {
      if (args.length > i + 1 && !isFlag(args[i + 1])) return args[i + 1];
      else return true;
    }
  }
  return null;
}

function match(key, arg) {
  return isFlag(arg) && key == arg.replace(/--?/g, '');
}

function isFlag(key) {
  return /^--?/.test(key);
}
