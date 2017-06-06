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



gulp.task('demo.netcore.deploy.xcopy', ['demo.deploy:clean'], function () {
    return gulp.src(['demoapp/**/*', '!demoapp/**/*dev*'])
        .pipe(removeCode({ production: true }))
        .pipe(gulp.dest('../jdash-demo'))
})


gulp.task('demo.netcore.deploy:clean', [], function (done) {
    del([
        '../jdash-demo/css/**', '../jdash-demo/index.html', '../jdash-demo/demos/**'
    ], {
            force: true
        }).then(() => done()).catch(err => done(err))
})

gulp.task('demo.netcore.deploy', ['demo.netcore.deploy.xcopy'], () => {
})
