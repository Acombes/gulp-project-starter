// Common dependencies
import gulp from 'gulp'
import fs from 'fs'
import cache from 'gulp-cached'
import rename from 'gulp-rename'
import path from 'path'

import config from './config/config'


// Start the server and opens a tab
import browserSync from 'browser-sync'
gulp.task('browser-sync', () => browserSync({
  server: {
    baseDir: config.serverBaseDir,
  }
}))

// Reload the browser
gulp.task('bs-reload',  done => {
  browserSync.reload()
  done();
})

// Remove the dist directory
import del from 'del'
gulp.task('clean', () => del(['dist/']))

// Copy every assets into the dist directory
gulp.task('asset', () => gulp.src(config.paths.asset.src)
  .pipe(gulp.dest(config.paths.asset.dest))
)

// Nunjucks : Compile all nunjucks root files
import nunjucks from 'nunjucks'
import gulpNunjucks from 'gulp-nunjucks'
import nunjucksCache from 'gulp-nunjucks-inheritance'
import NunjucksSvgUse from './config/NunjucksSvgUse'

const nunjucksEnv = new nunjucks.configure(config.paths.html.pageSrcDir)
nunjucksEnv.addExtension('NunjucksSvgUse', new NunjucksSvgUse(
  config.spriteClass,
  path.relative(config.serverBaseDir, `${config.paths.svg.dest}/${config.paths.svg.spriteName}`)
))

gulp.task('html', () => gulp.src(config.paths.html.src)
  .pipe(cache('nunjucks'))
  .pipe(nunjucksCache({base: 'src'}))
  .pipe(gulpNunjucks.compile(JSON.parse(fs.readFileSync(config.paths.data)), { env: nunjucksEnv }))
  .pipe(rename({extname: '.html'}))
  .pipe(gulp.dest(config.paths.html.dest))
)

// JS : Bundle the scripts
import glob from 'glob'
import browserify from 'browserify'
import babelify from 'babelify'
import vfsSource from 'vinyl-source-stream'
import vfsBuffer from 'vinyl-buffer'
gulp.task('js:bundle', () => browserify({ entries: glob.sync(config.paths.js.bundleSrc) })
  .transform(babelify)
  .bundle()
  .pipe(vfsSource('bundle.js'))
  .pipe(vfsBuffer())
  .pipe(gulp.dest(config.paths.js.dest))
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest(config.paths.js.dest))
  .pipe(browserSync.reload({ stream: true }))
)


// JS : Handle scripts that are not supposed to be included in the bundle
import babel from 'gulp-babel'
import uglify from 'gulp-uglify'
gulp.task('js:other', () => gulp.src(config.paths.js.src)
  .pipe(cache('js'))
  .pipe(babel())
  .pipe(gulp.dest(config.paths.js.dest))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest(config.paths.js.dest))
  .pipe(browserSync.reload({ stream:true }))
)

gulp.task('js', gulp.parallel('js:other', 'js:bundle'))


// CSS : Handles SCSS files
import sass from 'gulp-sass'
import sassCache from 'gulp-better-sass-inheritance'
import autoprefixer from 'gulp-autoprefixer'
import minifyCss from 'gulp-minify-css'
gulp.task('css', () => gulp.src(config.paths.scss.src)
  .pipe(cache('css'))
  .pipe(sassCache({base: 'src/scss'}))
  .pipe(sass())
  .pipe(autoprefixer('last 2 versions'))
  .pipe(gulp.dest(config.paths.scss.dest))
  .pipe(rename({suffix: '.min'}))
  .pipe(minifyCss())
  .pipe(gulp.dest(config.paths.scss.dest))
  .pipe(browserSync.reload({ stream:true }))
)

// SVG : Create sprite
import svgSprite from 'gulp-svg-sprite'
gulp.task('sprite', () => gulp.src(config.paths.svg.src)
  .pipe(svgSprite({
    dest: '.',
    mode: {
      symbol: {
        dest: '.',
        sprite: config.paths.svg.spriteName,
      },
    },
    svg: {
      namespaceClassnames: false,
    },
  }))
  .pipe(gulp.dest(config.paths.svg.dest))
  .pipe(browserSync.reload({ stream:true }))
)


function makeWatcher (sources, ...tasks) {
  return () => gulp.watch(sources, gulp.series(...tasks))
}

gulp.task('build', gulp.series('clean', 'html', 'asset', 'css', 'js', 'sprite'))

gulp.task('default', gulp.series(
  'build',
  gulp.parallel(
    'browser-sync',
    makeWatcher(config.paths.asset.src, 'asset', 'bs-reload'),
    makeWatcher(config.paths.scss.src, 'css'),
    makeWatcher(config.paths.js.src, 'js:other'),
    makeWatcher(config.paths.js.bundleSrc, 'js:bundle'),
    makeWatcher(config.paths.svg.src, 'sprite'),
    makeWatcher([ `${config.paths.html.pageSrcDir}/*.njk`, config.paths.html.src, config.paths.data ], 'html', 'bs-reload'),
  )
))
