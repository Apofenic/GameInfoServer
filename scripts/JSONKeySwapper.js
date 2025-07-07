#!/usr/bin/env node

/**
 * JSON key mapper script
 *
 * This script takes a JSON file and maps specified keys to new keys,
 * then outputs the transformed JSON to a new file or stdout.
 *
 * Usage:
 *   node convert.js --input=input.json --output=output.json --map='{"oldKey":"newKey","anotherKey":"anotherNewKey"}'
 *
 * Options:
 *   --input, -i    Input JSON file path
 *   --output, -o   Output JSON file path (optional, defaults to stdout)
 *   --map, -m      JSON mapping of old keys to new keys
 *   --help, -h     Show help
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    options[key] = value;
  } else if (arg.startsWith('-')) {
    const key = arg.slice(1, 2);
    const value = arg.slice(2) || args[args.indexOf(arg) + 1];

    switch (key) {
      case 'i':
        options.input = value;
        break;
      case 'o':
        options.output = value;
        break;
      case 'm':
        options.map = value;
        break;
      case 'h':
        options.help = true;
        break;
    }
  }
}

// Show help if requested or if required args are missing
if (options.help || !options.input || !options.map) {
  console.log(`
JSON Key Mapper

Usage:
  node convert.js --input=input.json --output=output.json --map='{"oldKey":"newKey","anotherKey":"anotherNewKey"}'

Options:
  --input, -i    Input JSON file path
  --output, -o   Output JSON file path (optional, defaults to stdout)
  --map, -m      JSON mapping of old keys to new keys
  --help, -h     Show this help message
  `);
  process.exit(options.help ? 0 : 1);
}

// Parse the mapping
let keyMapping;
try {
  keyMapping = JSON.parse(options.map);
} catch (error) {
  console.error('Error: Invalid JSON mapping. Please provide a valid JSON object.');
  process.exit(1);
}

// Read and parse the input JSON file
let jsonData;
try {
  const inputFilePath = path.resolve(options.input);
  const jsonContent = fs.readFileSync(inputFilePath, 'utf8');
  jsonData = JSON.parse(jsonContent);
} catch (error) {
  console.error(`Error reading or parsing input file: ${error.message}`);
  process.exit(1);
}

function transformKeys(obj, mapping) {
  if (Array.isArray(obj)) {
    // If it's an array, transform each element
    return obj.map((item) => transformKeys(item, mapping));
  } else if (obj !== null && typeof obj === 'object') {
    // If it's an object, transform its keys
    return Object.keys(obj).reduce((result, key) => {
      const newKey = mapping[key] || key;
      result[newKey] = transformKeys(obj[key], mapping);
      return result;
    }, {});
  } else {
    // If it's a primitive value, return as is
    return obj;
  }
}

// Transform the JSON data
const transformedData = transformKeys(jsonData, keyMapping);

// Output the transformed data
if (options.output) {
  try {
    const outputFilePath = path.resolve(options.output);
    fs.writeFileSync(outputFilePath, JSON.stringify(transformedData, null, 2));
    console.log(`Successfully transformed JSON and saved to ${outputFilePath}`);
  } catch (error) {
    console.error(`Error writing output file: ${error.message}`);
    process.exit(1);
  }
} else {
  // Output to stdout if no output file is specified
  console.log(JSON.stringify(transformedData, null, 2));
}
