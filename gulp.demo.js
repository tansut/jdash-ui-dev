var gulp = require('gulp');
var ts = require('gulp-typescript');
var fs = require('fs');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var webserver = require('gulp-webserver');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var merge = require('merge-stream');
var del = require('del');
var webRoot = exports.WEBROOT = __dirname + '/';


gulp.task('demo.deploy.xcopy', ['demo.deploy:clean'], function () {
    return gulp.src(['demoapp/**/*', '!demoapp/**/*dev*'])
        .pipe(gulp.dest('demoapp-deploy'))
})

// gulp.task('demo.vendor', [], function () {
//     return merge([
//         gulp.src(['./node_modules/jdash-ui/dist/jdash.min.js', './node_modules/jdash-ui/lib/components/**/*', './node_modules/jdash-ui/lib/fonts/**/*'], { base: './node_modules/jdash-ui/lib/' })
//             .pipe(gulp.dest('demo/lib/jdash/')),
//         gulp.src(['./node_modules/axios/dist/axios.min.js'], { base: './node_modules/axios/dist/' })
//             .pipe(gulp.dest('demo/lib/axios/')),
//     ])
// })

// gulp.task('demo.minijs', ['demo.deploy.xcopy'], () => {
//     return gulp.src(['demo/**/app.js'])
//         .pipe(uglify())
//         .pipe(gulp.dest('demo'));
// })

gulp.task('demo.deploy:clean', [], function (done) {
    del([
        './demoapp-deploy'
    ], {
            force: true
        }).then(() => done()).catch(err => done(err))
})

gulp.task('demo.deploy', ['demo.deploy.xcopy'], () => {
})


gulp.task('demo.dev', ['demo.deploy'], () => {
    gulp.watch('demoapp/**/*', ['demo.deploy']);
})