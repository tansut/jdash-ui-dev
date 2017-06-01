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
var demo = require('./gulp.demo');
var removeCode = require('gulp-remove-code');
var git = require('gulp-git');
const shell = require('gulp-shell')

var npmDir = '../deploy/jdash-ui/';

gulp.task('webserver', function () {
    return gulp.src('./')
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
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
        op.remove && (action = action.pipe(removeCode(op.remove)));
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
            'dist/jdash.lean.js'
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
            out: 'dist/jdash.lean.min.js',
            remove: { production: true }
        })]
    }

    return Promise.all(doit()).then(() => {
        var jdash = gulp.src([
            'bower_components/custom-elements/src/native-shim.js',
            'bower_components/interactjs/dist/interact.min.js',
            'node_modules/axios/dist/axios.min.js',
            'dist/jdash.lean.min.js'
        ])
            .pipe(concat('jdash.native.min.js'))
            .pipe(gulp.dest('./dist/'));
        return merge(jdash);
    });
});



gulp.task('deploy-full', ['deploy:clean'], function (cb) {
    var doit = function () {
        return [compile({
            min: true,
            main: 'src/jdash.ts',
            out: 'dist/jdash.lean.min.js',
            remove: { production: true }
        })]
    }

    return Promise.all(doit()).then(() => {
        var jdash = gulp.src([
            'bower_components/custom-elements/custom-elements.min.js',
            'bower_components/webcomponentsjs/HTMLImports.min.js',
            'bower_components/custom-elements/src/native-shim.js',
            'bower_components/es6-promise/es6-promise.auto.min.js',
            'bower_components/interactjs/dist/interact.min.js',
            'node_modules/axios/dist/axios.min.js',
            'dist/jdash.lean.min.js'
        ])
            .pipe(concat('jdash.min.js'))
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

gulp.task('fonts', function () {
    return gulp.src(['./fonts/**/*'])
        .pipe(gulp.dest('./debug/fonts'))
})

gulp.task('fonts-deploy', ['deploy:clean'], function () {
    return gulp.src(['./fonts/**/*'])
        .pipe(gulp.dest('./dist/fonts'))
})

gulp.task('sass-deploy', ['fonts-deploy', 'deploy:clean'], function () {
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
            .pipe(gulp.dest('./src/components/sass'))
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
    gulp.watch('src/sass/**/*.scss', ['sass', 'vulcanize']);
    gulp.watch('src/**/*.html', ['vulcanize']);
});

gulp.task('npm:clean', [], function () {
    return del([
        npmDir + '/dist/**/*',
        '!' + npmDir + 'package.json',
        './dist/jdash.lean.min.js',
    ], {
            force: true
        })
})

gulp.task('deploy:clean', [], function (done) {
    del([
        './dist'
    ], {
            force: true
        }).then(() => done()).catch(err => done(err))
})

gulp.task('tsc-def', ['npm:clean', 'deploy'], function () {
    var tsProject = ts.createProject('tsconfig.json', {
        declaration: false
    });
    var tsResult = tsProject.src()
        .pipe(tsProject());
    return merge([tsResult.dts.pipe(gulp.dest('dist/definitions'))]);

});

gulp.task('npm.deploy', ['npm:clean', 'deploy', 'tsc-def'], function () {
    return merge([gulp.src(['!./dist/jdash.lean.min.js', './dist/**/*']).pipe(gulp.dest(npmDir + 'dist'))])
})


gulp.task('npm.git.push', ['npm.deploy'], shell.task([
    npmDir + 'push.sh'
]))

gulp.task('deploy', ['deploy-native-only', 'deploy-full', 'sass-deploy', 'vulcanize-deploy']);
