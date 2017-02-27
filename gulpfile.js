var gulp = require('gulp');
const tsConfig = require('./tsconfig.json');
var fs = require('fs');
var webserver = require('gulp-webserver');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var vulcanize = require('gulp-vulcanize');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourceStream = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var merge = require('merge-stream');
var pump = require('pump');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var vinylPaths = require('vinyl-paths');
var ts = require('gulp-typescript');




var npmDir = '../jdash-ui/';

gulp.task('webserver', function () {
    return gulp.src('./')
        .pipe(webserver({
            livereload: true,
            fallback: 'index.html',
            open: true,
            port: 8002
        }));
});

function compile(op) {
    var browserify = require('browserify'),
        bundler = new browserify({ debug: op.debug || false, transform: [] });
    bundler.add(op.main);
    bundler.plugin('tsify', tsConfig.compilerOptions);
    return new Promise((res, rej) => {
        var action = bundler.bundle();
        action = action.pipe(sourceStream(op.out))
        action = action.pipe(buffer())
        op.min && (action = (uglif = action.pipe(uglify())));
        var dest = gulp.dest('./')
        dest.on('end', () => { res(); })
        action.pipe(dest);
    })

}

gulp.task('ts2js-dev', function () {
    var doit = function () {
        return [compile({
            debug: true,
            main: 'src/jdash.ts',
            out: './debug/jdash.lean.js'
        })]
    }
    return Promise.all(doit()).then(() => {
        return gulp.src([
            'bower_components/interactjs/interact.js',
            'lib/jdash.lean.js'
        ])
            .pipe(sourcemaps.init())
            .pipe(concat('jdash.js'))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./debug/'));
    });
});

gulp.task('deploy-native-only', ['deploy:clean'], function (cb) {
    var doit = function () {
        return [compile({
            min: true,
            main: 'src/jdash.ts',
            out: 'lib/jdash.lean.min.js'
        })]
    }

    return Promise.all(doit()).then(() => {
        var jdash = gulp.src([
            'bower_components/custom-elements/src/native-shim.js',
            'bower_components/interactjs/dist/interact.min.js',
            'lib/jdash.lean.min.js'
        ])
            .pipe(concat('jdash.native.min.js'))
            .pipe(gulp.dest('./lib/'));

        return merge(jdash);
    });
});



gulp.task('deploy-full', ['deploy:clean'], function (cb) {
    var doit = function () {
        return [compile({
            min: true,
            main: 'src/jdash.ts',
            out: 'lib/jdash.lean.min.js'
        })]
    }

    return Promise.all(doit()).then(() => {
        var jdash = gulp.src([
            'bower_components/custom-elements/custom-elements.min.js',
            'bower_components/webcomponentsjs/HTMLImports.min.js',
            'bower_components/custom-elements/src/native-shim.js',
            'bower_components/es6-promise/es6-promise.auto.min.js',
            'bower_components/interactjs/dist/interact.min.js',
            'lib/jdash.lean.min.js'
        ])
            .pipe(concat('jdash.min.js'))
            .pipe(gulp.dest('./lib/'));

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

// gulp.task('polyfills-deploy', function () {
//     return gulp.src([
//         'bower_components/custom-elements/src/native-shim.js',
//         'bower_components/custom-elements/src/custom-elements.min.js',
//         'bower_components/webcomponentsjs/HTMLImports.min.js',
//         'bower_components/es6-promise/es6-promise.min.js'
//     ])
//         .pipe(concat('polyfills.js'))
//         .pipe(gulp.dest('./lib/'));
// })

// gulp.task('min-deploy', function (cb) {
//     pump([
//         gulp.src('lib/*.js'),
//         uglify(),
//         gulp.dest('lib')
//     ],
//         cb
//     );
// })

gulp.task('fonts', function () {
    return gulp.src(['./fonts/**/*'])
        .pipe(gulp.dest('./debug/fonts'))
})

gulp.task('fonts-deploy', ['deploy:clean'], function () {
    return gulp.src(['./fonts/**/*'])
        .pipe(gulp.dest('./lib/fonts'))
})

gulp.task('sass-deploy', ['fonts-deploy', 'deploy:clean'], function () {
    return merge(gulp.src('./src/sass/**/jdash.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS())
        .pipe(gulp.dest('./lib/components')),
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

gulp.task('vulcanize-deploy', ['sass-deploy', 'deploy:clean'], function () {
    return merge(gulp.src('./src/components/jdash/index.html')
        .pipe(vulcanize({
            abspath: '',
            excludes: [],
            stripExcludes: false,
            inlineCss: true
        }))
        .pipe(concat('jdash.html'))
        .pipe(gulp.dest('lib/components')), gulp.src('./src/components/bs/index.html')
            .pipe(vulcanize({
                abspath: '',
                excludes: [],
                stripExcludes: false,
                inlineCss: true
            }))
            .pipe(concat('bs.html'))
            .pipe(gulp.dest('lib/components')));
});


gulp.task('dev', ['ts2js-dev', 'polyfills', 'sass', 'vulcanize', 'webserver'], function () {
    gulp.watch('src/**/*.ts', ['ts2js-dev']);
    gulp.watch('src/sass/**/*.scss', ['sass']);
    gulp.watch('src/**/*.html', ['vulcanize']);
});

gulp.task('npm:clean', [], function () {
    return del([
        npmDir + '/**/*',
        '!' + npmDir + 'package.json'
    ], {
            force: true
        })
})

gulp.task('deploy:clean', [], function (done) {
    del([
        './lib'
    ], {
            force: true
        }).then(() => done()).catch(err => done(err))
})

gulp.task('tsc-def', ['npm:clean', 'deploy'], function () {
    var tsProject = ts.createProject('tsconfig.json', {
        declaration: true
    });
    var tsResult = tsProject.src()
        .pipe(tsProject());
    return merge([tsResult.dts.pipe(gulp.dest('lib/definitions'))]);

});

gulp.task('npm-deploy', ['npm:clean', 'deploy', 'tsc-def'], function () {
    return merge([gulp.src('./lib/**/*').pipe(gulp.dest(npmDir + 'lib'))])
})

gulp.task('deploy', ['deploy-native-only', 'deploy-full', 'sass-deploy', 'vulcanize-deploy']);
