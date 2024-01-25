'use strict'
const { src, dest, watch } = require('gulp');
const sass  = require('gulp-sass')(require('sass'));
const debug = require('gulp-debug');

function compileSass(cb) {
    src('/var/www/html/project/public/css/template/scss/*.scss')
    .pipe(debug({title: 'Source:'}))
    .pipe(sass()).on("error", sass.logError)
    .pipe(dest('/var/www/html/project/public/css/template/'))
    .pipe(debug({title: 'Dest:'}));    
    cb();
}

function compileSassWidget(cb) {
    src('/var/www/html/project/public/css/template/scss/widget/*.scss')
    .pipe(debug({title: 'Source:'}))
    .pipe(sass()).on("error", sass.logError)
    .pipe(dest('/var/www/html/project/public/css/template/widget'))
    .pipe(debug({title: 'Dest:'}));    
    cb();
}

function watchSass() {
    watch('/var/www/html/project/public/css/template/scss', compileSass);
    watch('/var/www/html/project/public/css/template/scss/widget', compileSassWidget);
}

exports.watchSass = watchSass