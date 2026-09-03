import gulp from "gulp";
import gulpSassPlugin from "gulp-sass";
import * as dartSass from "sass";
import autoprefixer from "gulp-autoprefixer";
import cleanCss from "gulp-clean-css";
import rename from "gulp-rename";
import replace from "gulp-replace";
import { deleteAsync } from "del";
import * as esbuild from "esbuild";

const { src, dest, watch: gulpWatch, series, parallel } = gulp;
const sass = gulpSassPlugin(dartSass);

const paths = {
  scssEntry: "src/scss/main.scss",
  scssWatch: "src/scss/**/*.scss",
  jsEntry: "src/js/main.js",
  jsWatch: "src/js/**/*.js",
  assets: "public/assets/**/*",
  html: "index.html",
  outDir: "dist"
};

export function clean() {
  return deleteAsync([paths.outDir]);
}

export function styles() {
  return src(paths.scssEntry)
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(cleanCss({ level: 2 }))
    .pipe(rename("main.min.css"))
    .pipe(dest(paths.outDir));
}

export async function scripts() {
  await esbuild.build({
    entryPoints: [paths.jsEntry],
    bundle: true,
    minify: true,
    sourcemap: false,
    target: "es2019",
    format: "iife",
    outfile: `${paths.outDir}/main.min.js`,
    logLevel: "warning"
  });
}

export function copyAssets() {
  return src(paths.assets, { base: "public", encoding: false }).pipe(dest(paths.outDir));
}

export function html() {
  return src(paths.html)
    .pipe(replace('<link rel="stylesheet" href="/src/scss/main.scss" />', '<link rel="stylesheet" href="./main.min.css" />'))
    .pipe(replace('<script type="module" src="/src/js/main.js"></script>', '<script defer src="./main.min.js"></script>'))
    .pipe(dest(paths.outDir));
}

export function watchFiles() {
  gulpWatch(paths.scssWatch, styles);
  gulpWatch(paths.jsWatch, scripts);
  gulpWatch(paths.assets, copyAssets);
  gulpWatch(paths.html, html);
}

export const build = series(clean, parallel(styles, scripts, copyAssets, html));
export const watch = series(build, watchFiles);

export default build;
