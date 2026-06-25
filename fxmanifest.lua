-- ============================================================================
--  viscosity_mdt  ·  (c) 2026 AndyBodnar (Viscosity)
--  https://github.com/AndyBodnar/viscosity_mdt
--  Server use only. No resale, repackaging, or credit removal. See LICENSE.
-- ============================================================================
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
