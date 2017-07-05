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

gulp.task('demo.deploy:copy-assets', [], function () {
    return gulp.src(['demoapp/assets/**/*']).pipe(gulp.dest(demodir + '/assets'));
});

gulp.task('demo.deploy.xcopy', ['demo.deploy:clean', 'demo.deploy:copy-assets'], function () {
    return gulp.src(['demoapp/**/*', '!demoapp/**/*dev*', '!demoapp/assets/**/*'])
        .pipe(removeCode({ nodev: true, noprod: false, nopremise: true }))
        .pipe(gulp.dest(demodir));

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


gulp.task('demo.dev', ['demo.deploy'], () => {
    gulp.watch('demoapp/**/*', ['demo.deploy']);
})