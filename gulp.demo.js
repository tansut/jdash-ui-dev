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
const shell = require('gulp-shell');

const demodir = '../deploy/jdash-demo';

gulp.task('demo.deploy.xcopy', ['demo.deploy:clean'], function () {
    return gulp.src(['demoapp/**/*', '!demoapp/**/*dev*'])
        .pipe(removeCode({ nodev: true, noprod: false }))
        .pipe(gulp.dest(demodir))
})


gulp.task('demo.deploy:clean', [], function (done) {
    del([
        demodir + '/css/**', demodir + 'index.html', demodir + 'demos/**'
    ], {
            force: true
        }).then(() => done()).catch(err => done(err))
})

gulp.task('demo.deploy', ['demo.deploy.xcopy'], () => {
})

gulp.task('demo.git.push', ['demo.deploy'], shell.task([
    demodir + 'push.sh'
]))


gulp.task('demo.dev', ['demo.deploy'], () => {
    gulp.watch('demoapp/**/*', ['demo.deploy']);
})