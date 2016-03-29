/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

var gulp = require('gulp');
var path = require('path');
var ts = require('gulp-typescript');
var log = require('gulp-util').log;
var typescript = require('typescript');
var sourcemaps = require('gulp-sourcemaps');
var mocha = require('gulp-mocha');
var merge = require('merge2');

var sources = [
    'src',
    'test',
    'typings',
    'node_modules/debugger-for-chrome/lib'
].map(function(tsFolder) { return tsFolder + '/**/*.ts'; });

var bins = [
    'node_modules/debugger-for-chrome/out'
].map(function(tsFolder) { return tsFolder + '/**/*.js'; });

var projectConfig = {
    noImplicitAny: false,
    target: 'ES5',
    module: 'commonjs',
    declaration: true,
    typescript: typescript,
    moduleResolution: "node"
};

gulp.task('build', function () {
    var tsResult = gulp.src(sources, { base: '.' })
        .pipe(sourcemaps.init())
        .pipe(ts(projectConfig));

	return merge([
		tsResult.js
        .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: 'file:///' + __dirname }))
        .pipe(gulp.dest('out'))
        ,
        gulp.src(bins)
        .pipe(gulp.dest('out/src/node_modules/debugger-for-chrome'))
	]);
});

gulp.task('watch', ['build'], function(cb) {
    log('Watching build sources...');
    return gulp.watch(sources, ['build']);
});

gulp.task('default', ['build']);

function test() {
    return gulp.src('out/test/**/*.test.js', { read: false })
        .pipe(mocha({ ui: 'tdd' }))
        .on('error', function(e) {
            log(e ? e.toString() : 'error in test task!');
            this.emit('end');
        });
}

gulp.task('build-test', ['build'], test);
gulp.task('test', test);

gulp.task('watch-build-test', ['build', 'build-test'], function() {
    return gulp.watch(sources, ['build', 'build-test']);
});
