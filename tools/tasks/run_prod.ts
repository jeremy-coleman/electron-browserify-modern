var spawn = require('child_process').spawn
var fs = require('fs')
var path = require('path')
var browserify = require('browserify')
var watchify = require('watchify')
var tsify = require('tsify')
var babelify = require('babelify')
var _ = require('lodash')
var ts = require('typescript')
var tinyify = require('tinyify')
var electron = require('electron')
//const livereactload = require('livereactload');
var gulp = require('gulp')
var jetpack = require('fs-jetpack')
var streamify = require('gulp-streamify')
var terser = require('gulp-terser')
var source = require('vinyl-source-stream')
var rename = require('gulp-rename')

import {getFileSize, POSTCSS_HOT_CONFIG, excludeModules, BABEL_PROD_CONFIG, BROWSERIFY_BASE_CONFIG, compileDesktop, PATHS} from '..'

process.env.NODE_ENV == 'production'
process.env.BABEL_ENV == 'production'

compileDesktop()

function copyAppDir() {jetpack.copy('src', 'dist', {
  overwrite: true,
  matching: ['*.html', "*.ico","*.svg"]
 });
}
copyAppDir()


const b = browserify(BROWSERIFY_BASE_CONFIG)
b.exclude(excludeModules)
b.plugin(tsify)
b.transform(babelify.configure(BABEL_PROD_CONFIG))
b.transform(require('browserify-postcss'), POSTCSS_HOT_CONFIG)

b.plugin(tinyify, {
  env: {
    NODE_ENV: 'production',
    BABEL_ENV: 'production'
  }
}) 

b.on('error', console.log)
b.on('syntax', console.log)


async function launch() {
  console.log('launching electron')
  console.log(`BUNDLE SIZE: ${getFileSize(PATHS.client.OUT_FILE)}`)
  const child = spawn(electron, ['dist/desktop/main.js'], {detached: false, stdio: 'inherit'})
  child.on('close', () => {
    console.log('electron is done')
    process.exit(0)
  })
};



//the production bundle task
gulp.task('bundle:core', () => {
  var bundler = b.bundle().on('error',console.error)
  return bundler
    .pipe(source('app.js'))
    .pipe(streamify(terser()))
    .pipe(rename(PATHS.client.OUT_FILE))
    .pipe(gulp.dest('.'))
})

gulp.task('bundle:postcheck', async () => {
return console.log(`BUNDLE SIZE: ${getFileSize(PATHS.client.OUT_FILE)}`)
})

gulp.task('run:prod', gulp.series('bundle:core', 'bundle:postcheck'))