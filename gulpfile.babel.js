import gulp from 'gulp'
import fs from 'fs'
import del from 'del'
import cache from 'gulp-cached'
import browserSync from 'browser-sync'
import rename from 'gulp-rename'
import data from 'gulp-data'
import nunjucks from 'gulp-nunjucks'
import nunjucksCache from 'gulp-nunjucks-inheritance'
import babel from 'gulp-babel'
import uglify from 'gulp-uglify'
import sass from 'gulp-sass'
import sassCache from 'gulp-better-sass-inheritance'
import autoprefixer from 'gulp-autoprefixer'
import minifyCss from 'gulp-minify-css'

import debug from 'gulp-debug'

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
    src: 'src/js/**/*.js',
    dest: 'dist/js',
  },
  scss: {
    src: 'src/scss/**/*.scss',
    dest: 'dist/css',
  },
}

gulp.task('browser-sync', () => browserSync({
  server: {
    baseDir: './dist',
  }
}))

gulp.task('bs-reload',  done => {
  browserSync.reload()
  done();
})

gulp.task('clean', () => del(['dist/']))

gulp.task('html', () => gulp.src(paths.html.src)
  .pipe(cache('njk'))
  .pipe(nunjucksCache({base: 'src'}))
  .pipe(data(() => JSON.parse(fs.readFileSync(paths.data))))
  .pipe(nunjucks.compile())
  .pipe(rename({extname: '.html'}))
  .pipe(gulp.dest(paths.html.dest))
)

gulp.task('asset', () => gulp.src(paths.asset.src)
  .pipe(gulp.dest(paths.asset.dest))
)

gulp.task('js', () => gulp.src(paths.js.src)
  .pipe(cache('js'))
  .pipe(babel())
  .pipe(gulp.dest(paths.js.dest))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest(paths.js.dest))
  .pipe(browserSync.reload({ stream:true }))
)

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
    makeWatcher(paths.js.src, 'js'),
    makeWatcher([ paths.html.src, paths.data ], 'html', 'bs-reload'),
  )
))
