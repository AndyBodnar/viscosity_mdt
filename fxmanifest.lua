fx_version 'cerulean'
games { 'gta5' }

name 'viscosity_mdt'
description 'Viscosity MDT — tablet NUI (character, DMV, settings; PD later).'
author 'viscosity'
version '0.1.0'

ui_page 'html/index.html'

client_scripts {
    'client/main.lua',
}

files {
    'html/index.html',
    'html/style.css',
    'html/app.js',
    'html/img/tablet.png',
}

dependency 'viscosity_core'
