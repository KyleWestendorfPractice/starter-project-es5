// ------------------
// MODULES
// ------------------

var gulp = require("gulp"),
  jshint = require("gulp-jshint"),
  concat = require("gulp-concat"),
  stripDebug = require("gulp-strip-debug"),
  sass = require("gulp-sass"),
  notify = require("gulp-notify"),
  gutil = require("gulp-util"),
  rename = require("gulp-rename"),
  size = require("gulp-filesize"),
  autoprefixer = require("autoprefixer"),
  postCss = require("gulp-postcss"),
  mqPacker = require("css-mqpacker"),
  pxToRem = require("postcss-pxtorem"),
  sourceMaps = require("gulp-sourcemaps"),
  cssNano = require("gulp-cssnano"),
  browserSync = require("browser-sync").create(),
  watch = require("gulp-watch"),
  cacheBuster = require("postcss-cachebuster"),
  gitStatus = require("git-rev-sync"),
  fs = require("fs"),
  uglify = require("gulp-uglify"),
  imagemin = require("gulp-imagemin"),
  cache = require("gulp-cache"),
  git_branch = "";

// ------------------
//  SETUP
// ------------------

var BS_PORT = 3000;
var LAUNCH_COMMAND = process.env.npm_lifecycle_event;
var isProduction = LAUNCH_COMMAND === "production";

var clientName = "fccc-starter-es5";
var projectName = clientName.toLowerCase().replace(/\s/g, "-");
var jsfiles = [
  "js/base/define.js",
  "js/libs/**/*.js",
  "js/modules/**/*.js",
  "js/base/router.js"
];

var devProcessors = [
  autoprefixer(),
  pxToRem({
    rootValue: 16,
    replace: true,
    mediaQuery: true
  }),
  cacheBuster({
    cssPath: "/assets",
    type: "mtime"
  })
];

var prodProcessors = [
  pxToRem({
    rootValue: 16,
    replace: true,
    mediaQuery: true
  }),
  // mqPacker({sort: true}),
  cacheBuster({
    cssPath: "/assets",
    type: "mtime"
  })
];

// ------------------
//  JS
// ------------------

gulp.task("js:hint", function() {
  gutil.log(gutil.colors.blue("--> Validating JS "));

  gulp.src(["js/base/*.js", "js/modules/*.js"])
    .pipe(jshint())
    .pipe(
      notify(function(file) {
        return file.jshint.success ? false : file.relative + " has errors!";
      })
    )
    .pipe(jshint.reporter("jshint-stylish", {
      verbose: true
    }));
});

gulp.task("js:concat", ["git_check"], function() {
  var environment = "development";

  getBranch(environment);
  gutil.log(gutil.colors.blue("--> Concatenating JS "));

  gulp.src(jsfiles)
    .pipe(concat(projectName + ".min.js"))
    .pipe(gulp.dest("assets"))
    .pipe(size())
    .pipe(browserSync.stream())
    .pipe(notify({
      title: clientName + " JS",
      message: "Browser Refreshed"
    }));
});

gulp.task("js:minify", ["git_check"], function() {
  var environment = "development";

  getBranch(environment);
  gutil.log(gutil.colors.blue("--> Minifying JS...Automate and chill :)"));

  gulp.src(jsfiles)
    .pipe(concat(projectName + ".min.js"))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest("assets"))
    .pipe(size())
    .pipe(notify({
      title: clientName + " JS",
      message: "Uglified"
    }));
});

// ------------------
//  CSS
// ------------------

var watchSrc = ["!assets/*.(js|css)", "html/**/*"];

gulp.task("css:postsass", ["git_check"], function() {
  var environment = "development";

  getBranch(environment);
  gutil.log(gutil.colors.blue("--> Compiling CSS "));

  gulp.src("styles/**/*.scss")
    .pipe(sourceMaps.init())
    .pipe(sass().on("error", sassError))
    .pipe(postCss(devProcessors))
    .pipe(size())
    .pipe(sourceMaps.write())
    .pipe(rename(projectName + ".min.css"))
    .pipe(gulp.dest("assets/"))
    .pipe(browserSync.stream())
    .pipe(notify({
      title: clientName + " CSS",
      message: "CSS Refreshed"
    }));
});

