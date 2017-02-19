var gulp = require('gulp');
const tsConfig = require('./tsconfig.json');
var fs = require('fs');
var webserver = require('gulp-webserver');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var vulcanize = require('gulp-vulcanize');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var merge = require('merge-stream');
var pump = require('pump');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var vinylPaths = require('vinyl-paths');

gulp.task('webserver', function () {
    return gulp.src('./')
        .pipe(webserver({
            livereload: true,
            fallback: 'index.html',
            open: true,
            port: 8001
        }));
});

function compile(op) {
    var browserify = require('browserify'),
        bundler = new browserify({ debug: op.debug || false, transform: [] });
    bundler.add(op.main);
    bundler.plugin('tsify', tsConfig.compilerOptions);
    return new Promise((res, rej) => {
        bundler.bundle(function (err, src, map) {
            if (err) {
                console.log(err.message);
                rej(err)
            }
            fs.writeFileSync(op.out, src);
            res()
        });
    })

}

gulp.task('ts2js-dev', function () {
    var doit = function () {
        return [compile({
            debug: true,
            main: 'src/jdash.ts',
            out: 'debug/jdash-lean.js'
        })]
    }
    return Promise.all(doit()).then(() => {
        return gulp.src([
            'bower_components/interactjs/interact.js',
            'bower_components/axios/dist/axios.js',
            'dist/jdash-lean.js'
        ])
            .pipe(sourcemaps.init())
            .pipe(concat('jdash.js'))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./debug/'));
    });
});

gulp.task('generate-native-only', function (cb) {
    var doit = function () {
        return [compile({
            debug: false,
            main: 'src/jdash.ts',
            out: 'dist/jdash-lean.js'
        })]
    }

    return Promise.all(doit()).then(() => {
        var jdash = gulp.src([
            'bower_components/custom-elements/src/native-shim.js',
            'bower_components/interactjs/interact.js',
            'bower_components/axios/dist/axios.js',
            'dist/jdash-lean.js'
        ])
            .pipe(concat('jdash.native.min.js'))
            //.pipe(uglify())
            .pipe(gulp.dest('./dist/'));

        return merge(jdash);
    });
});



gulp.task('generate-full', function (cb) {
    var doit = function () {
        return [compile({
            debug: false,
            main: 'src/jdash.ts',
            out: 'dist/jdash-lean.js'
        })]
    }

    return Promise.all(doit()).then(() => {
        var jdash = gulp.src([
            'bower_components/custom-elements/custom-elements.min.js',
            'bower_components/webcomponentsjs/HTMLImports.min.js',
            'bower_components/custom-elements/src/native-shim.js',
            'bower_components/es6-promise/es6-promise.min.js',
            'bower_components/interactjs/interact.js',
            'bower_components/axios/dist/axios.js',
            'dist/jdash-lean.js'
        ])
            .pipe(concat('jdash.min.js'))
            //.pipe(uglify())
            .pipe(gulp.dest('./dist/'));

        return merge(jdash);
    });
});

gulp.task('polyfills', function () {
    return gulp.src([
        'bower_components/custom-elements/src/native-shim.js',
        'bower_components/custom-elements/custom-elements.min.js',
        'bower_components/webcomponentsjs/HTMLImports.min.js',
        'bower_components/es6-promise/es6-promise.min.js'
    ])
        .pipe(concat('polyfills.js'))
        .pipe(gulp.dest('./debug/'));
})

gulp.task('polyfills-deploy', function () {
    return gulp.src([
        'bower_components/custom-elements/src/native-shim.js',
        'bower_components/custom-elements/src/custom-elements.min.js',
        'bower_components/webcomponentsjs/HTMLImports.min.js',
        'bower_components/es6-promise/es6-promise.min.js'
    ])
        .pipe(concat('polyfills.js'))
        .pipe(gulp.dest('./dist/'));
})

gulp.task('min-deploy', function (cb) {
    pump([
        gulp.src('dist/*.js'),
        uglify(),
        gulp.dest('dist')
    ],
        cb
    );
})

gulp.task('fonts', function () {
    return gulp.src(['./fonts/**/*'])
        .pipe(gulp.dest('./debug/fonts'))
})

gulp.task('fonts-deploy', function () {
    return gulp.src(['./fonts/**/*'])
        .pipe(gulp.dest('./dist/fonts'))
})

gulp.task('sass-deploy', ['fonts-deploy'], function () {
    return merge(gulp.src('./src/sass/**/jdash.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS())
        .pipe(gulp.dest('./dist/components')),
        gulp.src('./src/sass/**/jdash.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(cleanCSS())
            .pipe(gulp.dest('./src/components/jdash'))
    );
});

gulp.task('sass', ['fonts'], function () {
    return merge(gulp.src('./src/sass/**/jdash.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS())
        .pipe(gulp.dest('./debug/components')),
        gulp.src('./src/sass/**/jdash.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(cleanCSS())
            .pipe(gulp.dest('./src/components/jdash'))
    );
});

gulp.task('vulcanize', ['sass'], function () {
    return merge(gulp.src('./src/components/jdash/index.html')
        .pipe(vulcanize({
            abspath: '',
            excludes: [],
            stripExcludes: false,
            inlineCss: true
        }))
        .pipe(concat('jdash.html'))
        .pipe(gulp.dest('debug/components')),
        gulp.src('./src/components/bs/index.html')
            .pipe(vulcanize({
                abspath: '',
                excludes: [],
                stripExcludes: false,
                inlineCss: true
            }))
            .pipe(concat('bs.html'))
            .pipe(gulp.dest('debug/components'))
    );
});

gulp.task('vulcanize-deploy', ['sass-deploy'], function () {
    return merge(gulp.src('./src/components/jdash/index.html')
        .pipe(vulcanize({
            abspath: '',
            excludes: [],
            stripExcludes: false,
            inlineCss: true
        }))
        .pipe(concat('jdash.html'))
        .pipe(gulp.dest('dist/components')), gulp.src('./src/components/bs/index.html')
            .pipe(vulcanize({
                abspath: '',
                excludes: [],
                stripExcludes: false,
                inlineCss: true
            }))
            .pipe(concat('bs.html'))
            .pipe(gulp.dest('dist/components')));
});


gulp.task('dev', ['ts2js-dev', 'polyfills', 'sass', 'vulcanize', 'webserver'], function () {
    gulp.watch('src/**/*.ts', ['ts2js-dev']);
    gulp.watch('src/sass/**/*.scss', ['sass']);
    gulp.watch('src/**/*.html', ['vulcanize']);
});


gulp.task('deploy', ['generate-native-only', 'generate-full', 'sass-deploy', 'vulcanize-deploy']);

