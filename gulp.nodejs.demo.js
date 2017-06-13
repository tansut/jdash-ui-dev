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
var removeCode = require('gulp-remove-code');
const shell = require('gulp-shell')



gulp.task('demo.nodejs.deploy.xcopy', ['demo.nodejs.deploy:clean'], function () {
    return gulp.src(['demoapp/**/*', '!demoapp/**/*dev*'])
        .pipe(removeCode({ nodev: true, noprod: true, nopremise: false }))
        .pipe(gulp.dest('../jdash-nodejs-demoapp'))
})


gulp.task('demo.nodejs.deploy:clean', [], function (done) {
    del([
        '../jdash-nodejs-demoapp/assets/**',
        '../jdash-nodejs-demoapp/css/**',
        '../jdash-nodejs-demoapp/demos/**',
        '../jdash-nodejs-demoapp/index.html'
    ], {
            force: true
        }).then(() => done()).catch(err => done(err))
})

gulp.task('demo.nodejs.deploy', ['demo.nodejs.deploy.xcopy'], () => {
})