gulp.task("css:post_build", ["git_check"], function() {
  var environment = "development";

  getBranch(environment);
  gutil.log(gutil.colors.blue("--> Making CSS Smaller"));

  gulp.src("styles/**/*.scss")
    .pipe(sass().on("error", sassError))
    .pipe(postCss(prodProcessors))
    .pipe(cssNano({
      autoprefixer: {
        add: true
      },
      zindex: false
    }))
    .pipe(rename(projectName + ".min.css"))
    .pipe(size())
    .pipe(gulp.dest("assets/"))
    .pipe(notify({
      title: clientName + " CSS",
      message: "CSS Refreshed"
    }));
});

// ------------------
//  HTML
// ------------------

gulp.task("copyHTML", function() {
  return gulp.src('html/pages/*.html')
    .pipe(gulp.dest("dist/"))
    .pipe(notify({
      title: "HTML FILES",
      message: "Copied to dist/"
    }));
});

// ------------------
//  ASSETS
// ------------------

gulp.task("assets:copy", function() {
  gutil.log(gutil.colors.blue("--> Copying assets to dist/"));

  return gulp.src("assets/**/*")
    .pipe(gulp.dest("dist/assets/"))
    .pipe(notify({
      message: "Assets task complete"
    }));
});

gulp.task("image:assets", function() {
  gutil.log(gutil.colors.blue("--> Optimizing images"));

  return gulp.src("assets/*.(png|jpg)")
    .pipe(imagemin({
      verbose: true
    }))
    .pipe(gulp.dest("assets/"))
    .pipe(notify({
      message: "Image optimization complete"
    }));
});

// ------------------
//  GIT
// ------------------

gulp.task("git_check", function() {
  var current_branch = gitStatus.branch();

  console.log(current_branch);
  git_branch = current_branch;

  return current_branch;
});

// ------------------
//  HELPERS
// ------------------

function sassError(err) {
  gutil.log(gutil.colors.bold.white.bgRed("\n \n [SASS] ERROR \n"));
  console.error("", err.message);

  return notify({
    title: "Sass Error",
    message: "Error on line " + err.line + " of " + err.file
  }).write(err);
}

function getBranch(env) {
  if (git_branch === "master") {
    env = "production";
  } else if (git_branch === "staging") {
    env = "staging";
  }

  console.log("Git Branch: " + env);
  return env;
}

function isChanged(file) {
  return file.event === "change" || file.event === "add";
}

function isDeleted(file) {
  return file.event === "unlink";
}

// ------------------
//  BROWSERSYNC
// ------------------

gulp.task("bs:reload", function() {
  browserSync.reload();
  gutil.log(gutil.colors.green("HTML Refreshed"));
});

gulp.task("browser-sync", function() {
  browserSync.init({
    host: "localhost", // if external user can't connect, run ipconfig & check ip's - ref: https://browsersync.io/docs/options/#option-host
    port: 3000, // BS_PORT,
    injectChanges: true,
    server: {
      baseDir: [".", "./html/pages"],
      index: "html/pages/index.html",
      serveStaticOptions: {
        extensions: ["html"]
      }
    },
    // Here you can disable/enable each feature individually
    ghostMode: {
      clicks: true, //sync all devices under the same network :) @JW
      forms: true,
      scroll: true
    },
    // switch all off
    ghostMode: false,
    // open browser window on 'gulp'
    open: true
  });
});

// ------------------
//  PROCESSES
// ------------------

gulp.task(
  "default", ["git_check", "js:hint", "js:concat", "css:postsass", "browser-sync"],
  function() {
    gutil.log(gutil.colors.blue("LAUNCH_COMMAND: " + LAUNCH_COMMAND));
    gutil.log(gutil.colors.blue("isProduction: " + isProduction));

    gulp.watch("js/**/*.js", ["git_check", "js:hint", "js:concat"]);
    gulp.watch("styles/**/*.scss", ["git_check", "css:postsass"]);
    gulp.watch(watchSrc, ["git_check", "bs:reload"]);
  }
);

gulp.task("build", ["image:assets", "js:minify", "css:post_build", "copyHTML", "assets:copy"], function() {
  gutil.log(gutil.colors.blue("LAUNCH_COMMAND: " + LAUNCH_COMMAND));
  gutil.log(gutil.colors.blue("isProduction: " + isProduction));

  gulp.src("gulpfile.js").pipe(
    notify({
      title: "Build Scripts",
      message: "Finished!"
    })
  );
});
