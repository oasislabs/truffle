var copy = require("./copy");
var path = require("path");
var fs = require("fs");

var templates = {
  test: {
    filename: path.join(__dirname, "templates", "example.js"),
    variable: "example"
  },
  contract: {
    filename: path.join(__dirname, "templates", "Example.sol"),
    name: "Example",
    variable: "example"
  },
  rust_contract: {
    filename: path.join(__dirname, "templates", "example"),
    name: "Example",
    variable: "example"
  },
  migration: {
    filename: path.join(__dirname, "templates", "migration.js"),
  }
};

var processFile = function(file_path, processfn, callback) {
  fs.readFile(file_path, {encoding: "utf8"}, function(err, data) {
    if (err != null) {
      callback(err);
      return;
    }

    var result = processfn(data);
    fs.writeFile(file_path, result, {encoding: "utf8"}, callback);
  });
};

var replaceContents = function(file_path, find, replacement, callback) {
  processFile(file_path, function(data) {
    if (typeof find == "string") {
      find = new RegExp(find, "g");
    }
    return data.replace(find, replacement);
  }, callback);
};

var toUnderscoreFromCamel = function(string) {
  return toDelimiterFromCamel(string, "_");
};

var toHyphenFromCamel = function(string) {
  return toDelimiterFromCamel(string, "-");
};

var toDelimiterFromCamel = function(string, delimiter) {
  string = string.replace(/([A-Z])/g, function($1) {
    return delimiter + $1.toLowerCase();
  });

  if (string[0] == delimiter) {
    string = string.substring(1);
  }

  return string;
};


var Create = {
  rust_contract: function(directory, name, options, callback) {
    if(typeof options == "function") {
      callback = options;
    }

    const crateName = toHyphenFromCamel(name);

    var from = templates.rust_contract.filename;
    var to = path.join(directory, crateName);

    if (!options.force && fs.existsSync(to)) {
      return callback(new Error('Can not create ' + name + ': file exists'));
    }

    copy(from, to, function(err) {
      if (err) return callback(err);

      const cargoTomlPath = path.join(to, "Cargo.toml");
      const contractTraitPath = path.join(to, "src", "lib.rs");
      replaceContents(cargoTomlPath, templates.contract.variable, crateName, callback);
      replaceContents(contractTraitPath, templates.contract.name, name, callback);
    });
  },
  contract: function(directory, name, options, callback) {
    if(typeof options == "function") {
      callback = options;
    }

    var from = templates.contract.filename;
    var to = path.join(directory, name + ".sol");

    if (!options.force && fs.existsSync(to)) {
      return callback(new Error('Can not create ' + name + '.sol: file exists'));
    }

    copy.file(from, to, function(err) {
      if (err) return callback(err);

      replaceContents(to, templates.contract.name, name, callback);
    });
  },

  test: function(directory, name, options, callback) {
    if(typeof options == "function") {
      callback = options;
    }

    var underscored = toUnderscoreFromCamel(name);
    underscored = underscored.replace(/\./g, "_");
    var from = templates.test.filename;
    var to = path.join(directory, underscored + ".js");

    if (!options.force && fs.existsSync(to)) {
      return callback(new Error('Can not create ' + underscored + '.js: file exists'));
    }

    copy.file(from, to, function(err) {
      if (err) return callback(err);

      replaceContents(to, templates.contract.name, name, function(err) {
        if (err) return callback(err);
        replaceContents(to, templates.contract.variable, underscored, callback);
      });
    });
  },
  migration: function(directory, name, options, callback) {
    if(typeof options == "function") {
      callback = options;
    }

    var underscored = toUnderscoreFromCamel(name || "");
    underscored = underscored.replace(/\./g, "_");
    var from = templates.migration.filename;
    var filename = new Date().getTime() / 1000 | 0; // Only do seconds.

    if (name != null && name != "") {
      filename += "_" + underscored;
    }

    filename += ".js";
    var to = path.join(directory, filename);

    if (!options.force && fs.existsSync(to)) {
      return callback(new Error('Can not create ' + filename + ': file exists'));
    }

    copy.file(from, to, callback);
  }
};

module.exports = Create;
