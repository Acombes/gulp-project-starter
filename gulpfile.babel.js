// Common dependencies
import gulp from 'gulp'
import fs from 'fs'
import cache from 'gulp-cached'
import rename from 'gulp-rename'

const paths = {
  data: 'src/data.json',
  html: {
    src: 'src/nunjucks/**/*.njk',
    dest: 'dist',
    pageSrc: 'src/*.njk'
  },
  asset: {
    src: 'src/asset/**/*',
    dest: 'dist/asset',
  },
  js: {
    bundleSrc: 'src/js/bundled/**/*.js',
    src: 'src/js/*.js',
    dest: 'dist/js',
  },
  scss: {
    src: 'src/scss/**/*.scss',
    dest: 'dist/css',
  },
}

// Start the server and opens a tab
import browserSync from 'browser-sync'
gulp.task('browser-sync', () => browserSync({
  server: {
    baseDir: './dist',
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
gulp.task('asset', () => gulp.src(paths.asset.src)
  .pipe(gulp.dest(paths.asset.dest))
)

// Nunjucks : Compile all nunjucks root files
import data from 'gulp-data'
import nunjucks from 'gulp-nunjucks'
import nunjucksCache from 'gulp-nunjucks-inheritance'
gulp.task('html', () => gulp.src(paths.html.src)
  .pipe(cache('nunjucks'))
  .pipe(nunjucksCache({base: 'src'}))
  .pipe(data(() => JSON.parse(fs.readFileSync(paths.data))))
  .pipe(nunjucks.compile())
  .pipe(rename({extname: '.html'}))
  .pipe(gulp.dest(paths.html.dest))
)

// JS : Bundle the scripts
import glob from 'glob'
import browserify from 'browserify'
import babelify from 'babelify'
import vfsSource from 'vinyl-source-stream'
import vfsBuffer from 'vinyl-buffer'
gulp.task('js:bundle', () => browserify({ entries: glob.sync(paths.js.bundleSrc) })
  .transform(babelify)
  .bundle()
  .pipe(vfsSource('bundle.js'))
  .pipe(vfsBuffer())
  .pipe(gulp.dest(paths.js.dest))
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest(paths.js.dest))
  .pipe(browserSync.reload({ stream: true }))
)


// JS : Handle scripts that are not supposed to be included in the bundle
import babel from 'gulp-babel'
import uglify from 'gulp-uglify'
gulp.task('js:other', () => gulp.src(paths.js.src)
  .pipe(cache('js'))
  .pipe(babel())
  .pipe(gulp.dest(paths.js.dest))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest(paths.js.dest))
  .pipe(browserSync.reload({ stream:true }))
)

gulp.task('js', gulp.parallel('js:other', 'js:bundle'))


// CSS : Handles SCSS files
import sass from 'gulp-sass'
import sassCache from 'gulp-better-sass-inheritance'
import autoprefixer from 'gulp-autoprefixer'
import minifyCss from 'gulp-minify-css'
gulp.task('css', () => gulp.src(paths.scss.src)
  .pipe(cache('css'))
  .pipe(sassCache({base: 'src/scss'}))
  .pipe(sass())
  .pipe(autoprefixer('last 2 versions'))
  .pipe(gulp.dest(paths.scss.dest))
  .pipe(rename({suffix: '.min'}))
  .pipe(minifyCss())
  .pipe(gulp.dest(paths.scss.dest))
  .pipe(browserSync.reload({ stream:true }))
)

function makeWatcher (sources, ...tasks) {
  return () => gulp.watch(sources, gulp.series(...tasks))
}

gulp.task('build', gulp.series('clean', 'html', 'asset', 'css', 'js'))

gulp.task('default', gulp.series(
  'build',
  gulp.parallel(
    'browser-sync',
    makeWatcher(paths.asset.src, 'asset', 'bs-reload'),
    makeWatcher(paths.scss.src, 'css'),
    makeWatcher(paths.js.src, 'js:other'),
    makeWatcher(paths.js.bundleSrc, 'js:bundle'),
    makeWatcher([ paths.html.src, paths.data ], 'html', 'bs-reload'),
  )
))
